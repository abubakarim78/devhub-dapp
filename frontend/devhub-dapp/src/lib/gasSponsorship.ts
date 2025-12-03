import { useCurrentAccount, useWallets } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';

/**
 * Check if the current account is from an Enoki wallet
 * This is a hook that must be used within a React component
 */
export function useIsEnokiAccount(): boolean {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  
  if (!currentAccount) {
    return false;
  }

  // Find the wallet that matches the current account
  const connectedWallet = wallets.find(
    (wallet) => wallet.accounts.some((acc) => acc.address === currentAccount.address)
  );

  if (!connectedWallet) {
    // Fallback: check if any Enoki wallet has this account
    const enokiWallets = wallets.filter(isEnokiWallet);
    return enokiWallets.some(wallet => 
      wallet.accounts.some(acc => acc.address === currentAccount.address)
    );
  }

  return isEnokiWallet(connectedWallet);
}

/**
 * Non-hook version to check if an account address belongs to an Enoki wallet
 * This can be used outside of React components
 * 
 * @param address The account address to check
 * @param wallets Array of wallets from useWallets hook
 */
export function isEnokiAccountAddress(
  address: string,
  wallets: Array<{ accounts: Array<{ address: string }> }>
): boolean {
  if (!address) {
    return false;
  }

  // Find the wallet that matches the account address
  const matchingWallet = wallets.find(
    (wallet) => wallet.accounts.some((acc) => acc.address === address)
  );

  return matchingWallet ? isEnokiWallet(matchingWallet as any) : false;
}
