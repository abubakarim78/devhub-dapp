# Enoki zkLogin Setup Guide

This guide explains how to configure Enoki zkLogin for social authentication in the DevHub dApp.

## Overview

Enoki zkLogin allows users to sign in with their social accounts (Google, Facebook, Twitch) without needing a crypto wallet. Each authenticated user receives a unique Sui address based on their Web 2.0 authentication.

## Prerequisites

1. An Enoki account - Sign up at [https://enoki.mystenlabs.com](https://enoki.mystenlabs.com)
2. OAuth credentials for the social providers you want to support

## Configuration Steps

### 1. Get Your Enoki API Keys and Register OAuth Clients

1. Log in to your Enoki account at [https://enoki.mystenlabs.com](https://enoki.mystenlabs.com)
2. Navigate to your dashboard
3. **Get Your Public API Key:**
   - **Public API Key**: For frontend wallet registration (safe to expose)
     - Used in frontend code for registering Enoki wallets
     - Set in `.env` as `VITE_ENOKI_API_KEY`
     - Public keys typically start with `pk_` or similar
4. **IMPORTANT**: In your Enoki dashboard, you may need to register your OAuth Client IDs
   - Some Enoki setups require you to register the Client IDs in the Enoki dashboard
   - Check if there's a section for "OAuth Providers" or "Social Logins" in your Enoki dashboard
   - Add your Google Client ID there if required
   - This ensures Enoki knows which Client IDs are authorized for your API key

### 2. Set Up OAuth Providers

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. **IMPORTANT - Add Redirect URIs:**
   - For **local development**, Enoki uses your localhost URL as the redirect URI
   - Add the **exact** redirect URI that appears in the error message (e.g., `http://localhost:5173/`)
   - Make sure to include:
     - The protocol (`http://` or `https://`)
     - The exact domain (`localhost` or your domain)
     - The port number if present (`:5173`)
     - The trailing slash if present (`/`)
   - For **production**, you may need to add your production domain's redirect URI
   - Add these URIs to the **Authorized redirect URIs** field in Google Cloud Console
   - **Important**: The URI must match **exactly** - even a small difference (like missing trailing slash) will cause an error
4. Copy the **Client ID**:
   - **IMPORTANT**: Copy the **Client ID** (not the Client Secret)
   - The Client ID will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - It should end with `.apps.googleusercontent.com`
   - You'll use this in your `.env` file as `VITE_GOOGLE_CLIENT_ID`
5. **Application type**: Make sure you select **"Web application"** when creating the OAuth client
6. **Verify**: Double-check that you copied the Client ID correctly - even one wrong character will cause an "Invalid client ID" error

#### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy the **App ID** (this is your Client ID)

#### Twitch OAuth Setup

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Add OAuth redirect URIs
4. Copy the **Client ID**

### 3. Configure Environment Variables

Create a `.env` file in the `frontend/devhub-dapp` directory with the following variables:

```env
# Required: Enoki PUBLIC API Key (for frontend wallet registration)
# ⚠️ IMPORTANT: Use the PUBLIC API key, not the Private key
# Private keys are for backend use only and will cause "Invalid client ID" errors
VITE_ENOKI_API_KEY=your_enoki_public_api_key_here

# Optional: OAuth Provider Client IDs (only configure the ones you want to use)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id_here
VITE_TWITCH_CLIENT_ID=your_twitch_client_id_here
```

**Important Notes:**
- At minimum, you need `VITE_ENOKI_API_KEY` and at least one provider client ID
- Only configure the providers you want to support
- The `VITE_` prefix is required for Vite to expose these variables to the frontend
- **Make sure you're using the Client ID, NOT the Client Secret**
- Google Client IDs typically end with `.apps.googleusercontent.com`
- After changing `.env` file, **restart your dev server** for changes to take effect

### 4. Restart Development Server

After adding environment variables, restart your development server:

```bash
pnpm dev
```

## How It Works

1. **Registration**: The `RegisterEnokiWallets` component automatically registers Enoki wallets when the app loads
2. **Sign In**: Users click "Sign In" and see options for:
   - Social login (Google, Facebook, Twitch) - if configured
   - Wallet connection (Sui Wallet, etc.)
3. **OAuth Flow**: When a user selects a social provider, Enoki handles the OAuth flow in a pop-up window
4. **Address Generation**: Each authenticated user receives a consistent Sui address based on their social account

## Features

- ✅ No wallet required for social login
- ✅ Consistent addresses per user per app
- ✅ Works alongside traditional wallet connections
- ✅ Supports multiple social providers
- ✅ Seamless integration with dapp-kit

## Troubleshooting

### Quick Fix: `redirect_uri_mismatch` Error

**If you see: `Error 400: redirect_uri_mismatch` with `redirect_uri=http://localhost:5173/`**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", click "ADD URI"
4. Add exactly: `http://localhost:5173/` (copy the exact URI from the error message)
5. Click "SAVE"
6. Wait 2-3 minutes for changes to propagate
7. Try signing in again

**Important**: The URI must match exactly - check for:
- Protocol: `http://` (not `https://` for localhost)
- Domain: `localhost` (not `127.0.0.1`)
- Port: `:5173` (or your dev server port)
- Trailing slash: `/` (if present in error, include it)

### Enoki wallets not appearing

- Check that `VITE_ENOKI_API_KEY` is set correctly
- Verify at least one OAuth provider is configured
- Check browser console for error messages
- Ensure you're on a supported network (testnet/mainnet)

### OAuth flow not working

#### Error: `Invalid client ID` (Enoki API Error 400)

This error occurs when:
- The OAuth Client ID is incorrect, missing, or not properly configured
- **You're using a Private API Key instead of a Public API Key** (most common cause!)

**Solution:**
1. **Check if you're using the correct API Key type:**
   - **Public API Key**: Should be used in frontend code (starts with `pk_` or similar)
   - **Private API Key**: Only for backend use (starts with `sk_` or `prv_`)
   - If you're using a Private key, switch to your Public API Key in the `.env` file
   - Private keys will cause "Invalid client ID" errors when used in the frontend

2. **Verify your Client ID is correct:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Click on your OAuth 2.0 Client ID
   - Copy the **Client ID** (NOT the Client Secret)
   - Google Client IDs typically end with `.apps.googleusercontent.com`

2. **Register Client ID in Enoki Dashboard (if required):**
   - Log in to your [Enoki dashboard](https://enoki.mystenlabs.com)
   - Look for a section to register OAuth Client IDs
   - Add your Google Client ID there
   - Some Enoki accounts require Client IDs to be registered in the dashboard before they can be used
   - This links your Client ID to your Enoki API key

3. **Check your .env file:**
   - Make sure `VITE_GOOGLE_CLIENT_ID` is set correctly
   - Remove any quotes around the value (e.g., use `VITE_GOOGLE_CLIENT_ID=123456.apps.googleusercontent.com` not `VITE_GOOGLE_CLIENT_ID="123456.apps.googleusercontent.com"`)
   - Make sure there are no extra spaces
   - The value should match exactly what's in Google Cloud Console

4. **Restart your dev server:**
   - Stop your dev server (Ctrl+C)
   - Start it again: `pnpm dev`
   - Environment variables are only loaded when the server starts

5. **Verify the Client ID format:**
   - Google: Should end with `.apps.googleusercontent.com`
   - Facebook: Should be a numeric App ID
   - Twitch: Should be a string Client ID

6. **Check browser console:**
   - Look for validation messages when the app loads
   - The console will show the Client ID being used (first 30 and last 20 characters)
   - Compare this with your Google Cloud Console Client ID to ensure they match

#### Error: `redirect_uri_mismatch` (Error 400)

This error occurs when the redirect URI in your OAuth provider (Google/Facebook/Twitch) doesn't match what Enoki is using.

**Solution:**
1. **Find Enoki's redirect URI:**
   - Check your Enoki dashboard for the redirect URI
   - Look in the Enoki documentation: [https://docs.mystenlabs.com/enoki](https://docs.mystenlabs.com/enoki)
   - Check the browser's Network tab when the OAuth popup opens - look for the `redirect_uri` parameter in the OAuth request
   - For **local development**, the redirect URI is typically your localhost URL:
     - `http://localhost:5173/` (or your dev server port)
     - `http://localhost:3000/`
     - Check the error message to see the exact URI being used
   - For **production**, it may be:
     - Your production domain (e.g., `https://yourdomain.com/`)
     - Or Enoki's redirect URI (check Enoki dashboard)

2. **Add the redirect URI to your OAuth provider:**
   - **Google Cloud Console**: Go to APIs & Services > Credentials > Your OAuth 2.0 Client ID > Authorized redirect URIs
   - Add the exact redirect URI from Enoki (copy it exactly, including protocol and path)
   - Save the changes

3. **Verify the redirect URI:**
   - The URI must match exactly - check for:
     - Protocol (http vs https)
     - Domain (enoki.mystenlabs.com)
     - Path (/auth/callback or similar)
     - No trailing slashes unless Enoki's URI has one

4. **Wait for changes to propagate:**
   - Google OAuth changes can take a few minutes to propagate
   - Try again after 2-3 minutes

#### Other OAuth issues

- Verify redirect URIs are correctly configured in OAuth provider settings
- Ensure the redirect URI matches Enoki's URI exactly (not your app's URL)
- Check that pop-ups are not blocked in the browser
- Make sure you're using the correct OAuth Client ID (not a secret)

### Network issues

- Enoki wallets are bound to specific networks (testnet/mainnet)
- Ensure your app's network configuration matches your Enoki setup
- Re-register wallets if you switch networks

## Gas Sponsorship for Enoki Wallets

Enoki wallets don't have SUI tokens by default, which means they cannot pay for transaction gas fees. To enable seamless transactions for Enoki wallet users, you need to configure gas sponsorship.

### Quick Setup

1. **Add sponsor wallet address to `.env`**:
   ```bash
   VITE_GAS_SPONSOR_WALLET_ADDRESS=0xYourSponsorWalletAddressHere
   ```

2. **Use the gas sponsorship hook** in your components:
   ```tsx
   // Replace useSignAndExecuteTransaction with:
   import { useSignAndExecuteWithSponsorship } from '../hooks/useSignAndExecuteWithSponsorship';
   
   const { mutate: signAndExecute } = useSignAndExecuteWithSponsorship();
   ```

3. **Fund the sponsor wallet** with SUI tokens to pay for gas fees.

For detailed information, see [GAS_SPONSORSHIP.md](./GAS_SPONSORSHIP.md).

## Additional Resources

- [Enoki Documentation](https://docs.mystenlabs.com/enoki)
- [dapp-kit Documentation](https://sui-typescript-docs.vercel.app/dapp-kit)
- [Sui Wallet Standard](https://github.com/wallet-standard/wallet-standard)

