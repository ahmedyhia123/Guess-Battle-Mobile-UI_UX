# Google Authentication Setup Guide

Google authentication has been implemented in the Guess Battle app. To enable it, you need to configure Google OAuth in your Supabase project.

## Setup Steps

### 1. Configure Google OAuth Provider in Supabase

Follow the official Supabase guide:
**https://supabase.com/docs/guides/auth/social-login/auth-google**

### Quick Steps:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Providers**
3. Find **Google** in the list and click to configure
4. Enable the Google provider
5. You'll need to create a Google Cloud OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Create OAuth 2.0 credentials
   - Add your authorized redirect URIs (provided by Supabase)
6. Copy the **Client ID** and **Client Secret** from Google Cloud
7. Paste them into the Supabase Google provider settings
8. Save the configuration

### 2. Test the Implementation

Once configured:
- Click the **"Google"** button on the Login or Sign Up screen
- You'll be redirected to Google's authentication page
- After successful authentication, you'll be redirected back to the app
- The app will automatically log you in and navigate to the lobby

## Features Implemented

✅ Google Sign In on Login Screen  
✅ Google Sign Up on Sign Up Screen  
✅ Automatic OAuth callback handling  
✅ Session persistence across page reloads  
✅ Error handling with user-friendly messages  
✅ Fallback message if OAuth is not configured  

## How It Works

1. **User clicks Google button** → Supabase initiates OAuth flow
2. **User authenticates with Google** → Google redirects back to your app
3. **App receives OAuth callback** → Auth state listener detects the sign-in
4. **User is logged in** → Automatically navigated to the game lobby

## Notes

- The app uses a singleton Supabase client to avoid multiple instances
- OAuth redirects return to the app's origin URL
- User data is automatically synced from Google (email, name, profile picture)
- No additional signup required - Google users are created automatically in Supabase
