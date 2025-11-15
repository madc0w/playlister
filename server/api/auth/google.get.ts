export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['email', 'profile', 'https://www.googleapis.com/auth/youtube'],
	},
	async onSuccess(event, { user, tokens }) {
		await setUserSession(event, {
			user: {
				google: user.email,
				name: user.name,
				picture: user.picture,
			},
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiryDate: tokens.expiry_date,
			loggedInAt: Date.now(),
		});

		return sendRedirect(event, '/');
	},
	// Optional, will return a json error and 401 status code by default
	onError(event, error) {
		console.error('Google OAuth error:', error);
		return sendRedirect(event, '/?error=oauth_failed');
	},
});
