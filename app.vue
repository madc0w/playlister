<template>
	<div>
		<NuxtPage />
	</div>
</template>

<script setup>
// Global app component - inline critical CSS to prevent FOUC
useHead({
	style: [
		{
			innerHTML: `
				html, body, #__nuxt { background: #f5f5f5; }
				body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
				* { box-sizing: border-box; }
			`,
		},
	],
});
</script>
