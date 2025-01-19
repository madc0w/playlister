<template>
	<div id="app">
		<div id="left-panel">
			<div class="header">Playlist</div>
			<hr />
			<div id="playlist-container" v-if="playlist">
				<div v-for="(item, i) in playlist" :key="i">
					<div class="track-title">
						{{ item.title }}
					</div>
					<div class="track-artist">
						{{ item.artist }}
					</div>
				</div>
			</div>
		</div>
		<div id="right-panel">
			<div id="input-panel">
				<div>
					<div>Playlist description:</div>
					<textarea v-model="playlistDescription" placeholder="monkey songs" />
				</div>
				<div>
					<div>Genre:</div>
					<input type="text" v-model="genre" placeholder="rock and/or roll" />
				</div>
				<div v-if="isInProgress">Working...</div>
				<div v-else>
					<button @click="go">GO</button>
				</div>
			</div>
			<hr />
			<div id="player-panel"></div>
		</div>
	</div>
</template>

<script>
const axios = require('axios');
const OpenAI = require('openai');

export default {
	name: 'App',

	components: {},

	data() {
		return {
			playlistDescription: null,
			genre: null,
			isInProgress: false,
			playlist: null,
		};
	},

	methods: {
		async go() {
			this.isInProgress = true;
			this.playlist = await this.getPlaylist();
			// const videoUrls = await searchYouTube(query);
			// console.log('videoUrls', videoUrls);
			this.isInProgress = false;
		},

		async searchYouTube(query, maxResults = 4) {
			const apiUrl = 'https://www.googleapis.com/youtube/v3/search';

			const key = 'AIza' + 'SyB728y' + 'Fdfqjj1' + 'ORnX6v' + 'deTD2L' + 'Ct5DObRBQ';
			const response = await axios.get(apiUrl, {
				params: {
					part: 'snippet',
					q: query,
					type: 'video',
					maxResults: maxResults,
					key,
				},
			});

			// Extract video URLs from the response
			const videos = response.data.items.map(item => {
				const videoId = item.id.videoId;
				return `https://www.youtube.com/watch?v=${videoId}`;
			});

			return videos;
		},

		async getPlaylist() {
			const key =
				'sk' +
				'-balloonary-app' +
				'-PJkym0CI' +
				'aSTq87kt3lg' +
				'eT3BlbkFJ' +
				'iNvlkhLN' +
				'j6cdFD8' +
				'bseBR';
			const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });

			const numTracks = 8;
			let prompt =
				`Build a playlist of ${numTracks} tracks. The playlist description is:\n` +
				this.playlistDescription +
				'\n';
			if (this.genre) {
				prompt += 'The genre of the tracks in this list is:\n' + this.genre + '\n';
			}
			prompt +=
				'Output a JSON array where each entry is an object having the attributes "title" and "artist". Produce only JSON, no prefix or suffix.';

			const params = {
				model: 'gpt-4o',
				// user: ,
				messages: [
					// {
					// 	role: 'system',
					// 	content: 'You are an expert',
					// },
					{
						role: 'user',
						content: prompt,
					},
				],
				// response_format: {
				// 	type: 'json_schema',
				// 	json_schema: {
				// 		name: 'json_response',
				// 		strict: true,
				// 		schema: {
				// 			type: 'object',
				// 			properties,
				// 			required: Object.keys(properties),
				// 			additionalProperties: false,
				// 		},
				// 	},
				// },
			};

			const response = await openai.chat.completions.create(params);
			const jsonStr = response.choices[0].message.content
				.replace(/^```.*/g, '')
				.replace(/```/g, '');
			// console.log('jsonStr', jsonStr);
			const json = JSON.parse(jsonStr);
			// console.log('json', json);
			return json;
		},
	},

	async created() {},
};
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #2c3e50;
	display: flex; /* Use flex layout */
	min-height: 100vh; /* Optional: make container fill at least the viewport height */
}

#left-panel {
	width: 400px;
	background-color: #f2f2f2;
	padding: 1rem;
}

#right-panel {
	flex-grow: 1; /* Take remaining space */
	background-color: #ffffff;
	padding: 1rem;
}

#input-panel textarea {
	width: 400px;
}

#input-panel input {
	width: 400px;
}

.track-artist {
	margin-left: 18px;
	font-size: small;
	margin-bottom: 8px;
}

button {
	background-color: crimson;
	color: white;
	min-width: 80px;
	min-height: 24px;
	margin: 4px;
	border-radius: 6px;
	cursor: pointer;
}
</style>
