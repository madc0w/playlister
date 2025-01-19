<template>
	<img alt="Vue logo" src="./assets/logo.png" />
	<HelloWorld msg="Welcome to Your Vue.js App" />
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
const axios = require('axios');

async function searchYouTube(query, maxResults = 4) {
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
}

export default {
	name: 'App',

	components: {
		HelloWorld,
	},

	async created() {
		const query = 'monkey song';

		const videoUrls = await searchYouTube(query);
		console.log('Video URLs:', videoUrls);
	},
};
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}
</style>
