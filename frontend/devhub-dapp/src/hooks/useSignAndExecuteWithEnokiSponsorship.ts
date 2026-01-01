import { useSignAndExecuteTransaction, useSignTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useIsEnokiAccount } from '../lib/gasSponsorship';
import { toB64 } from '@mysten/sui/utils';
import type { UseMutationResult } from '@tanstack/react-query';

const BACKEND_URL = import.meta.env.VITE_ENOKI_BACKEND_URL || 'http://localhost:3001';
const NETWORK = import.meta.env.VITE_SUI_NETWORK || 'testnet';

interface SponsorTransactionResponse {
  success: boolean;
  bytes: string;
  digest: string;
}

interface ExecuteTransactionResponse {
  success: boolean;
  result: any;
}

/**
 * Custom hook that implements Enoki sponsored transactions for Enoki wallets
 * and falls back to regular transactions for other wallets.
 * 
 * For Enoki wallets:
 * 1. Build transaction with onlyTransactionKind: true
 * 2. Call backend to sponsor the transaction
 * 3. Get user signature
 * 4. Execute sponsored transaction via backend
 * 
 * For other wallets:
 * Uses regular signAndExecuteTransaction
 * 
 * Usage:
 * ```tsx
 * const { mutate: signAndExecute } = useSignAndExecuteWithEnokiSponsorship();
 * 
 * const tx = createSomeTransaction();
 * signAndExecute({ transaction: tx });
 * ```
 */
export function useSignAndExecuteWithEnokiSponsorship(): UseMutationResult<
  { digest: string },
  Error,
  { transaction: Transaction },
  unknown
> {
  const isEnoki = useIsEnokiAccount();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signTransactionAsync } = useSignTransaction();
  const signAndExecuteResult = useSignAndExecuteTransaction();
  const { mutate: regularMutate, mutateAsync: regularMutateAsync, ...rest } = signAndExecuteResult;

  // For non-Enoki wallets, use regular sign and execute
  if (!isEnoki || !currentAccount) {
    return signAndExecuteResult as UseMutationResult<
      { digest: string },
      Error,
      { transaction: Transaction },
      unknown
    >;
  }

  // For Enoki wallets, implement sponsored transaction flow
  const sponsorAndExecute = async (args: { transaction: Transaction }): Promise<{ digest: string }> => {
    try {
      // Validate backend URL is configured
      if (!BACKEND_URL || BACKEND_URL === 'http://localhost:3001') {
        console.warn('⚠️ Backend URL not configured or using default. Make sure VITE_ENOKI_BACKEND_URL is set in your .env file');
      }

      // Step 1: Build transaction with onlyTransactionKind: true
      console.log('🔨 Building transaction for sponsorship...');
      const txBytes = await args.transaction.build({
        client: suiClient,
        onlyTransactionKind: true,
      });
      
      if (!txBytes || txBytes.length === 0) {
        throw new Error('Failed to build transaction bytes');
      }
      
      console.log('✅ Transaction built successfully, length:', txBytes.length);

      // Step 2: Sponsor the transaction via backend
      console.log('📤 Sponsoring transaction via backend:', {
        backendUrl: `${BACKEND_URL}/api/sponsor-transaction`,
        sender: currentAccount.address,
        network: NETWORK,
        txBytesLength: txBytes.length,
      });

      const sponsorResponse = await fetch(`${BACKEND_URL}/api/sponsor-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionKindBytes: toB64(txBytes),
          sender: currentAccount.address,
          network: NETWORK,
        }),
      });

      if (!sponsorResponse.ok) {
        let errorData: any = {};
        try {
          errorData = await sponsorResponse.json();
        } catch (e) {
          // If JSON parsing fails, try to get text
          const text = await sponsorResponse.text().catch(() => 'Unknown error');
          errorData = { error: text, details: `Status: ${sponsorResponse.status} ${sponsorResponse.statusText}` };
        }
        
        console.error('❌ Sponsor transaction failed:', {
          status: sponsorResponse.status,
          statusText: sponsorResponse.statusText,
          error: errorData.error,
          details: errorData.details,
          fullError: errorData,
        });
        
        throw new Error(
          errorData.error || errorData.details || `Failed to sponsor transaction: ${sponsorResponse.status} ${sponsorResponse.statusText}`
        );
      }

      const sponsorData: SponsorTransactionResponse = await sponsorResponse.json();
      
      if (!sponsorData.success || !sponsorData.bytes || !sponsorData.digest) {
        throw new Error('Invalid response from sponsor endpoint');
      }

      // Step 3: Get user signature
      // Pass the base64 string directly - useSignTransaction accepts string (base64) or Transaction
      const { signature } = await signTransactionAsync({
        transaction: sponsorData.bytes,
      });

      if (!signature) {
        throw new Error('Failed to get transaction signature');
      }

      // Step 4: Execute sponsored transaction via backend
      const executeResponse = await fetch(`${BACKEND_URL}/api/execute-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          digest: sponsorData.digest,
          signature: signature,
        }),
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to execute transaction: ${executeResponse.statusText}`);
      }

      const executeData: ExecuteTransactionResponse = await executeResponse.json();
      
      if (!executeData.success) {
        throw new Error('Transaction execution failed');
      }

      // Return digest for consistency with regular signAndExecute
      return { digest: sponsorData.digest };
    } catch (error) {
      console.error('❌ Error in Enoki sponsored transaction:', error);
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to sponsor transaction')) {
          console.error('💡 Troubleshooting tips:');
          console.error('   1. Check if the backend server is running');
          console.error('   2. Verify VITE_ENOKI_BACKEND_URL is set correctly in .env');
          console.error('   3. Check backend logs for detailed error information');
          console.error('   4. Verify VITE_ENOKI_PRIVATE_API_KEY is set in backend .env');
        }
        
        if (error.message.includes('fetch')) {
          console.error('💡 Network error - check:');
          console.error('   1. Backend server is accessible at:', BACKEND_URL);
          console.error('   2. CORS is properly configured on the backend');
          console.error('   3. Network connectivity');
        }
      }
      
      throw error;
    }
  };

  // Wrap mutate function
  const wrappedMutate = (args: { transaction: Transaction }, options?: any) => {
    sponsorAndExecute(args)
      .then((result) => {
        options?.onSuccess?.(result);
      })
      .catch((error) => {
        options?.onError?.(error);
      });
  };

  // Wrap mutateAsync function
  const wrappedMutateAsync = async (args: { transaction: Transaction }) => {
    return sponsorAndExecute(args);
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

