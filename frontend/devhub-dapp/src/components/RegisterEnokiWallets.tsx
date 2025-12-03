import { useEffect } from 'react';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';

/**
 * Component to register Enoki wallets with the wallet-standard.
 * This should be rendered before the WalletProvider in the component tree.
 * 
 * IMPORTANT: This component uses the PUBLIC Enoki API key for frontend wallet registration.
 */
export function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    // Get Enoki PUBLIC API key from environment variables
    const enokiApiKey = import.meta.env.VITE_ENOKI_API_KEY;
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const facebookClientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID;
    const twitchClientId = import.meta.env.VITE_TWITCH_CLIENT_ID;

    // Only register if we have at least the API key and one provider
    if (!enokiApiKey) {
      console.warn('⚠️ Enoki API key not found. Enoki wallets will not be available.');
      console.warn('   Make sure VITE_ENOKI_API_KEY is set in your .env file');
      return;
    }

    // Warn if using a Private API key (common mistake)
    const trimmedApiKey = enokiApiKey.trim();
    if (trimmedApiKey.startsWith('sk_') || trimmedApiKey.startsWith('prv_') || trimmedApiKey.toLowerCase().includes('private')) {
      console.error('❌ ERROR: You are using a PRIVATE API key!');
      console.error('   Private API keys are for backend/server-side use only.');
      console.error('   For frontend wallet registration, you MUST use a PUBLIC API key.');
      console.error('   Get your Public API key from your Enoki dashboard.');
      console.error('   Public keys typically start with "pk_" or similar.');
      return;
    }

    // Validate Client IDs format
    const validateClientId = (clientId: string | undefined, provider: string): boolean => {
      if (!clientId) return false;
      if (clientId.trim() === '' || clientId === `your_${provider}_client_id_here`) {
        console.warn(`⚠️ ${provider} Client ID appears to be a placeholder. Please set a real Client ID.`);
        return false;
      }
      // Google Client IDs typically end with .apps.googleusercontent.com
      if (provider === 'google' && !clientId.includes('.apps.googleusercontent.com') && !clientId.startsWith('http')) {
        console.warn(`⚠️ Google Client ID format may be incorrect. Expected format: *.apps.googleusercontent.com`);
        console.warn(`   Current value: ${clientId.substring(0, 20)}...`);
      }
      return true;
    };

    const providers: {
      google?: { clientId: string };
      facebook?: { clientId: string };
      twitch?: { clientId: string };
    } = {};

    if (googleClientId && validateClientId(googleClientId, 'google')) {
      const trimmedId = googleClientId.trim();
      providers.google = { clientId: trimmedId };
      console.log('✅ Google OAuth Client ID configured');
      console.log(`   Client ID: ${trimmedId.substring(0, 30)}...${trimmedId.substring(trimmedId.length - 20)}`);
      console.log('   ⚠️ Make sure this Client ID is also registered in your Enoki dashboard');
    } else if (googleClientId) {
      console.error('❌ Invalid Google Client ID. Please check your VITE_GOOGLE_CLIENT_ID in .env file');
      console.error(`   Current value: ${googleClientId}`);
    }

    if (facebookClientId && validateClientId(facebookClientId, 'facebook')) {
      providers.facebook = { clientId: facebookClientId.trim() };
      console.log('✅ Facebook OAuth Client ID configured');
    } else if (facebookClientId) {
      console.error('❌ Invalid Facebook Client ID. Please check your VITE_FACEBOOK_CLIENT_ID in .env file');
    }

    if (twitchClientId && validateClientId(twitchClientId, 'twitch')) {
      providers.twitch = { clientId: twitchClientId.trim() };
      console.log('✅ Twitch OAuth Client ID configured');
    } else if (twitchClientId) {
      console.error('❌ Invalid Twitch Client ID. Please check your VITE_TWITCH_CLIENT_ID in .env file');
    }

    // Only register if we have at least one provider configured
    if (Object.keys(providers).length === 0) {
      console.warn('⚠️ No Enoki OAuth providers configured. Enoki wallets will not be available.');
      console.warn('   Please set at least one OAuth Client ID in your .env file:');
      console.warn('   - VITE_GOOGLE_CLIENT_ID');
      console.warn('   - VITE_FACEBOOK_CLIENT_ID');
      console.warn('   - VITE_TWITCH_CLIENT_ID');
      return;
    }

    try {
      registerEnokiWallets({
        client,
        network: network as 'testnet' | 'devnet' | 'mainnet',
        apiKey: enokiApiKey.trim(),
        providers,
      });
      console.log('✅ Enoki wallets registered successfully');
      console.log(`   Registered providers: ${Object.keys(providers).join(', ')}`);
    } catch (error: any) {
      console.error('❌ Error registering Enoki wallets:', error);
      if (error?.message?.includes('Invalid client ID') || error?.message?.includes('client ID')) {
        console.error('⚠️ Client ID Validation Error:');
        console.error('   1. Verify your Client ID is correct in Google Cloud Console');
        console.error('   2. Make sure you copied the Client ID (not the Client Secret)');
        console.error('   3. Check that the Client ID is set correctly in your .env file');
        console.error('   4. Restart your dev server after changing .env file');
      }
    }
  }, [client, network]);

  return null; // This component doesn't render anything
}

