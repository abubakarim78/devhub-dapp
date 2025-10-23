import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

// Contract configuration
export const PACKAGE_ID = '0xf16d929462dcc11dc507efd04091f400d82d7d4af92c581c8242efb2d42231ea';
export const DEVHUB_OBJECT_ID = '0xb87598e8ee41de740e1339fed633ddb30b12ce955e0b94ba6e8dc2f2c29e1339';
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
  EDIT_DEVCARD: 'edit_devcard',
  ACTIVATE_CARD: 'activate_card',
  DEACTIVATE_CARD: 'deactivate_card',
  SET_WORK_AVAILABILITY: 'set_work_availability',
  SET_PLATFORM_FEE: 'set_platform_fee',
  WITHDRAW_PLATFORM_FEES: 'withdraw_platform_fees',
  WITHDRAW_ALL_PLATFORM_FEES: 'withdraw_all_platform_fees',
  GRANT_ADMIN_ROLE: 'grant_admin_role',
  REVOKE_ADMIN_ROLE: 'revoke_admin_role',
  GET_CARD_INFO: 'get_card_info',
  GET_USER_CARD_ID: 'get_user_card_id',
  USER_HAS_CARD: 'user_has_card',
  GET_CARD_COUNT: 'get_card_count',
  GET_ADMIN: 'get_admin',
  GET_SUPER_ADMIN: 'get_super_admin',
  GET_ADMINS: 'get_admins',
  GET_PLATFORM_FEE_BALANCE: 'get_platform_fee_balance',
  GET_PLATFORM_FEE: 'get_platform_fee',
  IS_ADMIN: 'is_admin',
  IS_SUPER_ADMIN: 'is_super_admin',
  IS_CARD_ACTIVE: 'is_card_active',
  IS_CARD_OPEN_TO_WORK: 'is_card_open_to_work',
};

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
    imageUrl: string;
    yearsOfExperience: number;
    technologies: string;
    portfolio: string;
    about: string;
    featured_projects: string[];
    contact: string;
    github: string;
    linkedin: string;
    twitter: string;
    personal_website: string;
    work_types: string[];
    hourly_rate: number | null;
    location_preference: string;
    availability: string;
    languages: string[];
    avatar_walrus_blob_id: string | null;
  },
  paymentCoinId: string
) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.CREATE_CARD}`,
    arguments: [
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.title))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.imageUrl))),
      tx.pure.u8(cardData.yearsOfExperience),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.technologies))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.portfolio))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.about))),
      tx.pure.vector('string', cardData.featured_projects),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.contact))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.github))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.linkedin))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.twitter))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.personal_website))),
      tx.pure.vector('string', cardData.work_types),
      tx.pure.option('u64', cardData.hourly_rate),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.location_preference))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.availability))),
      tx.pure.vector('string', cardData.languages),
      tx.pure.option(
        'vector<u8>',
        cardData.avatar_walrus_blob_id
          ? Array.from(new TextEncoder().encode(cardData.avatar_walrus_blob_id))
          : null
      ),
      tx.object(paymentCoinId),
      tx.object(SUI_CLOCK_OBJECT_ID),
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });
  return tx;
}

// Helper function to delete user's card
export function deleteCardTransaction() {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.DELETE_CARD}`,
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
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.UPDATE_DESCRIPTION}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newDescription))),
    ],
  });

  return tx;
}

// Helper function to edit devcard with all fields
export function editDevCardTransaction(cardData: {
  name: string;
  description: string;
  title: string;
  imageUrl: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
}) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.EDIT_DEVCARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.description))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.title))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.imageUrl))),
      tx.pure.u8(cardData.yearsOfExperience),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.technologies))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.portfolio))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.contact))),
    ],
  });

  return tx;
}

// Helper function to activate card (sets both is_active and open_to_work to true)
export function activateCardTransaction() {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.ACTIVATE_CARD}`,
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
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.DEACTIVATE_CARD}`,
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
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SET_WORK_AVAILABILITY}`,
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
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SET_PLATFORM_FEE}`,
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
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.WITHDRAW_PLATFORM_FEES}`,
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
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.WITHDRAW_ALL_PLATFORM_FEES}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to grant admin privileges (super admin only)
export function grantAdminRoleTransaction(newAdmin: string) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GRANT_ADMIN_ROLE}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(newAdmin),
    ],
  });

  return tx;
}

// Helper function to revoke admin privileges (super admin only)
export function revokeAdminRoleTransaction(adminToRevoke: string) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.REVOKE_ADMIN_ROLE}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(adminToRevoke),
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

// Helper function to convert byte array to hex address
function bytesToHexAddress(bytes: any): string {
  if (!bytes) return "";

  // Handle different byte array formats
  let byteArray: number[];

  if (typeof bytes === "string") {
    // If it's already a hex string, return it
    if (bytes.startsWith("0x")) {
      return bytes;
    }
    // If it contains 'vector', it's not a valid address
    if (bytes.includes('vector')) {
      console.warn('Received vector string, skipping:', bytes);
      return "";
    }
    // If it's a comma-separated string of numbers
    if (bytes.includes(',')) {
      byteArray = bytes.split(",").map(Number);
    } else {
      // Try to parse as single number or string
      return bytes;
    }
  } else if (Array.isArray(bytes)) {
    byteArray = bytes;
  } else if (bytes instanceof Uint8Array) {
    byteArray = Array.from(bytes);
  } else {
    const converted = bytes.toString();
    if (converted.includes('vector')) {
      console.warn('Received vector string from toString, skipping:', converted);
      return "";
    }
    return converted;
  }

  // Handle empty array
  if (byteArray.length === 0) {
    return "";
  }

  // Handle the case where the array might be nested (e.g., [[0, 1, 2, ...]])
  if (Array.isArray(byteArray[0])) {
    byteArray = byteArray[0];
  }

  // Check if this is a zero address (all zeros)
  const isZeroAddress = byteArray.every(byte => byte === 0);
  if (isZeroAddress) {
    console.warn('Received zero address, this might indicate an issue with the contract');
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }

  // FIX: Remove the first byte if it's 0x01 (this is likely a type prefix)
  // Sui addresses should be exactly 32 bytes (64 hex characters)
  if (byteArray.length === 33 && byteArray[0] === 1) {
    console.log('Removing type prefix byte (0x01) from address');
    byteArray = byteArray.slice(1);
  }

  // Ensure we have exactly 32 bytes for a Sui address
  if (byteArray.length !== 32) {
    console.warn(`Unexpected address length: ${byteArray.length} bytes. Expected 32 bytes.`);
    // If it's longer than 32 bytes, take the last 32 bytes
    if (byteArray.length > 32) {
      byteArray = byteArray.slice(-32);
    }
  }

  // Convert byte array to hex string
  const hexString = byteArray
    .map((byte) => {
      // Ensure byte is a valid number
      const num = typeof byte === 'number' ? byte : parseInt(String(byte));
      return num.toString(16).padStart(2, "0");
    })
    .join("");

  return `0x${hexString}`;
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

// Helper function to parse u64 return values
function parseU64Value(value: any): number {
  console.log('🔍 Parsing u64 value:', value, 'Type:', typeof value);
  
  // If it's already a number, return it
  if (typeof value === 'number') {
    console.log('🔍 Value is already a number:', value);
    return value;
  }
  
  // If it's a string that represents a number
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!isNaN(parsed)) {
      console.log('🔍 Parsed string to number:', parsed);
      return parsed;
    }
  }
  
  // If it's an array with [byteArray, 'u64'] format
  if (Array.isArray(value) && value.length === 2 && value[1] === 'u64') {
    const [byteArray, type] = value;
    console.log('🔍 Byte array format - bytes:', byteArray, 'type:', type);
    
    if (Array.isArray(byteArray) && byteArray.length === 8) {
      // Convert little-endian byte array to u64
      // Handle large numbers by using BigInt for precision
      let u64Value = 0n;
      for (let i = 0; i < 8; i++) {
        u64Value += BigInt(byteArray[i]) << BigInt(i * 8);
      }
      
      // Convert BigInt to number (this will lose precision for very large numbers, but should be fine for SUI amounts)
      const result = Number(u64Value);
      
      console.log('🔍 Parsed u64 from byte array:', result, '(BigInt:', u64Value.toString() + ')');
      return result;
    }
  }
  
  // If it's an array with [type, data] format for u64
  if (Array.isArray(value) && value.length === 2) {
    const [type, data] = value;
    console.log('🔍 Array format - type:', type, 'data:', data);
    
    // For u64, the type is usually 0 and data is the actual number
    if (type === 0 && typeof data === 'number') {
      console.log('🔍 Parsed u64 from array format:', data);
      return data;
    }
    
    // If data is a string representation of a number
    if (type === 0 && typeof data === 'string') {
      const parsed = Number(data);
      if (!isNaN(parsed)) {
        console.log('🔍 Parsed u64 string from array format:', parsed);
        return parsed;
      }
    }
  }
  
  // If it's a single-element array with the number
  if (Array.isArray(value) && value.length === 1) {
    const parsed = Number(value[0]);
    if (!isNaN(parsed)) {
      console.log('🔍 Parsed u64 from single-element array:', parsed);
      return parsed;
    }
  }
  
  console.warn('⚠️ Could not parse u64 value:', value);
  return 0;
}

// Get card information by ID
export async function getCardInfo(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
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
        owner: bytesToHexAddress(returnValues[1]),
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_USER_CARD_ID}`,
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.USER_HAS_CARD}`,
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return parseU64Value(result.results[0].returnValues[0]);
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_ADMIN}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return bytesToHexAddress(result.results[0].returnValues[0]);
    }
    return null;
  } catch (error) {
    console.error('Error getting admin:', error);
    return null;
  }
}

// Get super admin address
export async function getSuperAdmin(): Promise<string | null> {
  try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_SUPER_ADMIN}`,
            arguments: [
              tx.object(DEVHUB_OBJECT_ID),
            ],
          });
          return tx;
        })(),
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      console.log('Full result structure:', JSON.stringify(result, null, 2));

    if (result.results?.[0]?.returnValues?.[0]) {
      const addressData = result.results[0].returnValues[0];
      console.log('Super admin raw data:', addressData);
      console.log('Super admin data type:', typeof addressData);
      console.log('Super admin data is array:', Array.isArray(addressData));
      if (Array.isArray(addressData)) {
        console.log('Super admin array length:', addressData.length);
        console.log('Super admin first few elements:', addressData.slice(0, 10));
      }
      const convertedAddress = bytesToHexAddress(addressData);
      console.log('Super admin converted address:', convertedAddress);
      return convertedAddress;
    }
    return null;
  } catch (error) {
    console.error('Error getting super admin:', error);
    return null;
  }
}

// Get all admin addresses
export async function getAdmins(): Promise<string[]> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_ADMINS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('Full getAdmins result:', JSON.stringify(result, null, 2));

    if (result.results?.[0]?.returnValues?.[0]) {
      const rawData = result.results[0].returnValues[0];
      console.log('Raw admins data:', rawData);
      console.log('Raw admins data type:', typeof rawData);
      console.log('Raw admins data is array:', Array.isArray(rawData));
      
      // Enhanced debugging for Move vector format
      if (Array.isArray(rawData)) {
        console.log('Array length:', rawData.length);
        console.log('Array contents:', rawData);
        rawData.forEach((item, index) => {
          console.log(`Item ${index}:`, item);
          console.log(`Item ${index} type:`, typeof item);
          console.log(`Item ${index} is array:`, Array.isArray(item));
        });
      }
      
      // Handle the case where we get a single concatenated string
      if (typeof rawData === 'string' && (rawData as string).length > 64) {
        console.log('Received concatenated string, attempting to split...');
        
        // Use regex to find all valid Sui addresses in the string
        const addressRegex = /0x[a-fA-F0-9]{64}/g;
        const matches = (rawData as string).match(addressRegex);
        
        if (matches && matches.length > 0) {
          console.log('Found addresses with regex:', matches);
          return matches;
        }
        
        // If no matches with 0x prefix, try finding 64-character hex strings
        const hexRegex = /[a-fA-F0-9]{64}/g;
        const hexMatches = (rawData as string).match(hexRegex);
        
        if (hexMatches && hexMatches.length > 0) {
          console.log('Found hex strings without 0x prefix:', hexMatches);
          return hexMatches.map(addr => '0x' + addr);
        }
      }
      
      // Handle array of addresses - this is the most likely case for Move vector<address>
      if (Array.isArray(rawData)) {
        console.log('Processing array of addresses...');
        console.log('Array length:', rawData.length);
        
        // Check if this is a Move vector format: [byteArray, 'vector<address>']
        if (rawData.length === 2 && Array.isArray(rawData[0]) && rawData[1] === 'vector<address>') {
          console.log('Detected Move vector<address> format');
          const byteArray = rawData[0];
          console.log('Byte array length:', byteArray.length);
          console.log('Full byte array:', byteArray);
          console.log('First 10 bytes:', byteArray.slice(0, 10));
          console.log('Last 10 bytes:', byteArray.slice(-10));
          
          // Move vector<address> is serialized as a concatenated byte array
          // We need to find the actual address data by looking for patterns
          const addresses: string[] = [];
          
          // Try different approaches to find the addresses
          console.log('=== Attempting to extract addresses ===');
          
          // The first byte is a count indicator, not a type indicator to skip
          const addressCount = byteArray[0];
          console.log('Address count from first byte:', addressCount);
          
          // Start from index 1 (skip the count byte)
          let startIndex = 1;
          
          console.log('Starting extraction from index:', startIndex);
          const remainingBytes = byteArray.slice(startIndex);
          console.log('Remaining bytes length:', remainingBytes.length);
          console.log('Remaining bytes:', remainingBytes);
          
          // Try to find addresses by looking for 32-byte chunks
          const addressLength = 32;
          const expectedAddresses = Math.floor(remainingBytes.length / addressLength);
          console.log('Expected number of addresses from byte length:', expectedAddresses);
          console.log('Expected number of addresses from count indicator:', addressCount);
          
          // Use the count indicator to determine how many addresses to extract
          const addressesToExtract = Math.min(addressCount, expectedAddresses);
          console.log('Will extract', addressesToExtract, 'addresses');
          
          for (let i = 0; i < addressesToExtract; i++) {
            const startByte = i * addressLength;
            const endByte = startByte + addressLength;
            
            if (endByte <= remainingBytes.length) {
              const addressBytes = remainingBytes.slice(startByte, endByte);
              console.log(`\n--- Extracting address ${i + 1} ---`);
              console.log(`Byte range: ${startByte}-${endByte}`);
              console.log(`Address bytes:`, addressBytes);
              console.log(`Address bytes length:`, addressBytes.length);
              
              const address = bytesToHexAddress(addressBytes);
              console.log(`Converted address:`, address);
              console.log(`Address length:`, address.length);
              console.log(`Address starts with 0x:`, address.startsWith('0x'));
              
              if (address && address.startsWith('0x') && address.length === 66) {
                addresses.push(address);
                console.log(`✅ Valid address added:`, address);
              } else {
                console.log(`❌ Invalid address format:`, address);
              }
            } else {
              console.log(`❌ Not enough bytes for address ${i + 1}`);
            }
          }
          
          console.log('\n=== Final Results ===');
          console.log('Extracted addresses from vector:', addresses);
          console.log('Number of addresses found:', addresses.length);
          return addresses;
        }
        
        // Handle regular array format
        const convertedAddresses = rawData
          .map((addr: any, index: number) => {
            console.log(`Processing address ${index}:`, addr);
            console.log(`Address type:`, typeof addr);
            console.log(`Address is array:`, Array.isArray(addr));
            
            // Handle different address formats
            if (Array.isArray(addr) && addr.length === 2) {
              // This is likely a [type, data] format from Move
              const [type, data] = addr;
              console.log(`[type, data] format - type: ${type}, data:`, data);
              if (typeof type === 'number' && Array.isArray(data)) {
                const converted = bytesToHexAddress(data);
                console.log(`Converted [type, data] address ${index}:`, converted);
                return converted;
              }
            } else if (Array.isArray(addr)) {
              // Direct byte array
              console.log(`Direct byte array format:`, addr);
              const converted = bytesToHexAddress(addr);
              console.log(`Converted direct array address ${index}:`, converted);
              return converted;
            } else if (typeof addr === 'string' && addr.startsWith('0x')) {
              console.log(`Valid hex string address ${index}:`, addr);
              return addr;
            } else if (typeof addr === 'string') {
              // Try to parse as hex string without 0x prefix
              if (addr.length === 64 && /^[a-fA-F0-9]+$/.test(addr)) {
                const withPrefix = '0x' + addr;
                console.log(`Added 0x prefix to address ${index}:`, withPrefix);
                return withPrefix;
              }
            }
            
            // Try to convert to string
            const converted = addr.toString();
            if (converted.includes('vector')) {
              console.log(`Skipping vector string ${index}:`, converted);
              return null;
            }
            console.log(`Fallback conversion ${index}:`, converted);
            return converted;
          })
          .filter(addr => {
            const isValid = addr !== null && 
                           addr !== undefined && 
                           addr !== '' && 
                           !addr.includes('vector') &&
                           addr.startsWith('0x') &&
                           addr.length === 66; // 0x + 64 hex chars
            console.log(`Address validation for "${addr}": ${isValid}`);
            return isValid;
          });
        
        console.log('Final converted addresses:', convertedAddresses);
        console.log('Number of valid addresses found:', convertedAddresses.length);
        return convertedAddresses;
      }
    }
    
    console.log('No valid admin data found');
    return [];
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
}

// Get platform fee balance
export async function getPlatformFeeBalance(): Promise<number> {
  try {
    console.log('🔍 Fetching platform fee balance...');
    
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('🔍 Platform fee balance query result:', result);

    if (result.results?.[0]?.returnValues?.[0]) {
      const rawValue = result.results[0].returnValues[0];
      console.log('🔍 Raw platform fee balance value:', rawValue);
      
      const balance = parseU64Value(rawValue);
      console.log('🔍 Final platform fee balance:', balance);
      
      // Validate the balance is a reasonable number
      if (isNaN(balance) || balance < 0) {
        console.warn('⚠️ Invalid platform fee balance received:', balance);
        return 0;
      }
      
      return balance;
    }
    
    console.log('⚠️ No return values found in platform fee balance query');
    return 0;
  } catch (error) {
    console.error('❌ Error getting platform fee balance:', error);
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return parseU64Value(result.results[0].returnValues[0]);
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.IS_ADMIN}`,
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

// Check if address is super admin
export async function isSuperAdmin(address: string): Promise<boolean> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.IS_SUPER_ADMIN}`,
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
    console.error('Error checking if super admin:', error);
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.IS_CARD_ACTIVE}`,
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
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.IS_CARD_OPEN_TO_WORK}`,
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

// Get platform statistics
export async function getPlatformStats(): Promise<{
  totalDevelopers: number;
  activeDevelopers: number;
  verifiedDevelopers: number;
  openProjects: number;
}> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::get_platform_stats`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      const returnValues = result.results[0].returnValues;
      return {
        totalDevelopers: Number(parseReturnValue(returnValues[0])),
        activeDevelopers: Number(parseReturnValue(returnValues[1])),
        verifiedDevelopers: Number(parseReturnValue(returnValues[2])),
        openProjects: Number(parseReturnValue(returnValues[3])),
      };
    }
    return {
      totalDevelopers: 0,
      activeDevelopers: 0,
      verifiedDevelopers: 0,
      openProjects: 0,
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    return {
      totalDevelopers: 0,
      activeDevelopers: 0,
      verifiedDevelopers: 0,
      openProjects: 0,
    };
  }
}

// Get project count
export async function getProjectCount(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::get_project_count`,
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
    console.error('Error getting project count:', error);
    return 0;
  }
}

// Get recent activity by querying blockchain events
export async function getRecentActivity(): Promise<Array<{
  when: string;
  type: string;
  actor: string;
  details: string;
  txStatus: string;
  status: string;
}>> {
  try {
    // Query events from the contract
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::devhub::AdminRoleGranted`
      },
      limit: 10,
      order: 'descending'
    });

    const adminRevokedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::devhub::AdminRoleRevoked`
      },
      limit: 10,
      order: 'descending'
    });

    const feeWithdrawnEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::devhub::PlatformFeesWithdrawn`
      },
      limit: 10,
      order: 'descending'
    });

    const cardCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::devhub::CardCreated`
      },
      limit: 5,
      order: 'descending'
    });

    const allEvents = [
      ...events.data,
      ...adminRevokedEvents.data,
      ...feeWithdrawnEvents.data,
      ...cardCreatedEvents.data
    ].sort((a, b) => Number(b.timestampMs || 0) - Number(a.timestampMs || 0));

    return allEvents.slice(0, 20).map((event) => {
      const timestamp = new Date(Number(event.timestampMs || 0));
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      
      let when: string;
      if (diffMs < 60000) { // Less than 1 minute
        when = `${Math.floor(diffMs / 1000)}s ago`;
      } else if (diffMs < 3600000) { // Less than 1 hour
        when = `${Math.floor(diffMs / 60000)}m ago`;
      } else if (diffMs < 86400000) { // Less than 1 day
        when = `${Math.floor(diffMs / 3600000)}h ago`;
      } else {
        when = `${Math.floor(diffMs / 86400000)}d ago`;
      }

      let type: string;
      let actor: string;
      let details: string;
      let status: string;

      if (event.type.includes('AdminRoleGranted')) {
        type = 'Role Granted';
        actor = (event.parsedJson as any)?.admin || 'Unknown';
        details = `Granted Admin to ${actor}`;
        status = 'success';
      } else if (event.type.includes('AdminRoleRevoked')) {
        type = 'Role Revoked';
        actor = (event.parsedJson as any)?.admin || 'Unknown';
        details = `Revoked Admin from ${actor}`;
        status = 'success';
      } else if (event.type.includes('PlatformFeesWithdrawn')) {
        type = 'Withdrawal';
        actor = (event.parsedJson as any)?.admin || 'Unknown';
        const amount = (event.parsedJson as any)?.amount ? (Number((event.parsedJson as any).amount) / 1_000_000_000).toFixed(2) : '0';
        details = `Withdrew ${amount} SUI to ${(event.parsedJson as any)?.recipient || 'Unknown'}`;
        status = 'success';
      } else if (event.type.includes('CardCreated')) {
        type = 'Card Created';
        actor = (event.parsedJson as any)?.owner || 'Unknown';
        details = `New developer card created by ${actor}`;
        status = 'success';
      } else {
        type = 'Platform Activity';
        actor = 'System';
        details = 'Platform activity detected';
        status = 'info';
      }

      return {
        when,
        type,
        actor: actor.length > 20 ? `${actor.slice(0, 8)}...${actor.slice(-8)}` : actor,
        details,
        txStatus: 'Confirmed',
        status
      };
    });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return [];
  }
}

// Get platform activity statistics
export async function getActivityStats(): Promise<{
  totalEvents: number;
  adminEvents: number;
  feeEvents: number;
  cardEvents: number;
}> {
  try {
    const [adminEvents, feeEvents, cardEvents] = await Promise.all([
      suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::devhub::AdminRoleGranted`
        },
        limit: 100
      }),
      suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::devhub::PlatformFeesWithdrawn`
        },
        limit: 100
      }),
      suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::devhub::CardCreated`
        },
        limit: 100
      })
    ]);

    const totalEvents = adminEvents.data.length + feeEvents.data.length + cardEvents.data.length;

    return {
      totalEvents,
      adminEvents: adminEvents.data.length,
      feeEvents: feeEvents.data.length,
      cardEvents: cardEvents.data.length
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return {
      totalEvents: 0,
      adminEvents: 0,
      feeEvents: 0,
      cardEvents: 0
    };
  }
}
