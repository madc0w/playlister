export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
		authorizationParams: {
			access_type: 'offline',
			prompt: 'consent',
		},
	},
	async onSuccess(event, { user, tokens }) {
		console.log('=== OAuth Success ===');
		console.log('User:', user);
		console.log('Tokens:', { ...tokens, access_token: '***', refresh_token: '***' });

		await setUserSession(event, {
			user: {},
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiryDate: tokens.expiry_date,
			loggedInAt: Date.now(),
		});

		console.log('Session set, redirecting to /');
		return sendRedirect(event, '/');
	},
	// Optional, will return a json error and 401 status code by default
	onError(event, error) {
		console.error('=== Google OAuth Error ===');
		console.error('Error:', error);
		console.error('Error stack:', error.stack);
		return sendRedirect(event, '/?error=oauth_failed');
	},
});
