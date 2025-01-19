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
			<div id="error" v-if="error">
				{{ error }}
			</div>
			<div id="input-panel">
				<div>
					<div class="input-label">Key:</div>
					<input type="text" v-model="key" placeholder="only you would know..." />
				</div>
				<div>
					<div class="input-label">Playlist description:</div>
					<textarea v-model="playlistDescription" placeholder="monkey songs" />
				</div>
				<div>
					<div class="input-label">Genre:</div>
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

const ASCII_START = 32; // Space
const ASCII_END = 126; // '~'
const ASCII_RANGE = ASCII_END - ASCII_START + 1; // 95

export default {
	name: 'App',

	components: {},

	data() {
		return {
			playlistDescription: null,
			genre: null,
			isInProgress: false,
			playlist: null,
			key: localStorage.encKey,
			error: null,
		};
	},

	methods: {
		async go() {
			if (!this.key) {
				this.error = 'You must first give me the key!';
				return;
			}
			localStorage.encKey = this.key;

			this.isInProgress = true;
			this.playlist = await this.getPlaylist();
			// const videoUrls = await searchYouTube(query);
			// console.log('videoUrls', videoUrls);
			this.isInProgress = false;
		},

		async searchYouTube(query, maxResults = 4) {
			const apiUrl = 'https://www.googleapis.com/youtube/v3/search';

			const key = this.decrypt(':03Ijt6{+~2.{aeOcwg:&S*[]Ll,IG7Y.+gJi=E', this.key);
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
			const key = this.decrypt(
				'lREJxg`ThUyZ1(UUish2#tat<0y;kl,{d[KT~`Hw;SzS]E]3oS$PcI^z\\K^,O]gJ;9',
				this.key
			);
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

		wrapToPrintable(charCode) {
			// Shift so that ASCII_START becomes 0,
			// then wrap with modulo, then shift back
			return ASCII_START + ((charCode - ASCII_START + ASCII_RANGE) % ASCII_RANGE);
		},

		/**
		 * Encrypts a string with a rotating key such that all output characters
		 * remain in the printable ASCII range [32..126].
		 *
		 * For each character in plaintext:
		 * - Convert it to 0-based index by subtracting 32.
		 * - Convert key character similarly, then combine (add).
		 * - Wrap with modulo 95, shift back into ASCII range.
		 */
		encrypt(plaintext, key) {
			let encrypted = '';
			for (let i = 0; i < plaintext.length; i++) {
				// Current plaintext character
				const ptCharCode = this.wrapToPrintable(plaintext.charCodeAt(i));
				// Current key character, rotating through key
				const keyIndex = i % key.length;
				const keyShiftRaw = key.charCodeAt(keyIndex);
				// Also wrap the key character to keep it in [32..126]
				const keyShift = this.wrapToPrintable(keyShiftRaw) - ASCII_START;

				// Now shift plaintext by the key
				const newChar = this.wrapToPrintable(ptCharCode + keyShift);
				encrypted += String.fromCharCode(newChar);
			}
			return encrypted;
		},

		/**
		 * Decrypts the string by reversing the rotating-key shifts.
		 */
		decrypt(ciphertext, key) {
			let decrypted = '';
			for (let i = 0; i < ciphertext.length; i++) {
				const ctCharCode = this.wrapToPrintable(ciphertext.charCodeAt(i));
				const keyIndex = i % key.length;
				const keyShiftRaw = key.charCodeAt(keyIndex);
				const keyShift = this.wrapToPrintable(keyShiftRaw) - ASCII_START;

				// Reverse the shift that was done in encryption
				const originalChar = this.wrapToPrintable(ctCharCode - keyShift);
				decrypted += String.fromCharCode(originalChar);
			}
			return decrypted;
		},
	},

	async created() {
		// const enc = this.encrypt('some API key', this.key);
		// console.log('encrypted', enc);
		// console.log('decrypted', this.decrypt(enc, this.key));
	},
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

#error {
	color: red;
	background-color: darkgray;
	border-radius: 8px;
	margin: 12px;
}

.input-label {
	font-weight: bold;
	margin-top: 8px;
}

button {
	background-color: crimson;
	color: white;
	min-width: 80px;
	min-height: 24px;
	margin-top: 12px;
	border-radius: 6px;
	cursor: pointer;
}
</style>
