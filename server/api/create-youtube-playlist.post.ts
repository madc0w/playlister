import { useRuntimeConfig } from '#imports';
import { google } from 'googleapis';
import { createError, defineEventHandler, readBody } from 'h3';

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

		// Set credentials from session
		oauth2Client.setCredentials({
			access_token: session.accessToken as string,
			refresh_token: session.refreshToken as string,
			expiry_date: session.expiryDate as number,
		});

		// Listen for token refresh
		oauth2Client.on('tokens', async tokens => {
			console.log('Tokens refreshed automatically');
			if (tokens.refresh_token) {
				// Store the new refresh token
				await setUserSession(event, {
					...session,
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token,
					expiryDate: tokens.expiry_date,
				});
			} else if (tokens.access_token) {
				// Update just the access token if no refresh token
				await setUserSession(event, {
					...session,
					accessToken: tokens.access_token,
					expiryDate: tokens.expiry_date,
				});
			}
		});

		// Check if token is expired or about to expire (within 5 minutes)
		const now = Date.now();
		const expiryDate = session.expiryDate as number;
		if (!expiryDate || expiryDate < now + 5 * 60 * 1000) {
			console.log('Token expired or expiring soon, refreshing...');
			try {
				const { credentials } = await oauth2Client.refreshAccessToken();
				oauth2Client.setCredentials(credentials);

				// Update session with new tokens
				await setUserSession(event, {
					...session,
					accessToken: credentials.access_token,
					refreshToken: credentials.refresh_token || session.refreshToken,
					expiryDate: credentials.expiry_date,
				});
				console.log('Token refreshed successfully');
			} catch (refreshError: any) {
				console.error('Failed to refresh token:', refreshError.message);
				throw createError({
					statusCode: 401,
					statusMessage: 'auth_expired',
					data: {
						reason: 'Session expired. Please sign in again.',
					},
				});
			}
		}

		// Initialize YouTube API
		const youtube = google.youtube({
			version: 'v3',
			auth: oauth2Client,
		});

		// Create a new playlist
		const playlistResponse = await youtube.playlists.insert({
			part: ['snippet', 'status'],
			requestBody: {
				snippet: {
					title: title,
					description:
						description ||
						`Playlist created by Playlister - ${new Date().toLocaleDateString()}`,
				},
				status: {
					privacyStatus: 'public',
				},
			},
		});

		const playlistId = playlistResponse.data.id;

		if (!playlistId) {
			throw new Error('Failed to create playlist');
		}

		// Search for each song and collect video IDs
		const addedSongs = [];
		const failedSongs = [];
		const videoIdMap = new Map(); // Map song to videoId

		// Step 1: Search for all songs and collect video IDs
		for (const song of playlist) {
			try {
				const searchQuery = `${song.name} ${song.artist}`;
				const searchResponse = await youtube.search.list({
					part: ['snippet'],
					q: searchQuery,
					type: ['video'],
					maxResults: 1, // Reduced to 1 to save quota
				});

				const videoId = searchResponse.data.items?.[0]?.id?.videoId;

				if (videoId) {
					videoIdMap.set(song, videoId);
				} else {
					failedSongs.push({
						name: song.name,
						artist: song.artist,
						year: song.year,
						reason: 'Video not found',
					});
				}
			} catch (error) {
				console.error(`Failed to search for song: ${song.name} - ${song.artist}`, error);
				failedSongs.push({
					name: song.name,
					artist: song.artist,
					year: song.year,
					reason: 'Search failed',
				});
			}
		}

		// Step 2: Batch check video durations (up to 50 at a time)
		const videoIds = Array.from(videoIdMap.values());
		const validVideoIds = new Set();

		for (let i = 0; i < videoIds.length; i += 50) {
			const batch = videoIds.slice(i, i + 50);
			try {
				const videoDetails = await youtube.videos.list({
					part: ['contentDetails'],
					id: batch,
				});

				videoDetails.data.items?.forEach(item => {
					const duration = item.contentDetails?.duration;
					let durationInSeconds = 0;

					if (duration) {
						const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
						if (match) {
							const hours = parseInt(match[1] || '0');
							const minutes = parseInt(match[2] || '0');
							const seconds = parseInt(match[3] || '0');
							durationInSeconds = hours * 3600 + minutes * 60 + seconds;
						}
					}

					// Only include videos less than 12 minutes
					if (durationInSeconds > 0 && durationInSeconds < 720) {
						validVideoIds.add(item.id);
					}
				});
			} catch (error) {
				console.error('Failed to fetch video details batch:', error);
			}
		}

		// Step 3: Add valid videos to playlist
		for (const [song, videoId] of videoIdMap) {
			if (validVideoIds.has(videoId)) {
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
