<!-- src/components/YouTubePlaylistCreator.vue -->
<template>
	<div class="playlist-creator">
		<h1>YouTube Playlist Creator</h1>

		<!-- Sign-In Button -->
		<div v-if="!isAuthenticated">
			<button @click="handleSignIn">Sign in with Google</button>
		</div>

		<!-- Playlist Creation Form -->
		<div v-else>
			<p>Signed in as: {{ userName }}</p>
			<form @submit.prevent="createPlaylist">
				<div>
					<label for="playlistTitle">Playlist Title:</label>
					<input type="text" id="playlistTitle" v-model="playlistTitle" required />
				</div>
				<div>
					<label for="playlistDescription">Playlist Description:</label>
					<textarea id="playlistDescription" v-model="playlistDescription"></textarea>
				</div>
				<div>
					<label for="videoIds">Video IDs (comma-separated):</label>
					<input
						type="text"
						id="videoIds"
						v-model="videoIdsInput"
						placeholder="e.g., dQw4w9WgXcQ,3JZ_D3ELwOQ"
						required
					/>
				</div>
				<button type="submit">Create Playlist</button>
			</form>

			<!-- Display Result -->
			<div v-if="playlistUrl">
				<h2>Playlist Created!</h2>
				<a :href="playlistUrl" target="_blank">View Your Playlist</a>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios';

export default {
	name: 'YouTubePlaylistCreator',

	data() {
		return {
			isAuthenticated: false,
			userName: '',
			accessToken: '',
			playlistTitle: 'New Playlist',
			playlistDescription: 'Created via Vue App',
			videoIdsInput: '',
			playlistUrl: '',
			clientId: '1023657986486-28al807t0ub85d42gd7smipvfef30kok.apps.googleusercontent.com',
		};
	},

	methods: {
		/**
		 * Initializes the Google Sign-In button and handles the token.
		 */
		initializeGis() {
			window.google.accounts.id.initialize({
				client_id: this.clientId,
				callback: this.handleCredentialResponse,
				scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
			});
		},

		/**
		 * Renders the Google Sign-In button.
		 */
		renderGisButton() {
			window.google.accounts.id.renderButton(
				document.getElementById('signInDiv'),
				{ theme: 'outline', size: 'large' } // customization attributes
			);
			// Optionally, prompt the user to select an account
			window.google.accounts.id.prompt();
		},

		/**
		 * Handles the credential response from Google.
		 * @param {object} response - The response object containing the credential.
		 */
		async handleCredentialResponse(response) {
			try {
				// Decode the JWT credential to get user information (optional)
				const jwt = response.credential;
				const userInfo = JSON.parse(atob(jwt.split('.')[1]));
				this.userName = userInfo.name;

				// Exchange the ID token for an access token using OAuth 2.0
				// Note: GIS provides only ID tokens; to get access tokens, use OAuth 2.0 implicit flow or authorization code flow with PKCE.

				// For simplicity, use Google's token endpoint to exchange ID token for access token
				// However, it's recommended to use Google's libraries or follow the proper OAuth flow.

				// Alternatively, use the new Google Identity Services OAuth 2.0 token flow
				// Here, we'll use the OAuth 2.0 implicit flow to get the access token

				// Redirect the user to Google's OAuth 2.0 endpoint to get the access token
				// But in GIS, it's better to use the Token Client

				// Implement Token Client using GIS
				this.tokenClient = window.google.accounts.oauth2.initTokenClient({
					client_id: this.clientId,
					scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
					callback: tokenResponse => {
						this.accessToken = tokenResponse.access_token;
						this.isAuthenticated = true;
					},
				});

				// Request the access token
				this.tokenClient.requestAccessToken({ prompt: 'consent' });
			} catch (error) {
				console.error('Error handling credential response:', error);
			}
		},

		/**
		 * Initiates the Google Sign-In process.
		 */
		handleSignIn() {
			window.google.accounts.id.prompt();
		},

		/**
		 * Creates a YouTube playlist and adds the provided video IDs to it.
		 */
		async createPlaylist() {
			const videoIds = this.videoIdsInput
				.split(',')
				.map(id => id.trim())
				.filter(id => id.length > 0);

			if (videoIds.length === 0) {
				alert('Please provide at least one video ID.');
				return;
			}

			try {
				// 1. Create the Playlist
				const createPlaylistResponse = await axios.post(
					'https://www.googleapis.com/youtube/v3/playlists',
					{
						snippet: {
							title: this.playlistTitle,
							description: this.playlistDescription,
						},
						status: {
							privacyStatus: 'private', // or 'public' or 'unlisted'
						},
					},
					{
						params: { part: 'snippet,status' },
						headers: {
							Authorization: `Bearer ${this.accessToken}`,
							'Content-Type': 'application/json',
						},
					}
				);

				const playlistId = createPlaylistResponse.data.id;
				if (!playlistId) {
					throw new Error('Failed to create playlist.');
				}

				// 2. Add Videos to the Playlist
				for (const videoId of videoIds) {
					await axios.post(
						'https://www.googleapis.com/youtube/v3/playlistItems',
						{
							snippet: {
								playlistId: playlistId,
								resourceId: {
									kind: 'youtube#video',
									videoId: videoId,
								},
							},
						},
						{
							params: { part: 'snippet' },
							headers: {
								Authorization: `Bearer ${this.accessToken}`,
								'Content-Type': 'application/json',
							},
						}
					);
				}

				// 3. Set the Playlist URL
				this.playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
			} catch (error) {
				console.error('Error creating playlist:', error.response?.data || error.message);
				alert('Failed to create playlist. Check the console for details.');
			}
		},
	},
	mounted() {
		const intervalId = setInterval(() => {
			if (window.google) {
				clearInterval(intervalId);
				this.initializeGis();
			}
		}, 100);
	},
};
</script>

<style scoped>
.playlist-creator {
	max-width: 600px;
	margin: 0 auto;
	padding: 20px;
}
.playlist-creator form div {
	margin-bottom: 15px;
}
.playlist-creator label {
	display: block;
	margin-bottom: 5px;
}
.playlist-creator input,
.playlist-creator textarea {
	width: 100%;
	padding: 8px;
	box-sizing: border-box;
}
.playlist-creator button {
	padding: 10px 20px;
	font-size: 16px;
}
</style>
