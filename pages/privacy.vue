<template>
	<div class="container">
		<header>
			<h1>Privacy Policy</h1>
			<p class="last-updated">Last Updated: November 16, 2025</p>
		</header>

		<main class="content">
			<section>
				<h2>Introduction</h2>
				<p>
					Welcome to Playlister. We respect your privacy and are committed to protecting
					your personal data. This privacy policy explains how we collect, use, and
					safeguard your information when you use our service.
				</p>
			</section>

			<section>
				<h2>Information We Collect</h2>
				<h3>Google Account Information</h3>
				<p>When you sign in with Google, we collect:</p>
				<ul>
					<li>Your name</li>
					<li>Your email address</li>
					<li>Your profile picture</li>
					<li>Google account ID</li>
				</ul>

				<h3>YouTube Data</h3>
				<p>To create playlists on your behalf, we access:</p>
				<ul>
					<li>Your YouTube playlists (to create new playlists)</li>
					<li>Video search results (to find songs for your playlists)</li>
				</ul>

				<h3>Usage Data</h3>
				<p>We may collect:</p>
				<ul>
					<li>Playlist keywords and titles you enter</li>
					<li>Generated playlist content</li>
					<li>Basic usage statistics</li>
				</ul>
			</section>

			<section>
				<h2>How We Use Your Information</h2>
				<p>We use your information solely to:</p>
				<ul>
					<li>Authenticate your identity</li>
					<li>Generate AI-powered playlist suggestions</li>
					<li>Create playlists on your YouTube account</li>
					<li>Improve our service</li>
				</ul>
			</section>

			<section>
				<h2>Data Sharing</h2>
				<p>
					We do not sell, rent, or share your personal information with third parties
					except as necessary to provide our service:
				</p>
				<ul>
					<li>
						<strong>Google/YouTube:</strong> We interact with YouTube's API to create
						playlists on your behalf
					</li>
					<li>
						<strong>AI Services:</strong> Playlist descriptions may be processed by AI
						services to generate song suggestions
					</li>
				</ul>
			</section>

			<section>
				<h2>Data Storage and Security</h2>
				<p>
					We implement reasonable security measures to protect your data. However, no
					method of transmission over the Internet is 100% secure. Your Google
					authentication tokens are stored securely and are only used for authorized
					YouTube operations.
				</p>
			</section>

			<section>
				<h2>Cookies and Local Storage</h2>
				<p>
					Our service stores, accesses, and collects information on your device to provide
					and improve our functionality:
				</p>
				<h3>Authentication Data</h3>
				<ul>
					<li>
						<strong>Cookies:</strong> We use cookies to maintain your login session and
						remember your authentication state
					</li>
					<li>
						<strong>Local Storage:</strong> We store authentication tokens and session
						data in your browser's local storage to keep you signed in
					</li>
				</ul>
				<h3>Third-Party Cookies</h3>
				<p>Third-party services we use may also set cookies on your device:</p>
				<ul>
					<li>
						<strong>Google OAuth:</strong> Google sets cookies during the authentication
						process to verify your identity and maintain your session
					</li>
					<li>
						<strong>YouTube API:</strong> YouTube may set cookies when you interact with
						playlist creation features
					</li>
				</ul>
				<h3>Managing Cookies</h3>
				<p>
					You can control and delete cookies through your browser settings. However,
					disabling cookies may prevent you from using certain features of our service,
					including sign-in functionality. Most browsers allow you to:
				</p>
				<ul>
					<li>View what cookies are stored and delete them individually</li>
					<li>Block third-party cookies</li>
					<li>Block all cookies</li>
					<li>Delete all cookies when you close your browser</li>
				</ul>
			</section>

			<section>
				<h2>Your Rights</h2>
				<p>You have the right to:</p>
				<ul>
					<li>Access the personal data we hold about you</li>
					<li>Request deletion of your data</li>
					<li>Revoke our access to your Google/YouTube account at any time</li>
					<li>Sign out and stop using our service</li>
				</ul>
				<p>
					You can revoke access by visiting your
					<a href="https://myaccount.google.com/permissions" target="_blank"
						>Google Account permissions page</a
					>.
				</p>
			</section>

			<section>
				<h2>Third-Party Services</h2>
				<p>Our service uses:</p>
				<ul>
					<li>
						<strong>Google OAuth 2.0:</strong> For authentication (subject to
						<a href="https://policies.google.com/privacy" target="_blank"
							>Google's Privacy Policy</a
						>)
					</li>
					<li>
						<strong>YouTube API:</strong> For playlist creation (subject to
						<a href="https://www.youtube.com/t/terms" target="_blank"
							>YouTube's Terms of Service</a
						>)
					</li>
				</ul>
			</section>

			<section>
				<h2>Data Retention</h2>
				<p>
					We retain your data only as long as necessary to provide our service. Session
					data is stored temporarily and authentication tokens expire according to
					Google's policies.
				</p>
			</section>

			<section>
				<h2>Children's Privacy</h2>
				<p>
					Our service is not intended for users under 13 years of age. We do not knowingly
					collect information from children under 13.
				</p>
			</section>

			<section>
				<h2>Changes to This Policy</h2>
				<p>
					We may update this privacy policy from time to time. We will notify you of any
					changes by updating the "Last Updated" date at the top of this policy.
				</p>
			</section>

			<section>
				<h2>Contact Us</h2>
				<p>
					If you have any questions about this privacy policy or our data practices,
					please contact us through our
					<a href="https://github.com/madc0w/playlister" target="_blank"
						>GitHub repository</a
					>.
				</p>
			</section>

			<div class="back-link">
				<NuxtLink to="/">← Back to Playlister</NuxtLink>
			</div>
		</main>
	</div>
</template>

<script setup>
useHead({
	title: 'Privacy Policy - Playlister',
});
</script>

<style scoped>
.container {
	max-width: 900px;
	margin: 0 auto;
	padding: 2rem;
	min-height: 100vh;
	background: #f8f9fa;
}

header {
	text-align: center;
	margin-bottom: 3rem;
	padding: 2rem;
	background: white;
	border-radius: 12px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

header h1 {
	font-size: 2.5rem;
	margin-bottom: 0.5rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.last-updated {
	color: #666;
	font-style: italic;
}

.content {
	background: white;
	padding: 2.5rem;
	border-radius: 12px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	line-height: 1.7;
}

section {
	margin-bottom: 2.5rem;
}

section:last-of-type {
	margin-bottom: 2rem;
}

h2 {
	color: #667eea;
	margin-bottom: 1rem;
	font-size: 1.75rem;
	border-bottom: 2px solid #e0e0e0;
	padding-bottom: 0.5rem;
}

h3 {
	color: #764ba2;
	margin-top: 1.5rem;
	margin-bottom: 0.75rem;
	font-size: 1.25rem;
}

p {
	margin-bottom: 1rem;
	color: #333;
}

ul {
	margin-left: 1.5rem;
	margin-bottom: 1rem;
}

li {
	margin-bottom: 0.5rem;
	color: #333;
}

a {
	color: #667eea;
	text-decoration: none;
	border-bottom: 1px solid #667eea;
	transition: color 0.2s, border-color 0.2s;
}

a:hover {
	color: #764ba2;
	border-color: #764ba2;
}

.back-link {
	text-align: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid #e0e0e0;
}

.back-link a {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: transform 0.2s, box-shadow 0.2s;
	border: none;
}

.back-link a:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
	.container {
		padding: 1rem;
	}

	.content {
		padding: 1.5rem;
	}

	header h1 {
		font-size: 2rem;
	}

	h2 {
		font-size: 1.5rem;
	}

	h3 {
		font-size: 1.1rem;
	}
}
</style>
