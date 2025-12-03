import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteWithEnokiSponsorship } from './useSignAndExecuteWithEnokiSponsorship';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Custom hook that wraps useSignAndExecuteTransaction with automatic gas sponsorship
 * for Enoki wallets using Enoki's sponsored transaction SDK.
 * 
 * This hook automatically:
 * - Detects if the wallet is an Enoki wallet
 * - For Enoki wallets: Uses Enoki sponsored transactions via backend
 * - For other wallets: Uses regular sign and execute
 * 
 * Usage:
 * ```tsx
 * const { mutate: signAndExecute } = useSignAndExecuteWithSponsorship();
 * 
 * const tx = createSomeTransaction();
 * signAndExecute({ transaction: tx });
 * ```
 */
export function useSignAndExecuteWithSponsorship(): UseMutationResult<
  { digest: string },
  Error,
  { transaction: Transaction },
  unknown
> {
  // Delegate to the Enoki-sponsored transaction hook
  // which handles both Enoki and non-Enoki wallets
  return useSignAndExecuteWithEnokiSponsorship();
}
