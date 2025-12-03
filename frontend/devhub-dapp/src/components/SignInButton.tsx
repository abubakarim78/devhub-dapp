import { useCurrentAccount, useWallets, useConnectWallet } from '@mysten/dapp-kit';
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki';
import { ConnectButton } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { Wallet, Mail, Facebook, Twitch } from 'lucide-react';

/**
 * Get wallet icon component based on wallet name or icon property
 */
function getWalletIcon(wallet: { name: string; icon?: string }, size: number = 18) {
  // If wallet has an icon property, use it
  if (wallet.icon) {
    return (
      <img 
        src={wallet.icon} 
        alt={wallet.name}
        width={size}
        height={size}
        className="rounded"
      />
    );
  }
  
  const name = wallet.name.toLowerCase();
  
  // Use SVG icons for popular wallets
  if (name.includes('phantom')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground dark:text-white">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
        <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
      </svg>
    );
  }
  
  if (name.includes('okx') || name.includes('okex')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground dark:text-white">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  if (name.includes('sui wallet') || name.includes('suiwallet')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground dark:text-white">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
        <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
      </svg>
    );
  }
  
  if (name.includes('slush')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground dark:text-white">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
        <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
      </svg>
    );
  }
  
  // Default wallet icon
  return <Wallet size={size} className="text-foreground dark:text-white" />;
}

/**
 * Custom Sign In button that shows both wallet and social login options.
 * Replaces the standard ConnectButton with a "Sign In" label and custom modal.
 */
export function SignInButton() {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutateAsync: connectWallet } = useConnectWallet();
  const [showModal, setShowModal] = useState(false);

  // Separate Enoki wallets from regular wallets
  const enokiWallets = wallets.filter(isEnokiWallet);
  const regularWallets = wallets.filter((wallet) => !isEnokiWallet(wallet));

  // Debug: Log wallet detection
  useEffect(() => {
    if (enokiWallets.length === 0) {
      console.warn('⚠️ No Enoki wallets detected. Social login options will not be available.');
      console.warn('   Possible reasons:');
      console.warn('   1. Using a Private API key instead of Public API key');
      console.warn('   2. Google Client ID not configured or invalid');
      console.warn('   3. Enoki wallets failed to register (check console for errors)');
      console.warn('   4. Network not supported (must be testnet, devnet, or mainnet)');
    } else {
      console.log(`✅ Found ${enokiWallets.length} Enoki wallet(s):`, enokiWallets.map(w => w.name || w.provider));
    }
  }, [enokiWallets]);

  // Prevent body scroll when modal is open
  // IMPORTANT: This hook must be called before any conditional returns
  useEffect(() => {
    if (showModal) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showModal]);

  // Organize Enoki wallets by provider
  const walletsByProvider = enokiWallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  );

  const googleWallet = walletsByProvider.get('google');
  const facebookWallet = walletsByProvider.get('facebook');
  const twitchWallet = walletsByProvider.get('twitch');

  // If user is connected, show the ConnectButton (which handles disconnect/account switching)
  // Filter out Enoki wallets from the modal since we handle them separately
  if (currentAccount) {
    return (
      <ConnectButton
        walletFilter={(wallet) => !isEnokiWallet(wallet)}
      />
    );
  }

  // Custom modal for sign in options
  if (showModal) {
    return (
      <>
        <button
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-[100]"
          aria-label="Close modal"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-background dark:bg-gray-900 border-2 border-border dark:border-gray-700 rounded-xl shadow-2xl dark:shadow-black/50 p-6 max-w-md w-full mx-4 pointer-events-auto">
            <h2 className="text-xl font-semibold mb-4 text-foreground dark:text-white">Sign In to BountyLink</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-300 mb-6">
              Choose how you'd like to sign in
            </p>

            <div className="space-y-3">
              {/* Social Login Options */}
              {(googleWallet || facebookWallet || twitchWallet) && (
                <div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mb-2 uppercase tracking-wide font-medium">
                    Social Login
                  </p>
                  <div className="space-y-2">
                    {googleWallet && (
                      <button
                        onClick={async () => {
                          try {
                            if (connectWallet) {
                              await connectWallet({ wallet: googleWallet });
                            } else if (googleWallet.features['standard:connect']) {
                              await googleWallet.features['standard:connect'].connect();
                            }
                            setShowModal(false);
                          } catch (error: any) {
                            console.error('Error connecting Google wallet:', error);
                            // If it's a redirect_uri_mismatch error, provide helpful guidance
                            if (error?.message?.includes('redirect_uri') || error?.message?.includes('redirect')) {
                              console.error('⚠️ Redirect URI Mismatch Error:');
                              console.error('1. Check your Enoki dashboard for the correct redirect URI');
                              console.error('2. Add that exact redirect URI to Google Cloud Console > OAuth 2.0 Client > Authorized redirect URIs');
                              console.error('3. The redirect URI should be from Enoki (e.g., https://enoki.mystenlabs.com/auth/callback), NOT your localhost URL');
                            }
                            // If it's an Invalid client ID error
                            if (error?.message?.includes('Invalid client ID') || error?.message?.includes('client ID')) {
                              console.error('⚠️ Invalid Client ID Error:');
                              console.error('1. Verify your Google Client ID in Google Cloud Console');
                              console.error('2. Make sure the Client ID is registered in your Enoki dashboard');
                              console.error('3. Check that VITE_GOOGLE_CLIENT_ID in .env matches your Google Client ID exactly');
                              console.error('4. Restart your dev server after changing .env file');
                              console.error('5. The Client ID should end with .apps.googleusercontent.com');
                            }
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border dark:border-gray-600 bg-card dark:bg-gray-800 hover:bg-accent dark:hover:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all text-foreground dark:text-white font-medium"
                      >
                        <Mail size={18} className="text-foreground dark:text-white" />
                        <span>Sign in with Google</span>
                      </button>
                    )}
                    {facebookWallet && (
                      <button
                        onClick={async () => {
                          try {
                            if (connectWallet) {
                              await connectWallet({ wallet: facebookWallet });
                            } else if (facebookWallet.features['standard:connect']) {
                              await facebookWallet.features['standard:connect'].connect();
                            }
                            setShowModal(false);
                          } catch (error: any) {
                            console.error('Error connecting Facebook wallet:', error);
                            if (error?.message?.includes('redirect_uri') || error?.message?.includes('redirect')) {
                              console.error('⚠️ Redirect URI Mismatch: Check your Enoki dashboard for the correct redirect URI and add it to Facebook App settings');
                            }
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border dark:border-gray-600 bg-card dark:bg-gray-800 hover:bg-accent dark:hover:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all text-foreground dark:text-white font-medium"
                      >
                        <Facebook size={18} className="text-foreground dark:text-white" />
                        <span>Sign in with Facebook</span>
                      </button>
                    )}
                    {twitchWallet && (
                      <button
                        onClick={async () => {
                          try {
                            if (connectWallet) {
                              await connectWallet({ wallet: twitchWallet });
                            } else if (twitchWallet.features['standard:connect']) {
                              await twitchWallet.features['standard:connect'].connect();
                            }
                            setShowModal(false);
                          } catch (error: any) {
                            console.error('Error connecting Twitch wallet:', error);
                            if (error?.message?.includes('redirect_uri') || error?.message?.includes('redirect')) {
                              console.error('⚠️ Redirect URI Mismatch: Check your Enoki dashboard for the correct redirect URI and add it to Twitch App settings');
                            }
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border dark:border-gray-600 bg-card dark:bg-gray-800 hover:bg-accent dark:hover:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all text-foreground dark:text-white font-medium"
                      >
                        <Twitch size={18} className="text-foreground dark:text-white" />
                        <span>Sign in with Twitch</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Wallet Options */}
              {regularWallets.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mb-2 uppercase tracking-wide font-medium">
                    Wallet
                  </p>
                  <div className="space-y-2">
                    {regularWallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={async () => {
                          try {
                            if (connectWallet) {
                              await connectWallet({ wallet });
                            } else if (wallet.features['standard:connect']) {
                              await wallet.features['standard:connect'].connect();
                            }
                            setShowModal(false);
                          } catch (error) {
                            console.error(`Error connecting ${wallet.name}:`, error);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border dark:border-gray-600 bg-card dark:bg-gray-800 hover:bg-accent dark:hover:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all text-foreground dark:text-white font-medium"
                      >
                        {getWalletIcon(wallet, 18)}
                        <span>Connect {wallet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback to ConnectButton if no custom options */}
              {enokiWallets.length === 0 && regularWallets.length === 0 && (
                <ConnectButton connectText="Sign In" />
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full px-4 py-2 text-sm text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  // Show sign in button
  return (
    <button
      onClick={() => setShowModal(true)}
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
    >
      Sign In
    </button>
  );
}

