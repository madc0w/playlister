# YouTube Playlister - Design Document

## Executive Summary

YouTube Playlister is a web application that enables users to automatically create YouTube playlists from AI-generated song recommendations. The application uses the YouTube Data API v3 to search for music videos and create organized playlists within users' YouTube accounts.

**Version:** 1.0  
**Date:** November 16, 2025  
**Status:** Development/Beta Testing

---

## 1. Application Overview

### 1.1 Purpose

YouTube Playlister streamlines the playlist creation process by automating the search and organization of music videos on YouTube. Users receive AI-curated song recommendations and can create a complete YouTube playlist with a single click, eliminating hours of manual searching and adding.

### 1.2 Target Users

-   Music enthusiasts who want to quickly create themed playlists
-   Users discovering new music who want to organize songs on YouTube
-   People creating playlists for specific moods, activities, or events

### 1.3 Key Features

-   OAuth 2.0 authentication with Google/YouTube
-   AI-powered song recommendations
-   Automated YouTube video search for each song
-   Content validation (duration filtering to ensure music videos, not podcasts/tutorials)
-   Playlist creation directly in user's YouTube account
-   Detailed success/failure reporting

---

## 2. Technical Architecture

### 2.1 Technology Stack

-   **Frontend:** Nuxt 3 (Vue.js), TypeScript
-   **Backend:** Nuxt 3 Server API, Node.js
-   **Authentication:** nuxt-auth-utils, Google OAuth 2.0
-   **APIs:** YouTube Data API v3, Google APIs Node.js Client
-   **Hosting:** Development: localhost | Production: TBD

### 2.2 System Architecture

```
┌─────────────┐
│   Browser   │
│  (Vue.js)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐
│   Nuxt 3 Server     │
│   - API Routes      │
│   - Session Mgmt    │
│   - OAuth Handler   │
└──────┬──────────────┘
       │ Google APIs SDK
       ▼
┌─────────────────────┐
│  YouTube Data API   │
│      v3             │
└─────────────────────┘
```

### 2.3 Authentication Flow

```
1. User → Click "Sign in with Google"
2. App → Redirect to Google OAuth consent screen
3. User → Grant YouTube permissions
4. Google → Return authorization code
5. App → Exchange code for access & refresh tokens
6. App → Store tokens in encrypted server-side session
7. App → Use tokens to make YouTube API calls on user's behalf
```

---

## 3. YouTube API Integration

### 3.1 API Scopes Required

-   `https://www.googleapis.com/auth/youtube`
-   `https://www.googleapis.com/auth/youtube.force-ssl`

### 3.2 API Endpoints Used

#### 3.2.1 Search for Videos

**Endpoint:** `youtube.search.list`  
**Quota Cost:** 100 units per request  
**Usage:** Search for music videos by song name and artist  
**Frequency:** 1 request per song (40-50 per playlist)

```javascript
youtube.search.list({
	part: ['snippet'],
	q: `${song.name} ${song.artist}`,
	type: ['video'],
	maxResults: 1,
});
```

#### 3.2.2 Get Video Details

**Endpoint:** `youtube.videos.list`  
**Quota Cost:** 1 unit per request (batched up to 50 videos)  
**Usage:** Verify video durations to filter out non-music content  
**Frequency:** 1-2 requests per playlist (batched)

```javascript
youtube.videos.list({
    part: ['contentDetails'],
    id: [videoId1, videoId2, ...] // up to 50 IDs
})
```

#### 3.2.3 Create Playlist

**Endpoint:** `youtube.playlists.insert`  
**Quota Cost:** 50 units per request  
**Usage:** Create new playlist in user's account  
**Frequency:** 1 request per playlist

```javascript
youtube.playlists.insert({
	part: ['snippet', 'status'],
	requestBody: {
		snippet: { title, description },
		status: { privacyStatus: 'public' },
	},
});
```

#### 3.2.4 Add Videos to Playlist

**Endpoint:** `youtube.playlistItems.insert`  
**Quota Cost:** 50 units per request  
**Usage:** Add verified music videos to created playlist  
**Frequency:** 40-50 requests per playlist (1 per song)

```javascript
youtube.playlistItems.insert({
	part: ['snippet'],
	requestBody: {
		snippet: {
			playlistId: playlistId,
			resourceId: { kind: 'youtube#video', videoId: videoId },
		},
	},
});
```

---

## 4. Quota Analysis

### 4.1 Current Quota Limit

**10,000 units per day** (default)

### 4.2 Quota Usage Per Playlist

| Operation                 | Quota Cost | Quantity    | Subtotal         |
| ------------------------- | ---------- | ----------- | ---------------- |
| Search videos             | 100 units  | 44 songs    | 4,400 units      |
| Get video details (batch) | 1 unit     | 1-2 batches | 2 units          |
| Create playlist           | 50 units   | 1 playlist  | 50 units         |
| Add videos to playlist    | 50 units   | 44 songs    | 2,200 units      |
| **TOTAL per playlist**    |            |             | **~6,650 units** |

### 4.3 Current Limitation

With 10,000 units/day quota:

-   **1-2 playlists per day** across all users
-   Completely insufficient for even basic testing
-   Impossible to scale to multiple users

### 4.4 Requested Quota: 1,000,000 units/day

**Justification:**

-   Expected users: 50-100 active users per day
-   Average playlists per user: 2-3 per session
-   Total daily need: 150-300 playlists × 6,650 units = **997,500 - 1,995,000 units**
-   Requested: 1,000,000 units allows ~150 playlists/day
-   Buffer for growth and error handling

---

## 5. Data Flow & Privacy

### 5.1 Data Collection

**Minimal data collected:**

-   User's Google account email (for authentication)
-   OAuth access tokens (temporary, encrypted in session)
-   OAuth refresh tokens (for token renewal)

### 5.2 Data Storage

-   **Session Storage:** Encrypted server-side sessions (Nuxt Auth Utils)
-   **Duration:** Session expires on logout or after 7 days
-   **No Persistent Storage:** No user data stored in database
-   **No Third-Party Sharing:** Data never shared or sold

### 5.3 Data Usage

Tokens are used **exclusively** to:

1. Search for videos on YouTube (on user's behalf)
2. Create playlists in user's YouTube account
3. Add videos to user's playlists

### 5.4 User Control

-   Users can revoke access at any time via Google Account settings
-   All playlists created remain in user's YouTube account
-   No content downloaded or redistributed

---

## 6. Security Measures

### 6.1 Authentication Security

-   OAuth 2.0 with PKCE flow
-   Tokens stored in encrypted, HTTP-only sessions
-   No credentials exposed to client-side JavaScript
-   Automatic token refresh with refresh tokens
-   Session expiration after inactivity

### 6.2 API Security

-   All API calls made server-side (tokens never sent to client)
-   Rate limiting on API endpoints
-   Error handling to prevent token leakage
-   HTTPS encryption for all communications

### 6.3 Content Policy Compliance

-   Only searches for music content
-   Respects YouTube's Terms of Service
-   Does not download or redistribute YouTube content
-   Creates playlists within YouTube ecosystem

---

## 7. Error Handling

### 7.1 API Errors

-   **Quota Exceeded:** Display user-friendly message, queue request for later
-   **Video Not Found:** Skip song, report in failed songs list
-   **Auth Expired:** Prompt user to re-authenticate
-   **Network Errors:** Retry with exponential backoff

### 7.2 User Feedback

-   Real-time progress indicators
-   Detailed success/failure reporting per song
-   Clear error messages with resolution steps
-   Link to created playlist (even with partial success)

---

## 8. Future Enhancements

### 8.1 Short-term (3 months)

-   Search result caching (reduce duplicate searches)
-   Batch operations optimization
-   User playlist history
-   Multiple playlist sources (Spotify imports, etc.)

### 8.2 Long-term (6-12 months)

-   Collaborative playlists
-   Playlist analytics
-   Smart playlist updates (auto-add new releases)
-   Integration with music discovery services

---

## 9. Testing & Quality Assurance

### 9.1 Current Testing

-   Manual testing with 1-5 beta users
-   End-to-end authentication flow testing
-   API error handling validation
-   Quota usage monitoring

### 9.2 Production Testing Plan

-   Automated integration tests
-   Load testing with simulated users
-   Quota usage analytics dashboard
-   User acceptance testing (UAT)

---

## 10. Compliance & Best Practices

### 10.1 YouTube API Services Terms

-   Complies with YouTube Terms of Service
-   Respects copyright and content ownership
-   Does not scrape or download content
-   Maintains user data privacy

### 10.2 Google API Best Practices

-   Efficient batching of requests
-   Exponential backoff on errors
-   Proper error handling
-   Minimal data retention

---

## 11. Contact Information

**Developer:** [Your Name]  
**Email:** [Your Email]  
**Project URL:** http://localhost:3000 (development)  
**GitHub:** https://github.com/madc0w/playlister  
**Google Cloud Project Number:** [Your Project Number]

---

## Appendix A: Code Samples

### OAuth 2.0 Configuration

```typescript
authorizationParams: {
    access_type: 'offline',  // Request refresh token
    prompt: 'consent',       // Force consent for refresh token
    scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl'
    ].join(' ')
}
```

### Token Refresh Logic

```typescript
if (expiryDate < now + 5 * 60 * 1000) {
	const { credentials } = await oauth2Client.refreshAccessToken();
	await updateSession(credentials);
}
```

### Batched Video Details Check

```typescript
for (let i = 0; i < videoIds.length; i += 50) {
	const batch = videoIds.slice(i, i + 50);
	const details = await youtube.videos.list({
		part: ['contentDetails'],
		id: batch,
	});
	// Process batch...
}
```

---

**Document End**
