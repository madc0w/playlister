<template>
	<div class="container">
		<div v-if="session?.user" class="user-info">
			<button @click="logout" class="logout-btn">Sign Out</button>
		</div>

		<header>
			<h1>🎵 Playlister</h1>
			<p>Create YouTube playlists with AI</p>
		</header>

		<main>
			<!-- Sign In Card -->
			<div v-if="!session?.user" class="card auth-card">
				<!-- <h2>Welcome to Playlister</h2> -->
				<p class="subtitle">Creating an AI-powered YouTube playlist is so easy!</p>
				<div class="features">
					<div class="feature">
						<span class="feature-icon">🎯</span>
						<span>Describe your desired playlist with keywords.</span>
					</div>
					<div class="feature">
						<span class="feature-icon">🤖</span>
						<span>Let AI generate a list of songs for you.</span>
					</div>
					<div class="feature">
						<span class="feature-icon">✨</span>
						<span>Continue generating more tracks, remove ones you don't like.</span>
					</div>
					<div class="feature">
						<span class="feature-icon">▶️</span>
						<span>Create the playlist directly on your YouTube account.</span>
					</div>
				</div>
				<p class="cta-text">Sign in with your Google account to get started</p>
				<button @click="signInWithGoogle" class="google-btn">
					<span class="google-icon">G</span>
					Sign in with Google
				</button>
			</div>

			<!-- Main App Card -->
			<div v-else class="card">
				<h2>Create Your Playlist</h2>

				<!-- Input Section -->
				<div v-if="!youtubePlaylist" class="input-section">
					<div class="form-group">
						<label for="keywords">Describe your playlist</label>
						<input
							id="keywords"
							v-model="keywords"
							type="text"
							placeholder="e.g., relaxing jazz, 80s rock, workout motivation..."
							class="input"
							@keyup.enter="generatePlaylist"
						/>
					</div>

					<div class="form-group">
						<label for="genre">Genre (optional)</label>
						<input
							id="genre"
							v-model="genre"
							type="text"
							placeholder="e.g., jazz, rock, hip-hop, classical..."
							class="input"
						/>
					</div>

					<div class="form-group">
						<label for="playlistTitle">Playlist title (optional)</label>
						<input
							id="playlistTitle"
							v-model="playlistTitle"
							type="text"
							placeholder="Awesome Trax"
							class="input"
						/>
					</div>

					<button
						@click="generatePlaylist"
						:disabled="isGenerating || !keywords"
						class="create-btn"
					>
						{{
							isGenerating
								? 'Generating...'
								: generatedPlaylist
								? 'Add More Songs'
								: 'Create Playlist'
						}}
					</button>

					<div v-if="error" class="error">{{ error }}</div>
				</div>

				<!-- Generated Playlist Preview -->
				<div v-if="generatedPlaylist && !youtubePlaylist" class="playlist-preview">
					<h3>Generated Playlist ({{ generatedPlaylist.length }} songs)</h3>
					<div class="song-list">
						<div
							v-for="(song, index) in generatedPlaylist"
							:key="index"
							class="song-item"
						>
							<span class="song-number">{{ index + 1 }}</span>
							<div class="song-info">
								<div class="song-name">{{ song.name }}</div>
								<div class="song-artist">
									{{ song.artist
									}}<span v-if="song.year" class="song-year">
										({{ song.year }})</span
									>
								</div>
							</div>
							<button
								@click="removeSong(index)"
								class="remove-btn"
								title="Remove song"
							>
								✕
							</button>
						</div>
					</div>

					<div class="action-buttons">
						<button
							@click="createYouTubePlaylist"
							:disabled="isCreating"
							class="create-btn"
						>
							{{ isCreating ? 'Creating on YouTube...' : 'Create on YouTube' }}
						</button>
						<button @click="resetForm" class="secondary-btn">Start Over</button>
					</div>

					<div v-if="error === 'auth_expired'" class="error auth-error">
						<p>Your YouTube authentication has expired.</p>
						<button @click="signInWithGoogle" class="reauth-btn">
							Sign in with Google again
						</button>
					</div>
					<div v-else-if="error" class="error">{{ error }}</div>
				</div>

				<!-- YouTube Playlist Created -->
				<div v-if="youtubePlaylist" class="success-section">
					<div class="success-icon">✓</div>
					<h3>Playlist Created Successfully!</h3>

					<div class="playlist-stats">
						<div class="stat">
							<strong>{{ youtubePlaylist.stats.added }}</strong>
							<span>songs added</span>
						</div>
						<div class="stat" v-if="youtubePlaylist.stats.failed > 0">
							<strong>{{ youtubePlaylist.stats.failed }}</strong>
							<span>songs not found</span>
						</div>
					</div>

					<a :href="youtubePlaylist.playlistUrl" target="_blank" class="playlist-link">
						<span>🎬</span>
						Open Playlist on YouTube
					</a>

					<button @click="resetForm" class="secondary-btn">
						Create Another Playlist
					</button>

					<!-- Failed Songs -->
					<div v-if="youtubePlaylist.failedSongs.length > 0" class="failed-songs">
						<details>
							<summary>
								Songs not found ({{ youtubePlaylist.failedSongs.length }})
							</summary>
							<div class="song-list">
								<div
									v-for="(song, index) in youtubePlaylist.failedSongs"
									:key="index"
									class="song-item"
								>
									<div class="song-info">
										<div class="song-name">{{ song.name }}</div>
										<div class="song-artist">
											{{ song.artist
											}}<span v-if="song.year" class="song-year">
												({{ song.year }})</span
											>
										</div>
									</div>
								</div>
							</div>
						</details>
					</div>
				</div>
			</div>
		</main>

		<footer class="footer">
			<NuxtLink to="/privacy" class="privacy-link">Privacy Policy</NuxtLink>
		</footer>
	</div>
</template>

<script setup>
useHead({
	title: 'Playlister - AI YouTube Playlist Generator',
});

const session = ref(null);
const keywords = ref('');
const genre = ref('');
const playlistTitle = ref('');
const isGenerating = ref(false);
const isCreating = ref(false);
const error = ref('');
const generatedPlaylist = ref(null);
const youtubePlaylist = ref(null);

// Fetch session on mount
onMounted(async () => {
	await fetchSession();
});

async function fetchSession() {
	try {
		const response = await $fetch('/api/auth/session');
		session.value = response;
	} catch (err) {
		console.error('Failed to fetch session:', err);
	}
}

function signInWithGoogle() {
	window.location.href = '/api/auth/google';
}

async function logout() {
	try {
		await $fetch('/api/auth/logout', { method: 'POST' });
		session.value = null;
		resetForm();
	} catch (err) {
		console.error('Failed to logout:', err);
	}
}

async function generatePlaylist() {
	if (!keywords.value.trim()) {
		error.value = 'Please enter some keywords.';
		return;
	}

	isGenerating.value = true;
	error.value = '';

	try {
		const response = await $fetch('/api/generate-playlist', {
			method: 'POST',
			body: {
				keywords: keywords.value,
				genre: genre.value.trim() || undefined,
			},
		});

		// Append to existing playlist or create new one
		if (generatedPlaylist.value) {
			// Filter out duplicates based on song name and artist (case-insensitive)
			const existingSongs = new Set(
				generatedPlaylist.value.map(
					song => `${song.name.toLowerCase()}|${song.artist.toLowerCase()}`
				)
			);

			const newSongs = response.playlist.filter(song => {
				const songKey = `${song.name.toLowerCase()}|${song.artist.toLowerCase()}`;
				return !existingSongs.has(songKey);
			});

			generatedPlaylist.value = [...generatedPlaylist.value, ...newSongs];
		} else {
			generatedPlaylist.value = response.playlist;
		}

		// Auto-generate title if not provided
		if (!playlistTitle.value.trim()) {
			playlistTitle.value = keywords.value.trim().substring(0, 40);
		}
	} catch (err) {
		console.error('Failed to generate playlist:', err);
		error.value = err.data?.statusMessage || 'Failed to generate playlist. Please try again.';
	} finally {
		isGenerating.value = false;
	}
}

function removeSong(index) {
	if (generatedPlaylist.value) {
		generatedPlaylist.value = generatedPlaylist.value.filter((_, i) => i !== index);
	}
}

async function createYouTubePlaylist() {
	if (!generatedPlaylist.value) return;

	isCreating.value = true;
	error.value = '';

	try {
		const response = await $fetch('/api/create-youtube-playlist', {
			method: 'POST',
			body: {
				playlist: generatedPlaylist.value,
				title: playlistTitle.value || 'My Playlister Playlist',
				description: `Created with Playlister using keywords: ${keywords.value}`,
			},
		});

		youtubePlaylist.value = response;
	} catch (err) {
		console.error('Failed to create YouTube playlist:', err);

		// Check if authentication expired
		if (err.statusCode === 401 && err.data?.statusMessage === 'auth_expired') {
			error.value = 'auth_expired';
		} else {
			error.value =
				err.data?.reason ||
				err.data?.statusMessage ||
				'Failed to create YouTube playlist. Please try again.';
		}
	} finally {
		isCreating.value = false;
	}
}

function resetForm() {
	keywords.value = '';
	genre.value = '';
	playlistTitle.value = '';
	error.value = '';
	generatedPlaylist.value = null;
	youtubePlaylist.value = null;
}
</script>

<style scoped>
.container {
	max-width: 800px;
	margin: 0 auto;
	padding: 2rem;
	min-height: 100vh;
	position: relative;
}

.user-info {
	position: absolute;
	top: 2rem;
	right: 2rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	background: white;
	padding: 0.5rem 1rem;
	border-radius: 50px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	z-index: 10;
}

header {
	text-align: center;
	margin-bottom: 3rem;
	padding-top: 3rem;
}

header h1 {
	font-size: 3rem;
	margin-bottom: 0.5rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

header p {
	font-size: 1.2rem;
	color: #666;
}

.avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
}

.logout-btn {
	background: #f5f5f5;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 20px;
	cursor: pointer;
	font-size: 0.9rem;
	transition: background 0.2s;
}

.logout-btn:hover {
	background: #e0e0e0;
}

.card {
	background: white;
	border-radius: 12px;
	padding: 2.5rem;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.auth-card {
	text-align: center;
	padding: 3rem;
}

.auth-card h2 {
	margin-bottom: 0.5rem;
	color: #667eea;
	font-size: 2rem;
}

.auth-card .subtitle {
	color: #888;
	margin-bottom: 2rem;
	font-size: 1.1rem;
}

.features {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 2rem;
	max-width: 400px;
	margin-left: auto;
	margin-right: auto;
}

.feature {
	display: flex;
	align-items: center;
	gap: 1rem;
	text-align: left;
	padding: 0.75rem 1rem;
	background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
	border-radius: 10px;
	transition: transform 0.2s, box-shadow 0.2s;
}

.feature:hover {
	transform: translateX(5px);
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.feature-icon {
	font-size: 1.5rem;
	flex-shrink: 0;
}

.feature span:last-child {
	color: #555;
	font-size: 0.95rem;
	line-height: 1.4;
}

.auth-card .cta-text {
	color: #667eea;
	margin-bottom: 1.5rem;
	font-weight: 500;
}

.google-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	background: white;
	border: 2px solid #ddd;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s;
	font-weight: 500;
}

.google-btn:hover {
	border-color: #667eea;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.google-icon {
	font-weight: bold;
	font-size: 1.2rem;
	color: #4285f4;
}

.card h2 {
	margin-bottom: 1.5rem;
	color: #667eea;
}

.input-section {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.form-group label {
	font-weight: 500;
	color: #333;
}

.input {
	padding: 0.75rem;
	border: 2px solid #e0e0e0;
	border-radius: 8px;
	font-size: 1rem;
	transition: border-color 0.2s;
	font-family: inherit;
}

.input:focus {
	outline: none;
	border-color: #667eea;
}

.create-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	padding: 1rem 2rem;
	border-radius: 8px;
	font-size: 1.1rem;
	font-weight: 600;
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
}

.create-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.create-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.secondary-btn {
	background: #f5f5f5;
	color: #333;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-size: 1rem;
	cursor: pointer;
	transition: background 0.2s;
	margin-top: 1rem;
}

.secondary-btn:hover {
	background: #e0e0e0;
}

.error {
	color: #dc3545;
	background: #ffe6e6;
	padding: 1rem;
	border-radius: 8px;
	text-align: center;
}

.auth-error {
	background: #fff3cd;
	color: #856404;
	border: 1px solid #ffeaa7;
}

.auth-error p {
	margin-bottom: 1rem;
	font-weight: 500;
}

.reauth-btn {
	background: #667eea;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s;
	font-weight: 500;
}

.reauth-btn:hover {
	background: #5568d3;
	transform: translateY(-1px);
}

.playlist-preview h3 {
	color: #667eea;
	margin-bottom: 1rem;
}

.song-list {
	max-height: 400px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	margin-bottom: 1.5rem;
}

.song-item {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	border-bottom: 1px solid #f0f0f0;
}

.song-item:last-child {
	border-bottom: none;
}

.song-number {
	font-weight: 600;
	color: #667eea;
	min-width: 30px;
}

.song-info {
	flex: 1;
}

.song-name {
	font-weight: 500;
	color: #333;
	margin-bottom: 0.25rem;
}

.song-artist {
	color: #666;
	font-size: 0.9rem;
}

.song-year {
	color: #999;
	font-size: 0.85rem;
}

.remove-btn {
	background: #fff;
	border: 1px solid #e0e0e0;
	color: #dc3545;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	cursor: pointer;
	font-size: 1.2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	flex-shrink: 0;
}

.remove-btn:hover {
	background: #dc3545;
	color: white;
	border-color: #dc3545;
}

.action-buttons {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

.success-section {
	text-align: center;
}

.success-icon {
	width: 80px;
	height: 80px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 3rem;
	margin: 0 auto 1.5rem;
}

.success-section h3 {
	color: #667eea;
	margin-bottom: 1.5rem;
}

.playlist-stats {
	display: flex;
	justify-content: center;
	gap: 2rem;
	margin-bottom: 2rem;
}

.stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
}

.stat strong {
	font-size: 2rem;
	color: #667eea;
}

.stat span {
	color: #666;
	font-size: 0.9rem;
}

.playlist-link {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 1rem 2rem;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	font-size: 1.1rem;
	transition: transform 0.2s, box-shadow 0.2s;
	margin-bottom: 1rem;
}

.playlist-link:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.playlist-link span {
	font-size: 1.5rem;
}

.failed-songs {
	margin-top: 2rem;
	text-align: left;
}

.failed-songs details {
	background: #f8f9fa;
	padding: 1rem;
	border-radius: 8px;
}

.failed-songs summary {
	cursor: pointer;
	font-weight: 500;
	color: #666;
	user-select: none;
}

.failed-songs .song-list {
	margin-top: 1rem;
	margin-bottom: 0;
	max-height: 200px;
}

.footer {
	text-align: center;
	margin-top: 3rem;
	padding: 1.5rem;
	border-top: 1px solid #e0e0e0;
}

.privacy-link {
	color: #666;
	text-decoration: none;
	font-size: 0.9rem;
	transition: color 0.2s;
}

.privacy-link:hover {
	color: #667eea;
}

@media (max-width: 768px) {
	.container {
		padding: 1rem;
	}

	header {
		padding-top: 4rem;
	}

	header h1 {
		font-size: 2rem;
	}

	.user-info {
		position: fixed;
		top: 1rem;
		right: 1rem;
		left: 1rem;
		justify-content: center;
	}

	.card {
		padding: 1.5rem;
	}

	.action-buttons {
		flex-direction: column;
	}

	.action-buttons button {
		width: 100%;
	}
}
</style>
