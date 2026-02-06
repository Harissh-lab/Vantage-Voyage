# 🔐 Setting Up Google Authentication with Supabase

## Prerequisites
- Supabase project set up ✅
- Google Cloud Console access

## Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Name it "GatherPath" or similar

### 1.2 Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **GatherPath**
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through all steps

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **GatherPath Web Client**
   - Authorized redirect URIs: Add this EXACTLY:
     ```
     https://hrehaqqpxhlfpiszitos.supabase.co/auth/v1/callback
     ```
   - Click **Create**

5. Copy the credentials:
   - **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-...`)

## Step 2: Configure Supabase

### 2.1 Enable Google Provider
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/hrehaqqpxhlfpiszitos
2. Click **Authentication** → **Providers**
3. Find **Google** and toggle it **ON**
4. Paste your Google credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
5. Click **Save**

### 2.2 Configure Email Settings (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize welcome emails if needed

## Step 3: Add Google Sign-In Button to Your App

Already created! The button code is in the auth pages.

## Step 4: Test Google Login

1. Start your app: `npm run dev`
2. Go to http://localhost:5000
3. Click "Agent Sign In" or "Client Sign In"
4. Click the **"Sign in with Google"** button
5. Choose your Google account
6. Grant permissions
7. You'll be redirected back and logged in! ✅

## Benefits of Google OAuth

✅ **No Password to Remember** - Users sign in with Gmail
✅ **Faster Registration** - One click sign up
✅ **More Secure** - Google handles authentication
✅ **Auto-filled Profile** - Name and email from Google account
✅ **Easy Account Recovery** - Google manages it

## Security Notes

- ✅ Supabase handles all OAuth security
- ✅ Tokens are stored securely
- ✅ No passwords stored in your database
- ✅ Google handles 2FA if user has it enabled

## Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Console is EXACTLY:
  `https://hrehaqqpxhlfpiszitos.supabase.co/auth/v1/callback`
- No trailing slash, no http (must be https)

### "App not verified"
- For development, click "Advanced" → "Go to GatherPath (unsafe)"
- For production, verify your app with Google

### "OAuth not configured"
- Check Supabase → Authentication → Providers → Google is ON
- Verify Client ID and Secret are correct
