import { useRuntimeConfig } from '#imports';
import { google } from 'googleapis';
import { createError, defineEventHandler, readBody } from 'h3';

// Quota costs for YouTube Data API v3
const QUOTA_COSTS = {
	search: 100,
	playlistInsert: 50,
	playlistItemInsert: 50,
	videosList: 1,
};

export default defineEventHandler(async event => {
	// Check if user is authenticated
	const session = await getUserSession(event);
	if (!session.user || !session.accessToken) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized - Please sign in with Google',
		});
	}

	// Get playlist data from request body
	const body = await readBody(event);
	const { playlist, title, description } = body;

	if (!playlist || !Array.isArray(playlist) || playlist.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Valid playlist array is required',
		});
	}

	if (!title || typeof title !== 'string') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Playlist title is required',
		});
	}

	// Initialize quota tracking
	let quotaUsed = 0;
	const quotaDetails: Record<string, number> = {
		search: 0,
		playlistInsert: 0,
		playlistItemInsert: 0,
		videosList: 0,
	};
	const startTime = Date.now();

	console.log('=== Starting YouTube Playlist Creation ===');
	console.log(`Playlist: "${title}"`);
	console.log(`Songs to add: ${playlist.length}`);
	console.log(
		`Estimated quota cost: ${
			QUOTA_COSTS.playlistInsert +
			playlist.length * QUOTA_COSTS.search +
			playlist.length * QUOTA_COSTS.playlistItemInsert
		}`
	);

	try {
		// Set up OAuth2 client
		const config = useRuntimeConfig();
		const oauth2Client = new google.auth.OAuth2(
			config.oauth.google.clientId,
			config.oauth.google.clientSecret,
			config.oauth.google.redirectURL
		);

		// Validate we have necessary tokens
		if (!session.refreshToken) {
			console.error('No refresh token available in session');
			throw createError({
				statusCode: 401,
				statusMessage: 'auth_expired',
				data: {
					reason: 'Please sign in again to grant YouTube access.',
				},
			});
		}

		// Track current tokens in local variables to avoid race conditions
		let currentAccessToken = session.accessToken as string;
		let currentRefreshToken = session.refreshToken as string;
		let currentExpiryDate = session.expiryDate as number;

		// Check if token is expired or about to expire (within 5 minutes)
		const now = Date.now();
		console.log(
			`Token check - Expiry: ${currentExpiryDate}, Now: ${now}, Diff: ${
				currentExpiryDate - now
			}ms`
		);

		if (!currentExpiryDate || currentExpiryDate < now + 5 * 60 * 1000) {
			console.log('Token expired or expiring soon, refreshing...');

			// Set credentials with only refresh token to perform refresh
			oauth2Client.setCredentials({
				refresh_token: currentRefreshToken,
			});

			try {
				const { credentials } = await oauth2Client.refreshAccessToken();

				if (!credentials.access_token) {
					throw new Error('No access token received from refresh');
				}

				// Update local token variables
				currentAccessToken = credentials.access_token;
				currentRefreshToken = credentials.refresh_token || currentRefreshToken;
				currentExpiryDate = credentials.expiry_date || Date.now() + 3600 * 1000;

				// Update session with new tokens
				await setUserSession(event, {
					...session,
					accessToken: currentAccessToken,
					refreshToken: currentRefreshToken,
					expiryDate: currentExpiryDate,
				});

				console.log('Token refreshed successfully');
				console.log(
					`New expiry: ${currentExpiryDate} (in ${currentExpiryDate - Date.now()}ms)`
				);
			} catch (refreshError: any) {
				console.error('Failed to refresh token:', refreshError.message);
				console.error('Refresh error details:', JSON.stringify(refreshError, null, 2));
				throw createError({
					statusCode: 401,
					statusMessage: 'auth_expired',
					data: {
						reason: 'Session expired. Please sign in again.',
					},
				});
			}
		}

		// Set credentials with current (possibly refreshed) tokens BEFORE creating YouTube client
		oauth2Client.setCredentials({
			access_token: currentAccessToken,
			refresh_token: currentRefreshToken,
			expiry_date: currentExpiryDate,
		});

		// Initialize YouTube API with properly configured client
		const youtube = google.youtube({
			version: 'v3',
			auth: oauth2Client,
		});

		console.log(`Using access token: ${currentAccessToken?.substring(0, 20)}...`);

		// Create a new playlist
		const playlistResponse = await youtube.playlists.insert({
			part: ['snippet', 'status'],
			requestBody: {
				snippet: {
					title: title,
					description:
						description || `Playlist created - ${new Date().toLocaleDateString()}`,
				},
				status: {
					privacyStatus: 'public',
				},
			},
		});
		quotaUsed += QUOTA_COSTS.playlistInsert;
		quotaDetails.playlistInsert++;
		console.log(
			`✓ Playlist created (Quota: +${QUOTA_COSTS.playlistInsert}, Total: ${quotaUsed})`
		);

		const playlistId = playlistResponse.data.id;

		if (!playlistId) {
			throw new Error('Failed to create playlist');
		}

		// Search for each song and collect video IDs
		const addedSongs = [];
		const failedSongs = [];
		const videoIdMap = new Map(); // Map song to videoId

		// Step 1: Search for all songs and collect video IDs
		console.log(`\n--- Searching for ${playlist.length} songs ---`);
		for (const track of playlist) {
			try {
				const searchQuery = `${track.name} ${track.artist}`;
				const searchResponse = await youtube.search.list({
					part: ['snippet'],
					q: searchQuery,
					type: ['video'],
					videoCategoryId: '10', // Music category
					maxResults: 1, // Reduced to 1 to save quota
				});
				quotaUsed += QUOTA_COSTS.search;
				quotaDetails.search++;

				const videoId = searchResponse.data.items?.[0]?.id?.videoId;
				if (videoId) {
					videoIdMap.set(track, videoId);
				} else {
					failedSongs.push({
						name: track.name,
						artist: track.artist,
						year: track.year,
						reason: 'Video not found',
					});
				}
			} catch (error) {
				console.error(`Failed to search for song: ${track.name} - ${track.artist}`, error);
				failedSongs.push({
					name: track.name,
					artist: track.artist,
					year: track.year,
					reason: 'Search failed',
				});
			}
		}

		// // Step 2: Batch check video durations (up to 50 at a time)
		// const videoIds = Array.from(videoIdMap.values());
		// const validVideoIds = new Set();

		// for (let i = 0; i < videoIds.length; i += 50) {
		// 	const batch = videoIds.slice(i, i + 50);
		// 	try {
		// 		const videoDetails = await youtube.videos.list({
		// 			part: ['contentDetails'],
		// 			id: batch,
		// 		});

		// 		videoDetails.data.items?.forEach(item => {
		// 			const duration = item.contentDetails?.duration;
		// 			let durationInSeconds = 0;

		// 			if (duration) {
		// 				const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
		// 				if (match) {
		// 					const hours = parseInt(match[1] || '0');
		// 					const minutes = parseInt(match[2] || '0');
		// 					const seconds = parseInt(match[3] || '0');
		// 					durationInSeconds = hours * 3600 + minutes * 60 + seconds;
		// 				}
		// 			}

		// 			// Only include videos less than 12 minutes
		// 			if (durationInSeconds > 0 && durationInSeconds < 720) {
		// 				validVideoIds.add(item.id);
		// 			}
		// 		});
		// 	} catch (error) {
		// 		console.error('Failed to fetch video details batch:', error);
		// 	}
		// }

		// Step 3: Add valid videos to playlist
		console.log(`\n--- Adding ${videoIdMap.size} videos to playlist ---`);
		const videoIds = Array.from(videoIdMap.values());
		for (const [song, videoId] of videoIdMap) {
			if (videoIds.includes(videoId)) {
				try {
					await youtube.playlistItems.insert({
						part: ['snippet'],
						requestBody: {
							snippet: {
								playlistId: playlistId,
								resourceId: {
									kind: 'youtube#video',
									videoId: videoId,
								},
							},
						},
					});
					quotaUsed += QUOTA_COSTS.playlistItemInsert;
					quotaDetails.playlistItemInsert++;

					addedSongs.push({
						name: song.name,
						artist: song.artist,
						year: song.year,
						videoId: videoId,
					});
				} catch (error) {
					console.error(`Failed to add song: ${song.name} - ${song.artist}`, error);
					failedSongs.push({
						name: song.name,
						artist: song.artist,
						year: song.year,
						reason: 'Failed to add to playlist',
					});
				}
			} else {
				failedSongs.push({
					name: song.name,
					artist: song.artist,
					year: song.year,
					reason: 'Video too long or duration check failed',
				});
			}
		}

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log('\n=== Playlist Creation Complete ===');
		console.log(`Duration: ${duration}s`);
		console.log(`Total Quota Used: ${quotaUsed}`);
		console.log('Quota Breakdown:');
		console.log(
			`  - Playlist Insert: ${quotaDetails.playlistInsert} × ${
				QUOTA_COSTS.playlistInsert
			} = ${quotaDetails.playlistInsert * QUOTA_COSTS.playlistInsert}`
		);
		console.log(
			`  - Search: ${quotaDetails.search} × ${QUOTA_COSTS.search} = ${
				quotaDetails.search * QUOTA_COSTS.search
			}`
		);
		console.log(
			`  - Playlist Item Insert: ${quotaDetails.playlistItemInsert} × ${
				QUOTA_COSTS.playlistItemInsert
			} = ${quotaDetails.playlistItemInsert * QUOTA_COSTS.playlistItemInsert}`
		);
		console.log(`Songs: ${addedSongs.length} added, ${failedSongs.length} failed`);

		return {
			success: true,
			playlistId: playlistId,
			playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
			addedSongs: addedSongs,
			failedSongs: failedSongs,
			stats: {
				total: playlist.length,
				added: addedSongs.length,
				failed: failedSongs.length,
			},
			quota: {
				total: quotaUsed,
				breakdown: {
					playlistInsert: quotaDetails.playlistInsert * QUOTA_COSTS.playlistInsert,
					search: quotaDetails.search * QUOTA_COSTS.search,
					playlistItemInsert:
						quotaDetails.playlistItemInsert * QUOTA_COSTS.playlistItemInsert,
					videosList: quotaDetails.videosList * QUOTA_COSTS.videosList,
				},
				operations: quotaDetails,
			},
		};
	} catch (error: any) {
		console.error('Error creating YouTube playlist:', error);

		// Handle token expiration or authentication errors
		if (
			error.code === 401 ||
			error.code === 403 ||
			error.message?.includes('invalid_grant') ||
			error.message?.includes('invalid authentication') ||
			error.message?.includes('authentication credential')
		) {
			throw createError({
				statusCode: 401,
				statusMessage: 'auth_expired',
				data: {
					reason: 'YouTube authentication expired or invalid. Please sign in again.',
				},
			});
		}

		throw createError({
			statusCode: 500,
			statusMessage: error.message || 'Failed to create YouTube playlist',
		});
	}
});
