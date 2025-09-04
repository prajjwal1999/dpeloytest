# Google OAuth Setup Guide

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3001/api/v1/auth/google/callback` (development)
     - `https://yourdomain.com/api/v1/auth/google/callback` (production)

## 2. Environment Variables

Add these variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

## 3. Google OAuth Flow

### Frontend Integration

**Step 1: Redirect to Google OAuth**
```javascript
// Redirect user to Google OAuth
window.location.href = 'http://localhost:3001/api/v1/auth/google';
```

**Step 2: Handle Callback**
The callback URL will receive the authentication result. You can either:

**Option A: Redirect to frontend with tokens (recommended)**
Modify the callback to redirect to your frontend with tokens:

```typescript
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleAuthRedirect(@Request() req, @Res() res): Promise<void> {
  const authResult = await this.authService.googleLogin(req.user);
  
  // Redirect to frontend with tokens
  const frontendUrl = `http://localhost:3000/auth/callback?token=${authResult.accessToken}&refresh=${authResult.refreshToken}`;
  res.redirect(frontendUrl);
}
```

**Option B: Return JSON response**
The current implementation returns JSON with tokens.

## 4. API Endpoints

- **GET** `/api/v1/auth/google` - Initiate Google OAuth flow
- **GET** `/api/v1/auth/google/callback` - Google OAuth callback

## 5. User Experience

1. User clicks "Sign in with Google" button
2. Redirected to Google consent screen
3. User grants permissions
4. Google redirects back to your callback URL
5. Backend creates/updates user and returns JWT tokens
6. Frontend stores tokens and user is logged in

## 6. Security Notes

- Google users don't have passwords in your system
- Their accounts are automatically email-verified
- Existing users can link their Google account
- New users are created with default preferences
