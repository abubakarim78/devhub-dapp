import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Contract configuration
export const PACKAGE_ID = '0xeb6caf43e7c918ca24982c958c370c9cf577c198a3b40ebfe37904d2362fc051';
export const DEVHUB_OBJECT_ID = '0xc643044a8177ddae8c63263ca216725a3ce8b4b3b93c52262b6d23464f8db2ac';
export const PLATFORM_FEE = 100_000_000; // 0.1 SUI in MIST

// Initialize Sui client
export const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

// Contract function names
export const CONTRACT_FUNCTIONS = {
  CREATE_CARD: 'create_card',
  DELETE_CARD: 'delete_card',
  UPDATE_DESCRIPTION: 'update_card_description',
  ACTIVATE_CARD: 'activate_card',
  DEACTIVATE_CARD: 'deactivate_card',
  SET_WORK_AVAILABILITY: 'set_work_availability',
  SET_PLATFORM_FEE: 'set_platform_fee',
  WITHDRAW_PLATFORM_FEES: 'withdraw_platform_fees',
  WITHDRAW_ALL_PLATFORM_FEES: 'withdraw_all_platform_fees',
  TRANSFER_ADMIN: 'transfer_admin',
  GET_CARD_INFO: 'get_card_info',
  GET_USER_CARD_ID: 'get_user_card_id',
  USER_HAS_CARD: 'user_has_card',
  GET_CARD_COUNT: 'get_card_count',
  GET_ADMIN: 'get_admin',
  GET_PLATFORM_FEE_BALANCE: 'get_platform_fee_balance',
  GET_PLATFORM_FEE: 'get_platform_fee',
  IS_ADMIN: 'is_admin',
  IS_CARD_ACTIVE: 'is_card_active',
  IS_CARD_OPEN_TO_WORK: 'is_card_open_to_work',
};0xeb6caf43e7c918ca24982c958c370c9cf577c198a3b40ebfe37904d2362fc051

export interface DevCardData {
  id: number;
  owner: string;
  name: string;
  title: string;
  imageUrl: string;
  description: string; // Now required
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
  openToWork: boolean;
  isActive: boolean; // New field
}

// Helper function to create transaction block for card creation
export function createCardTransaction(
  cardData: {
    name: string;
    title: string;
    description: string; // Now required
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
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.description))),
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

// Helper function to delete user's card
export function deleteCardTransaction() {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.DELETE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to update card description
export function updateDescriptionTransaction(newDescription: string) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.UPDATE_DESCRIPTION}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newDescription))),
    ],
  });

  return tx;
}

// Helper function to activate card (sets both is_active and open_to_work to true)
export function activateCardTransaction() {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.ACTIVATE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to deactivate card (sets both is_active and open_to_work to false)
export function deactivateCardTransaction() {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.DEACTIVATE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to set work availability (while keeping card active)
export function setWorkAvailabilityTransaction(available: boolean) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.SET_WORK_AVAILABILITY}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.bool(available),
    ],
  });

  return tx;
}

// === Admin Functions ===

// Helper function to set platform fee (admin only)
export function setPlatformFeeTransaction(newFee: number) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.SET_PLATFORM_FEE}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(newFee),
    ],
  });

  return tx;
}

// Helper function to withdraw platform fees (admin only)
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

// Helper function to withdraw all platform fees (admin only)
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

// Helper function to transfer admin privileges (admin only)
export function transferAdminTransaction(newAdmin: string) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.TRANSFER_ADMIN}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(newAdmin),
    ],
  });

  return tx;
}

// === View Functions (Read-only) ===

// Helper function to decode bytes to string
function decodeBytesToString(bytes: number[]): string {
  try {
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return '';
  }
}

// Helper function to safely parse return values
function parseReturnValue(value: any): any {
  if (Array.isArray(value) && value.length === 2) {
    // This is likely a [type, data] format
    const [type, data] = value;
    if (typeof type === 'number' && Array.isArray(data)) {
      // This looks like encoded bytes
      return decodeBytesToString(data);
    }
  }
  return value;
}

// Get card information by ID
export async function getCardInfo(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      const returnValues = result.results[0].returnValues;
      // Parse the returned values according to the contract's return structure
      return {
        name: parseReturnValue(returnValues[0]) as string,
        owner: parseReturnValue(returnValues[1]) as string,
        title: parseReturnValue(returnValues[2]) as string,
        imageUrl: parseReturnValue(returnValues[3]) as string,
        description: parseReturnValue(returnValues[4]) as string,
        yearsOfExperience: Number(parseReturnValue(returnValues[5])),
        technologies: parseReturnValue(returnValues[6]) as string,
        portfolio: parseReturnValue(returnValues[7]) as string,
        contact: parseReturnValue(returnValues[8]) as string,
        openToWork: Boolean(parseReturnValue(returnValues[9])),
        isActive: Boolean(parseReturnValue(returnValues[10])),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting card info:', error);
    return null;
  }
}

// Get user's card ID
export async function getUserCardId(userAddress: string): Promise<number | null> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_USER_CARD_ID}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.address(userAddress),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      const value = parseReturnValue(result.results[0].returnValues[0]);
      return value ? Number(value) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user card ID:', error);
    return null;
  }
}

// Check if user has a card
export async function userHasCard(userAddress: string): Promise<boolean> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.USER_HAS_CARD}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.address(userAddress),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Boolean(parseReturnValue(result.results[0].returnValues[0]));
    }
    return false;
  } catch (error) {
    console.error('Error checking if user has card:', error);
    return false;
  }
}

// Get total card count
export async function getCardCount(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Number(parseReturnValue(result.results[0].returnValues[0]));
    }
    return 0;
  } catch (error) {
    console.error('Error getting card count:', error);
    return 0;
  }
}

// Get current admin address
export async function getAdmin(): Promise<string | null> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_ADMIN}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return parseReturnValue(result.results[0].returnValues[0]) as string;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin:', error);
    return null;
  }
}

// Get platform fee balance
export async function getPlatformFeeBalance(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Number(parseReturnValue(result.results[0].returnValues[0]));
    }
    return 0;
  } catch (error) {
    console.error('Error getting platform fee balance:', error);
    return 0;
  }
}

// Get current platform fee amount
export async function getPlatformFee(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Number(parseReturnValue(result.results[0].returnValues[0]));
    }
    return PLATFORM_FEE; // fallback to default
  } catch (error) {
    console.error('Error getting platform fee:', error);
    return PLATFORM_FEE; // fallback to default
  }
}

// Check if address is admin
export async function isAdmin(address: string): Promise<boolean> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.IS_ADMIN}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.address(address),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Boolean(parseReturnValue(result.results[0].returnValues[0]));
    }
    return false;
  } catch (error) {
    console.error('Error checking if admin:', error);
    return false;
  }
}

// Check if card is active
export async function isCardActive(cardId: number): Promise<boolean> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.IS_CARD_ACTIVE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Boolean(parseReturnValue(result.results[0].returnValues[0]));
    }
    return false;
  } catch (error) {
    console.error('Error checking if card is active:', error);
    return false;
  }
}

// Check if card is open to work
export async function isCardOpenToWork(cardId: number): Promise<boolean> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.IS_CARD_OPEN_TO_WORK}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Boolean(parseReturnValue(result.results[0].returnValues[0]));
    }
    return false;
  } catch (error) {
    console.error('Error checking if card is open to work:', error);
    return false;
  }
}

// === Utility Functions ===

// Get all active cards (for browse page)
export async function getAllActiveCards(): Promise<DevCardData[]> {
  try {
    const cardCount = await getCardCount();
    const activeCards: DevCardData[] = [];

    for (let i = 1; i <= cardCount; i++) {
      const isActive = await isCardActive(i);
      if (isActive) {
        const cardInfo = await getCardInfo(i);
        if (cardInfo) {
          activeCards.push({
            id: i,
            ...cardInfo,
          });
        }
      }
    }

    return activeCards;
  } catch (error) {
    console.error('Error getting all active cards:', error);
    return [];
  }
}

// Get all cards open to work (for job board)
export async function getCardsOpenToWork(): Promise<DevCardData[]> {
  try {
    const cardCount = await getCardCount();
    const openToWorkCards: DevCardData[] = [];

    for (let i = 1; i <= cardCount; i++) {
      const isOpenToWork = await isCardOpenToWork(i);
      if (isOpenToWork) {
        const cardInfo = await getCardInfo(i);
        if (cardInfo) {
          openToWorkCards.push({
            id: i,
            ...cardInfo,
          });
        }
      }
    }

    return openToWorkCards;
  } catch (error) {
    console.error('Error getting cards open to work:', error);
    return [];
  }
}