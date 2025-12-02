# Gas Sponsorship for Enoki Wallets

This guide explains how to configure and use gas sponsorship to allow Enoki wallets to execute transactions seamlessly without needing their own gas coins.

## Overview

Enoki wallets (social login wallets) don't have SUI tokens by default, which means they cannot pay for transaction gas fees. Gas sponsorship allows a designated wallet (the "sponsor") to pay for gas fees on behalf of Enoki wallet users, providing a seamless user experience.

## Configuration

### 1. Set Up Sponsor Wallet Address

Add the following environment variable to your `.env` file:

```bash
VITE_GAS_SPONSOR_WALLET_ADDRESS=0xYourSponsorWalletAddressHere
```

**Important:**
- The sponsor wallet must have sufficient SUI tokens to pay for gas fees
- The address must be a valid Sui address (0x followed by 64 hex characters)
- This wallet will pay for ALL gas fees for Enoki wallet transactions
- Make sure to fund this wallet appropriately for your expected transaction volume

### 2. Get a Sponsor Wallet Address

You can use any Sui wallet address as the sponsor. Options include:

1. **Create a dedicated wallet** for gas sponsorship
2. **Use an existing wallet** that you control
3. **Use a service wallet** managed by your backend

**Example:**
```bash
# In your .env file
VITE_GAS_SPONSOR_WALLET_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Usage

### Option 1: Use the Custom Hook (Recommended)

Replace `useSignAndExecuteTransaction` with `useSignAndExecuteWithSponsorship` in your components:

```tsx
// Before
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

const { mutate: signAndExecute } = useSignAndExecuteTransaction();

// After
import { useSignAndExecuteWithSponsorship } from '../hooks/useSignAndExecuteWithSponsorship';

const { mutate: signAndExecute } = useSignAndExecuteWithSponsorship();
```

The hook automatically:
- Detects if the current account is from an Enoki wallet
- Applies gas sponsorship if needed
- Works seamlessly with existing transaction code

**Example:**
```tsx
import { useSignAndExecuteWithSponsorship } from '../hooks/useSignAndExecuteWithSponsorship';
import { createCardTransaction } from '../lib/suiClient';

function MyComponent() {
  const { mutate: signAndExecute } = useSignAndExecuteWithSponsorship();
  
  const handleCreateCard = async () => {
    const tx = createCardTransaction(cardData, paymentCoinId);
    
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log('Transaction successful:', result.digest);
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
        },
      }
    );
  };
  
  return <button onClick={handleCreateCard}>Create Card</button>;
}
```

### Option 2: Manual Sponsorship

If you need more control, you can manually apply sponsorship:

```tsx
import { usePrepareTransactionWithSponsorship } from '../lib/gasSponsorship';

function MyComponent() {
  const prepareTransaction = usePrepareTransactionWithSponsorship();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const handleTransaction = async () => {
    const tx = createSomeTransaction();
    const sponsoredTx = prepareTransaction(tx);
    
    signAndExecute({ transaction: sponsoredTx });
  };
}
```

## How It Works

1. **Detection**: The system detects if the current account is from an Enoki wallet
2. **Sponsorship**: If it's an Enoki wallet, the transaction's gas owner is set to the sponsor wallet address
3. **Execution**: The transaction is signed by the Enoki wallet but paid for by the sponsor wallet

## Important Notes

- **Regular wallets are not affected**: Gas sponsorship only applies to Enoki wallets
- **Sponsor wallet must be funded**: Ensure the sponsor wallet has sufficient SUI tokens
- **Security**: The sponsor wallet only pays for gas, not for transaction payments or other costs
- **Monitoring**: Monitor the sponsor wallet balance and refill as needed

## Troubleshooting

### Error: "No valid gas coins found for the transaction"

This error occurs when:
1. The sponsor wallet address is not configured
2. The sponsor wallet has insufficient SUI tokens
3. The address format is incorrect

**Solutions:**
- Check that `VITE_GAS_SPONSOR_WALLET_ADDRESS` is set in your `.env` file
- Verify the sponsor wallet has sufficient SUI tokens
- Ensure the address format is correct (0x followed by 64 hex characters)
- Restart your dev server after changing environment variables

### Gas sponsorship not working

**Check:**
1. Is the account from an Enoki wallet? (Check console logs)
2. Is the sponsor address configured correctly?
3. Does the sponsor wallet have SUI tokens?
4. Are you using `useSignAndExecuteWithSponsorship` instead of `useSignAndExecuteTransaction`?

## Migration Guide

To migrate existing code to use gas sponsorship:

1. **Find all uses of `useSignAndExecuteTransaction`**:
   ```bash
   grep -r "useSignAndExecuteTransaction" src/
   ```

2. **Replace the import**:
   ```tsx
   // Old
   import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
   
   // New
   import { useSignAndExecuteWithSponsorship } from '../hooks/useSignAndExecuteWithSponsorship';
   ```

3. **Replace the hook usage**:
   ```tsx
   // Old
   const { mutate: signAndExecute } = useSignAndExecuteTransaction();
   
   // New
   const { mutate: signAndExecute } = useSignAndExecuteWithSponsorship();
   ```

4. **No other changes needed** - the API is identical!

## Best Practices

1. **Use a dedicated wallet** for gas sponsorship to track costs separately
2. **Monitor balance** regularly and set up alerts
3. **Set limits** if possible to prevent abuse
4. **Document** the sponsor wallet address for your team
5. **Test** with a small amount first before deploying to production

