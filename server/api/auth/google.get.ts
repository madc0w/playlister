export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['openid', 'https://www.googleapis.com/auth/youtube.force-ssl'],
		authorizationParams: {
			access_type: 'offline',
			prompt: 'consent',
		},
	},
	async onSuccess(event, { user, tokens }) {
		console.log('=== OAuth Success ===');
		console.log('Access token received:', !!tokens.access_token);
		console.log('Refresh token received:', !!tokens.refresh_token);
		console.log('Expiry date received:', tokens.expiry_date);
		console.log('Token type:', tokens.token_type);
		console.log('Scope received:', tokens.scope);

		// Calculate expiry date if not provided (token usually valid for 1 hour)
		const expiryDate = tokens.expiry_date || Date.now() + 3600 * 1000;

		await setUserSession(event, {
			user: {},
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiryDate: expiryDate,
			loggedInAt: Date.now(),
		});

		console.log('Session set with expiry:', expiryDate);
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
