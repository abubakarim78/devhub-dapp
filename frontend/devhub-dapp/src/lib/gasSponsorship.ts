import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useWallets } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';

/**
 * Get the sponsor wallet address from environment variables
 * This wallet will pay for gas fees for Enoki wallet transactions
 */
export function getSponsorWalletAddress(): string | null {
  const sponsorAddress = import.meta.env.VITE_GAS_SPONSOR_WALLET_ADDRESS;
  
  if (!sponsorAddress || sponsorAddress.trim() === '') {
    console.warn('⚠️ VITE_GAS_SPONSOR_WALLET_ADDRESS not set. Gas sponsorship will not be available.');
    return null;
  }

  // Validate address format (basic check)
  const trimmedAddress = sponsorAddress.trim();
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 66) {
    console.error('❌ Invalid sponsor wallet address format. Expected 0x followed by 64 hex characters.');
    return null;
  }

  return trimmedAddress;
}

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

/**
 * Set gas sponsorship on a transaction if using Enoki wallet
 * 
 * NOTE: setGasOwner() requires the sponsor wallet to also sign the transaction,
 * which cannot be done from the frontend. This function is kept for compatibility
 * but does not modify the transaction.
 * 
 * For automatic funding, use a backend service to send 0.1 SUI to Enoki wallets
 * when they're created, so they can pay for their own gas.
 * 
 * @param tx The transaction to set gas sponsorship on
 * @param isEnoki Whether the current account is from an Enoki wallet
 * @returns The transaction (unchanged, as sponsorship requires backend)
 */
export function setGasSponsorship(
  tx: Transaction,
  isEnoki: boolean
): Transaction {
  if (!isEnoki) {
    return tx; // No sponsorship needed for regular wallets
  }

  const sponsorAddress = getSponsorWalletAddress();
  
  if (!sponsorAddress) {
    console.warn('⚠️ Enoki wallet detected but no sponsor address configured. Transaction may fail if wallet has no gas.');
    return tx;
  }

  // NOTE: We cannot use tx.setGasOwner() here because it requires the sponsor
  // wallet to also sign the transaction. Since we can't sign with the sponsor
  // wallet from the frontend, we need a backend service to handle funding.
  // 
  // The recommended approach is to have a backend service automatically send
  // 0.1 SUI to each Enoki wallet when it's created, so they can pay for their own gas.
  
  console.warn('⚠️ Enoki wallet detected. Gas sponsorship via setGasOwner requires backend signing.');
  console.warn('   Consider implementing automatic funding (0.1 SUI per Enoki wallet) via backend service.');
  
  return tx; // Return transaction unchanged
}

/**
 * Hook to prepare a transaction with gas sponsorship for Enoki wallets
 * Use this hook in components that build and execute transactions
 * 
 * @returns A function that prepares transactions with gas sponsorship
 */
export function usePrepareTransactionWithSponsorship() {
  const isEnoki = useIsEnokiAccount();

  return (tx: Transaction): Transaction => {
    return setGasSponsorship(tx, isEnoki);
  };
}

