export default defineEventHandler(event => {
	const path = event.path;

	if (path.startsWith('/api/auth/google')) {
		console.log('=== Auth Request ===');
		console.log('Path:', path);
		console.log('Method:', event.method);
		console.log('Query:', getQuery(event));
		console.log('Headers:', event.headers);

		// Check runtime config
		const config = useRuntimeConfig();
		console.log('OAuth Config exists:', !!config.oauth?.google);
		console.log('Client ID exists:', !!config.oauth?.google?.clientId);
		console.log('Client Secret exists:', !!config.oauth?.google?.clientSecret);
		console.log(
			'Client ID value:',
			config.oauth?.google?.clientId
				? config.oauth.google.clientId.substring(0, 20) + '...'
				: 'MISSING'
		);
	}
});
