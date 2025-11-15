// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-11-01',
	devtools: { enabled: true },

	// Heroku configuration
	nitro: {
		preset: 'node-server',
		compressPublicAssets: true,
	},

	runtimeConfig: {
		// Private keys (only available server-side)
		openaiApiKey: process.env.OPENAI_API_KEY || '',

		public: {
			// Public keys (exposed to client)
			apiBase: process.env.API_BASE || '/api',
		},
	},

	app: {
		head: {
			title: 'Playlister',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'description', content: 'Create Youtube playlists with AI' },
			],
			link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }],
		},
	},

	modules: ['nuxt-auth-utils'],
});
