import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

// Initialize the SuiClient (adjust the endpoint as needed)
export const suiClient = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });

// Platform fee in MIST (0.1 SUI = 100,000,000 MIST)
export const PLATFORM_FEE = 100_000_000;

// Your contract constants
export const DEVHUB_PACKAGE_ID = "0x8cb69f0fe56be1d6577375e4a9b7948aaef4296f936559cb1e889158e92dda97"; // Replace with your actual package ID
export const DEVHUB_OBJECT_ID = "0xe788c820b9f307612be98a369b0048d998000464baf1c83f3886f0020044738a"; // Replace with your actual DevHub object ID

interface FormData {
  name: string;
  title: string;
  imageUrl: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
}

export function createCardTransaction(formData: FormData, coinIds: string[]) {
  const tx = new Transaction();
  
  // Merge coins if multiple coins are provided
  let paymentCoin;
  if (coinIds.length === 1) {
    paymentCoin = tx.object(coinIds[0]);
  } else {
    // Merge multiple coins into one
    const primaryCoin = tx.object(coinIds[0]);
    const coinsToMerge = coinIds.slice(1).map(id => tx.object(id));
    tx.mergeCoins(primaryCoin, coinsToMerge);
    paymentCoin = primaryCoin;
  }

  // Call the create_card function
  tx.moveCall({
    target: `${DEVHUB_PACKAGE_ID}::devcard::create_card`,
    arguments: [
      tx.pure.string(formData.name),
      tx.pure.string(formData.title),
      tx.pure.string(formData.imageUrl),
      tx.pure.u8(formData.yearsOfExperience),
      tx.pure.string(formData.technologies),
      tx.pure.string(formData.portfolio),
      tx.pure.string(formData.contact),
      paymentCoin,
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to check if user has sufficient balance
export async function checkUserBalance(userAddress: string): Promise<{
  hasEnoughBalance: boolean;
  totalBalance: number;
  message: string;
}> {
  try {
    const coins = await suiClient.getCoins({
      owner: userAddress,
      coinType: '0x2::sui::SUI',
    });
    
    if (!coins.data?.length) {
      return {
        hasEnoughBalance: false,
        totalBalance: 0,
        message: 'No SUI coins found in wallet',
      };
    }

    const totalBalance = coins.data.reduce(
      (sum: number, coin: any) => sum + parseInt(coin.balance),
      0
    );

    const requiredAmount = PLATFORM_FEE + 10000000; // Platform fee + gas buffer
    
    return {
      hasEnoughBalance: totalBalance >= requiredAmount,
      totalBalance,
      message: totalBalance >= requiredAmount 
        ? 'Sufficient balance available'
        : `Insufficient balance. Need ${requiredAmount / 1000000000} SUI, have ${totalBalance / 1000000000} SUI`,
    };
  } catch (error) {
    return {
      hasEnoughBalance: false,
      totalBalance: 0,
      message: `Error checking balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Helper function to get suitable coins for payment
export async function getSuitableCoins(userAddress: string): Promise<string[]> {
  try {
    const coins = await suiClient.getCoins({
      owner: userAddress,
      coinType: '0x2::sui::SUI',
    });
    
    if (!coins.data?.length) {
      throw new Error('No SUI coins found in wallet');
    }

    const requiredAmount = PLATFORM_FEE + 10000000; // Platform fee + gas buffer
    
    // Try to find a single coin with sufficient balance
    const suitableCoin = coins.data.find((coin: any) => 
      parseInt(coin.balance) >= requiredAmount
    );

    if (suitableCoin) {
      return [suitableCoin.coinObjectId];
    }

    // If no single coin is sufficient, collect multiple coins
    const sortedCoins = coins.data.sort((a: any, b: any) => 
      parseInt(b.balance) - parseInt(a.balance)
    );

    let totalBalance = 0;
    const coinIds = [];

    for (const coin of sortedCoins) {
      coinIds.push(coin.coinObjectId);
      totalBalance += parseInt(coin.balance);
      if (totalBalance >= requiredAmount) {
        break;
      }
    }

    if (totalBalance < requiredAmount) {
      throw new Error(`Insufficient balance. Need ${requiredAmount / 1000000000} SUI, have ${totalBalance / 1000000000} SUI`);
    }

    return coinIds;
  } catch (error) {
    throw new Error(`Error getting suitable coins: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}