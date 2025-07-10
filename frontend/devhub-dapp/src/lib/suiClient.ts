import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Contract configuration
export const PACKAGE_ID = '0xa0c00533b8137620f813b49595f13d44bacec70835f566dbb64a1d29ce8388ee';
export const DEVHUB_OBJECT_ID = '0xe60a880fd80226e11754de85c2cc3bc0603a991c91e952c5c0e3de53f8ca12a4';
export const PLATFORM_FEE = 100_000_000; // 0.1 SUI in MIST

// Initialize Sui client
export const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

// Contract function names
export const CONTRACT_FUNCTIONS = {
  CREATE_CARD: 'create_card',
  UPDATE_DESCRIPTION: 'update_card_description',
  ACTIVATE_CARD: 'activate_card',
  DEACTIVATE_CARD: 'deactivate_card',
  WITHDRAW_PLATFORM_FEES: 'withdraw_platform_fees',
  WITHDRAW_ALL_PLATFORM_FEES: 'withdraw_all_platform_fees',
  TRANSFER_ADMIN: 'transfer_admin',
  GET_CARD_INFO: 'get_card_info',
  GET_CARD_COUNT: 'get_card_count',
  GET_ADMIN: 'get_admin',
  GET_PLATFORM_FEE_BALANCE: 'get_platform_fee_balance',
  IS_ADMIN: 'is_admin',
};

export interface DevCardData {
  id: number;
  owner: string;
  name: string;
  title: string;
  imageUrl: string;
  description?: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
  openToWork: boolean;
}

// // Helper function to convert string to vector<u8>
// function stringToVector(str: string): number[] {
//   return Array.from(new TextEncoder().encode(str));
// }


// Helper function to create transaction block for card creation
export function createCardTransaction(
  cardData: {
    name: string;
    title: string;
    imageUrl: string;
    yearsOfExperience: number;
    technologies: string;
    portfolio: string;
    contact: string;
  },
  paymentCoinId: string
) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.CREATE_CARD}`,
    arguments: [
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.title))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.imageUrl))),
      tx.pure.u8(cardData.yearsOfExperience),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.technologies))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.portfolio))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.contact))),
      tx.object(paymentCoinId),
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });
  return tx;
}

// Helper function to update card description
export function updateDescriptionTransaction(cardId: number, newDescription: string) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.UPDATE_DESCRIPTION}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newDescription))),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}
// Helper function to toggle card work status
export function toggleWorkStatusTransaction(cardId: number, activate: boolean) {
  const tx = new Transaction();
  
  const functionName = activate ? CONTRACT_FUNCTIONS.ACTIVATE_CARD : CONTRACT_FUNCTIONS.DEACTIVATE_CARD;
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${functionName}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

// Helper function to withdraw platform fees
export function withdrawFeesTransaction(recipient: string, amount: number) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.WITHDRAW_PLATFORM_FEES}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(recipient),
      tx.pure.u64(amount),
    ],
  });

  return tx;
}

// Helper function to withdraw all platform fees
export function withdrawAllFeesTransaction() {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.WITHDRAW_ALL_PLATFORM_FEES}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });

  return tx;
}