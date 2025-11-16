import { google } from 'googleapis';

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

		// Set credentials from session
		oauth2Client.setCredentials({
			access_token: session.accessToken as string,
			refresh_token: session.refreshToken as string,
			expiry_date: session.expiryDate as number,
		});

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

		// Search for each song and add to playlist
		const addedSongs = [];
		const failedSongs = [];

		for (const song of playlist) {
			try {
				// Search for the song on YouTube
				const searchQuery = `${song.name} ${song.artist}`;
				const searchResponse = await youtube.search.list({
					part: ['snippet'],
					q: searchQuery,
					type: ['video'],
					videoCategoryId: '10', // Music category
					maxResults: 1,
				});

				const videoId = searchResponse.data.items?.[0]?.id?.videoId;

				if (videoId) {
					// Add video to playlist
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
				} else {
					failedSongs.push({
						name: song.name,
						artist: song.artist,
						year: song.year,
						reason: 'Video not found',
					});
				}
			} catch (error) {
				console.error(`Failed to add song: ${song.name} - ${song.artist}`, error);
				failedSongs.push({
					name: song.name,
					artist: song.artist,
					year: song.year,
					reason: 'Failed to add to playlist',
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

		// Handle token expiration
		if (error.code === 401) {
			throw createError({
				statusCode: 401,
				statusMessage: 'YouTube authentication expired. Please sign in again.',
			});
		}

		throw createError({
			statusCode: 500,
			statusMessage: error.message || 'Failed to create YouTube playlist',
		});
	}
});
