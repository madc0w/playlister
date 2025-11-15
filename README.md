# Playlister - AI YouTube Playlist Generator

Create YouTube playlists powered by AI! Simply describe what you want, and Playlister will generate a custom playlist and add it to your YouTube account.

## Features

-   🔐 **Google OAuth Authentication** - Secure sign-in with your Google account
-   🤖 **AI-Powered Generation** - Uses OpenAI GPT to create personalized playlists
-   🎵 **YouTube Integration** - Automatically creates playlists in your YouTube account
-   ⚡ **Fast & Easy** - Generate a 20-song playlist in seconds

## Setup Instructions

### 1. Prerequisites

-   Node.js 18+ and npm 9+
-   Google Cloud Project with OAuth credentials
-   OpenAI API key

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
    - YouTube Data API v3
    - Google+ API
4. Create OAuth 2.0 credentials:
    - Go to "APIs & Services" > "Credentials"
    - Click "Create Credentials" > "OAuth client ID"
    - Application type: "Web application"
    - Add authorized redirect URIs:
        - `http://localhost:3000/api/auth/google` (for development)
        - `https://your-domain.com/api/auth/google` (for production)
    - Save the Client ID and Client Secret

### 3. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key from your account settings
3. Save the API key

### 4. Environment Configuration

1. Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Fill in your credentials in `.env`:

    ```bash
    # OpenAI API Key
    OPENAI_API_KEY=sk-your-openai-api-key-here

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    OAUTH_REDIRECT_URL=http://localhost:3000/api/auth/google

    # Session Secret (generate a random 32+ character string)
    NUXT_SESSION_PASSWORD=generate-a-random-32-character-string-here
    ```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

## How It Works

1. **Sign In**: Users authenticate with their Google account
2. **Describe**: Enter keywords describing the desired playlist (e.g., "relaxing jazz", "workout motivation")
3. **Generate**: AI creates a list of 20 songs matching the description
4. **Create**: The app searches for each song on YouTube and creates a playlist
5. **Enjoy**: Get a direct link to your new YouTube playlist!

## Deployment

### Heroku

The app is configured for Heroku deployment:

```bash
# Login to Heroku
heroku login

# Create a new app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set GOOGLE_CLIENT_ID=your-client-id
heroku config:set GOOGLE_CLIENT_SECRET=your-client-secret
heroku config:set OAUTH_REDIRECT_URL=https://your-app-name.herokuapp.com/api/auth/google
heroku config:set NUXT_SESSION_PASSWORD=your-session-password

# Deploy
git push heroku main
```

Don't forget to add your Heroku redirect URL to Google Cloud Console OAuth settings!

## Tech Stack

-   **Framework**: Nuxt 3
-   **Authentication**: nuxt-auth-utils
-   **AI**: OpenAI GPT-4
-   **API**: YouTube Data API v3 (googleapis)
-   **Language**: Vue 3 + TypeScript

## API Endpoints

-   `GET /api/auth/google` - Initiate Google OAuth flow
-   `GET /api/auth/session` - Get current user session
-   `POST /api/auth/logout` - Sign out user
-   `POST /api/generate-playlist` - Generate playlist from keywords
-   `POST /api/create-youtube-playlist` - Create YouTube playlist

## Project Structure

```
playlister/
├── pages/                # Application pages (auto-routed)
│   └── index.vue        # Main application page
├── components/           # Vue components
├── public/              # Static assets
├── server/              # Server API routes
│   └── api/
│       ├── auth/        # Authentication endpoints
│       ├── generate-playlist.post.ts
│       └── create-youtube-playlist.post.ts
├── app.vue              # Root component
├── nuxt.config.ts       # Nuxt configuration
└── package.json         # Dependencies and scripts
```

## Troubleshooting

### "Unauthorized" errors

-   Make sure you've signed in with Google
-   Check that your OAuth redirect URLs match exactly in Google Cloud Console

### YouTube API quota exceeded

-   YouTube API has daily quotas
-   Each playlist creation uses quota for searches and insertions

### Songs not found

-   Some songs may not be available on YouTube
-   Try more specific artist/song names in your keywords

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.
