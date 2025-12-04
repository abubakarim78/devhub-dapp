import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { MIN_GAS_BALANCE } from './constants';

/**
 * Helper function to set gas payment coins on a transaction
 * This ensures transactions have valid gas coins available
 * @param tx The transaction to set gas coins on
 * @param client The Sui client instance
 * @param ownerAddress The address of the transaction sender
 * @param excludeCoinIds Optional array of coin IDs to exclude from gas payment (e.g., coins used for payment)
 * @param paymentCoinId Optional payment coin ID - if provided and no separate gas coin found, will split it to create gas coin
 */
export async function setGasPaymentForTransaction(
  tx: Transaction,
  client: SuiClient,
  ownerAddress: string,
  excludeCoinIds: string[] = [],
  paymentCoinId?: string
): Promise<void> {
  try {
    // Get all available SUI coins
    const coins = await client.getCoins({
      owner: ownerAddress,
      coinType: '0x2::sui::SUI',
      limit: 50,
    });

    if (!coins.data || coins.data.length === 0) {
      console.warn('No SUI coins found for gas payment - wallet will attempt to select automatically');
      return;
    }

    // Filter out excluded coins and find coins with sufficient balance for gas
    // IMPORTANT: Never use excluded coins (like payment coins) for gas to avoid duplicate object errors
    const availableCoins = coins.data.filter(coin => !excludeCoinIds.includes(coin.coinObjectId));
    const gasCoin = availableCoins.find(coin => BigInt(coin.balance) >= BigInt(MIN_GAS_BALANCE));

    // Only set gas payment if we found a coin that's NOT in the exclusion list
    if (gasCoin) {
      // Double-check that this coin is not in the exclusion list
      if (excludeCoinIds.includes(gasCoin.coinObjectId)) {
        console.warn('Gas coin is in exclusion list, skipping gas payment setup');
        return;
      }

      try {
        // Fetch the coin object to get the proper version and digest
        const coinObject = await client.getObject({
          id: gasCoin.coinObjectId,
          options: { showContent: false, showOwner: false, showType: false },
        });

        if (coinObject.data) {
          tx.setGasPayment([{
            objectId: coinObject.data.objectId,
            version: coinObject.data.version,
            digest: coinObject.data.digest,
          }]);
          console.log('Gas payment coin set:', gasCoin.coinObjectId, 'Excluded coins:', excludeCoinIds);
        }
      } catch (error) {
        console.warn('Failed to fetch coin object for gas payment:', error);
        // Don't throw - let wallet handle gas selection automatically
      }
    } else {
      // No separate gas coin found
      // Check if user only has one coin (the payment coin)
      const totalCoins = coins.data.length;
      const excludedCount = excludeCoinIds.length;
      
      if (totalCoins === excludedCount && paymentCoinId) {
        // User only has the payment coin - they need to split it or get more coins
        console.error(
          `Only one coin available (${paymentCoinId}) and it's being used for payment. ` +
          `Please split your coin or obtain additional coins for gas payment. ` +
          `Wallet cannot use the same coin for both payment and gas.`
        );
        // Don't set gas payment - this will cause an error, but it's better than a duplicate object error
      } else {
        console.warn(
          `No suitable gas coins found (excluded: ${excludeCoinIds.length} coins, available: ${availableCoins.length} coins, total: ${totalCoins} coins) - wallet will attempt to select automatically`
        );
      }
    }
  } catch (error) {
    console.warn('Failed to set gas payment coins:', error);
    // Don't throw - let the wallet handle gas selection automatically as fallback
  }
}

// Helper function to decode bytes to string
export function decodeBytesToString(bytes: number[]): string {
  try {
    if (!bytes || bytes.length === 0) {
      return '';
    }

    let byteArray = bytes;

    // Filter out invalid byte values (should be 0-255)
    byteArray = byteArray.filter(b => typeof b === 'number' && b >= 0 && b <= 255);

    if (byteArray.length === 0) {
      return '';
    }

    // Attempt to strip BCS vector length prefix
    // BCS vector<u8> starts with ULEB128 length
    if (byteArray.length > 0) {
      let length = 0;
      let shift = 0;
      let idx = 0;
      let validULEB = false;

      // Read ULEB128
      while (idx < byteArray.length && idx < 5) {
        const b = byteArray[idx++];
        length |= (b & 0x7F) << shift;
        if ((b & 0x80) === 0) {
          validULEB = true;
          break;
        }
        shift += 7;
      }

      // If valid ULEB and the remaining length matches the read length, it's likely a BCS vector
      if (validULEB && byteArray.length === idx + length) {
        byteArray = byteArray.slice(idx);
      }
      // Also check if first byte is a small number (0-9) that could be a length byte
      // and if removing it makes sense (the remaining bytes decode to valid text)
      else if (byteArray.length > 1 && byteArray[0] >= 0 && byteArray[0] <= 9) {
        // Try decoding without the first byte
        const withoutFirst = byteArray.slice(1);
        const decodedWithout = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(withoutFirst));
        // If the decoded text without first byte is valid and longer, use it
        if (decodedWithout.length > 0 && decodedWithout.trim().length > 0) {
          // Check if the first byte matches the original length
          if (byteArray[0] === withoutFirst.length || byteArray[0] === byteArray.length - 1) {
            byteArray = withoutFirst;
          }
        }
      }
    }

    // Decode using TextDecoder with error handling
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const decoded = decoder.decode(new Uint8Array(byteArray));
    
    // Filter out any control characters except newlines, tabs, and carriage returns
    // This removes any invalid or unwanted characters that might have been introduced
    return decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } catch (error) {
    console.warn('Error decoding bytes to string:', error);
    return '';
  }
}

// Helper function to convert byte array to hex address
export function bytesToHexAddress(bytes: any): string {
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

  // Convert byte array to hex string
  const hexString = byteArray
    .map((byte) => {
      // Ensure byte is a valid number
      const num = typeof byte === 'number' ? byte : parseInt(String(byte));
      return num.toString(16).padStart(2, "0");
    })
    .join("");

  // Always pad/trim to exactly 64 hex characters (32 bytes) to match Sui address format
  // If shorter, pad with zeros; if longer, take the last 64 characters
  let normalizedHex = hexString;
  if (normalizedHex.length < 64) {
    normalizedHex = normalizedHex.padStart(64, '0');
  } else if (normalizedHex.length > 64) {
    normalizedHex = normalizedHex.slice(-64);
  }

  return `0x${normalizedHex}`;
}

// Helper function to safely parse return values
export function parseReturnValue(value: any): any {
  // If it's already a string, return it as-is
  if (typeof value === 'string') {
    return value;
  }

  // If it's a direct byte array (Uint8Array or number array), decode it
  if (value instanceof Uint8Array) {
    return decodeBytesToString(Array.from(value));
  }
  
  if (Array.isArray(value) && value.length > 0) {
    // Check if it's a direct byte array (all elements are numbers between 0-255)
    const isByteArray = value.every((item: any) => typeof item === 'number' && item >= 0 && item <= 255);
    if (isByteArray && value.length > 0) {
      return decodeBytesToString(value);
    }

    // Check if it's a [type, data] format
    if (value.length === 2) {
      const [type, data] = value;
      
      // Handle [number, byteArray] format
      if (typeof type === 'number' && Array.isArray(data)) {
        const isDataByteArray = data.every((item: any) => typeof item === 'number' && item >= 0 && item <= 255);
        if (isDataByteArray) {
          return decodeBytesToString(data);
        }
      }
      
      // Handle [string type, byteArray] format (e.g., ["vector<u8>", data])
      if (typeof type === 'string' && (type.includes('vector<u8>') || type.includes('u8'))) {
        if (Array.isArray(data)) {
          const isDataByteArray = data.every((item: any) => typeof item === 'number' && item >= 0 && item <= 255);
          if (isDataByteArray) {
            return decodeBytesToString(data);
          }
        }
        if (data instanceof Uint8Array) {
          return decodeBytesToString(Array.from(data));
        }
      }
    }
  }
  
  return value;
}

// Helper function to parse u64 return values
export function parseU64Value(value: any): number {
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

  // Check if it's directly an 8-byte array (little-endian u64)
  if (Array.isArray(value) && value.length === 8 && typeof value[0] === 'number') {
    console.log('🔍 Detected 8-byte array (little-endian u64):', value);
    // Convert little-endian byte array to u64
    let u64Value = 0n;
    for (let i = 0; i < 8; i++) {
      u64Value += BigInt(value[i] || 0) << BigInt(i * 8);
    }
    const result = Number(u64Value);
    console.log('🔍 Parsed u64 from 8-byte array:', result, '(BigInt:', u64Value.toString() + ')');
    return result;
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
        u64Value += BigInt(byteArray[i] || 0) << BigInt(i * 8);
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

// Helper function to safely decode text from various formats
export function safeDecodeText(value: any): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    try {
      return new TextDecoder().decode(new Uint8Array(value));
    } catch {
      return '';
    }
  }
  return String(value || '').trim();
}

