import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { usePrepareTransactionWithSponsorship } from '../lib/gasSponsorship';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Custom hook that wraps useSignAndExecuteTransaction with automatic gas sponsorship
 * for Enoki wallets. This ensures Enoki wallets can execute transactions seamlessly
 * without needing their own gas coins.
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
  const prepareTransaction = usePrepareTransactionWithSponsorship();
  const signAndExecuteResult = useSignAndExecuteTransaction();
  const { mutate, mutateAsync, ...rest } = signAndExecuteResult;

  // Wrap the mutate function to apply gas sponsorship before signing
  const wrappedMutate = (args: { transaction: Transaction }, options?: any) => {
    // Clone the transaction to avoid mutating the original
    const sponsoredTx = prepareTransaction(args.transaction);
    
    return mutate({ ...args, transaction: sponsoredTx }, options);
  };

  // Wrap the mutateAsync function to apply gas sponsorship before signing
  const wrappedMutateAsync = async (args: { transaction: Transaction }, options?: any) => {
    // Clone the transaction to avoid mutating the original
    const sponsoredTx = prepareTransaction(args.transaction);
    
    return mutateAsync({ ...args, transaction: sponsoredTx }, options);
  };

  return {
    mutate: wrappedMutate,
    mutateAsync: wrappedMutateAsync,
    ...rest,
  } as UseMutationResult<
    { digest: string },
    Error,
    { transaction: Transaction },
    unknown
  >;
}

