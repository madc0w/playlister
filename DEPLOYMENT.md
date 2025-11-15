# Heroku Deployment Guide

## Prerequisites

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
2. Heroku account created
3. Git repository initialized

## Step-by-Step Deployment

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create Heroku App

```bash
heroku create your-playlister-app
```

Or use the Heroku dashboard to create an app.

### 3. Configure Environment Variables

Set any required environment variables:

```bash
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=your_api_key_here
```

### 4. Deploy

Push your code to Heroku:

```bash
git push heroku master
```

Or if you're on a different branch:

```bash
git push heroku your-branch:master
```

### 5. Open Your App

```bash
heroku open
```

## Automatic Deployment from GitHub

1. Go to your Heroku app dashboard
2. Click on "Deploy" tab
3. Choose "GitHub" as deployment method
4. Connect your GitHub repository
5. Enable "Automatic Deploys" from your main branch

## Checking Logs

View real-time logs:

```bash
heroku logs --tail
```

## Scaling

Heroku free tier gives you one dyno. To scale:

```bash
heroku ps:scale web=1
```

## Troubleshooting

### Build Fails

Check the build logs:

```bash
heroku logs --tail
```

### Port Issues

Heroku automatically sets the PORT environment variable. The app is configured to use `process.env.PORT || 3000`.

### Dependencies

Make sure all dependencies are in `dependencies` not `devDependencies` in package.json if they're needed for production.

## Important Files

-   **Procfile** - Tells Heroku how to start your app
-   **package.json** - Contains start script and engines
-   **nuxt.config.ts** - Configured with node-server preset

## Environment Variables

The app uses these environment variables:

-   `PORT` - Set automatically by Heroku
-   `NODE_ENV` - Should be 'production'
-   `OPENAI_API_KEY` - Your OpenAI key (if using AI features)
-   `HOST` - Set to 0.0.0.0 for Heroku

## Next Steps

After deployment:

1. Test your app at the Heroku URL
2. Set up a custom domain (optional)
3. Enable SSL (automatic with Heroku)
4. Set up monitoring and alerts
