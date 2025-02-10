const { defineConfig } = require('@vue/cli-service');

// const nodeCoreModules = [
// 	'assert',
// 	'buffer',
// 	'child_process',
// 	'cluster',
// 	'console',
// 	'constants',
// 	'crypto',
// 	'dgram',
// 	'dns',
// 	'domain',
// 	'events',
// 	'fs',
// 	'http',
// 	'https',
// 	'module',
// 	'net',
// 	'os',
// 	'path',
// 	'process',
// 	'punycode',
// 	'querystring',
// 	'readline',
// 	'repl',
// 	'stream',
// 	'string_decoder',
// 	'sys',
// 	'timers',
// 	'tls',
// 	'tty',
// 	'url',
// 	'util',
// 	'vm',
// 	'zlib',
// ];

// Build an object that sets each module to false
// const fallbackConfig = {};
// for (const mod of nodeCoreModules) {
// 	fallbackConfig[mod] = false;
// }

module.exports = defineConfig({
	transpileDependencies: true,
	publicPath: process.env.NODE_ENV === 'production' ? '/playlister/' : '/',
	// configureWebpack: {
	// 	resolve: {
	// 		fallback: fallbackConfig,
	// 	},
	// },
});
