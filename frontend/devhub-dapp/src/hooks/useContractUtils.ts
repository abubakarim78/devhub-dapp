
// Cache entry interface
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Constants
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const BATCH_SIZE = 10;
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;

// Helper function to convert byte array to hex address
export const bytesToHexAddress = (bytes: any): string => {
  if (!bytes) return "";

  // Handle different byte array formats
  let byteArray: number[];

  if (typeof bytes === "string") {
    // If it's already a hex string, return it
    if (bytes.startsWith("0x")) {
      return bytes;
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
    return bytes.toString();
  }

  // Handle empty array
  if (byteArray.length === 0) {
    return "";
  }

  // Handle the case where the array might be nested (e.g., [[0, 1, 2, ...]])
  if (Array.isArray(byteArray[0])) {
    byteArray = byteArray[0];
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
};

// Helper function to clean text strings of unwanted characters
// Standard text cleaning for most fields (name, niche, etc.)
const cleanTextString = (text: string): string => {
  if (!text) return "";

  let cleaned = text
    // Remove control characters except newlines and carriage returns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Clean up any double spaces
    .replace(/\s+/g, " ")
    .trim();

  // Additional cleaning for common corruption patterns
  // Remove leading ">" or "C" that might be artifacts
  if (cleaned.startsWith(">") && cleaned.length > 1) {
    cleaned = cleaned.substring(1).trim();
  }

  return cleaned;
};

// Enhanced helper function to safely decode text from byte arrays with better cleaning
export const safeDecodeText = (bytes: any): string => {
  if (!bytes) return "";

  try {
    let byteArray: number[];

    if (typeof bytes === "string") {
      if (bytes.startsWith("0x")) {
        // Convert hex string to byte array
        const hex = bytes.slice(2);
        byteArray = [];
        for (let i = 0; i < hex.length; i += 2) {
          byteArray.push(parseInt(hex.substr(i, 2), 16));
        }
      } else if (bytes.includes(',')) {
        byteArray = bytes.split(",").map(Number);
      } else {
        // Check if the string has a length prefix disguised as a character
        // This happens when the RPC decodes the [length, chars...] bytes as a string directly
        if (bytes.length > 1) {
          const firstChar = bytes.charCodeAt(0);
          // Check for 1-byte ULEB128 (values < 128)
          // The first char code should match the remaining length
          if (firstChar < 128 && firstChar === bytes.length - 1) {
            // This is likely a length prefix
            return cleanTextString(bytes.substring(1));
          }
        }
        return cleanTextString(bytes); // Already a string, just clean it
      }
    } else if (Array.isArray(bytes)) {
      byteArray = bytes;
    } else if (bytes instanceof Uint8Array) {
      byteArray = Array.from(bytes);
    } else {
      return cleanTextString(bytes.toString());
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
      // We also check if the length is reasonable (e.g. not 0 if we have bytes)
      if (validULEB && byteArray.length === idx + length) {
        byteArray = byteArray.slice(idx);
      }
    }

    // Filter out control characters and null bytes
    const cleanBytes = byteArray.filter((byte) => {
      // Keep printable ASCII characters (32-126) and common extended ASCII
      return (
        (byte >= 32 && byte <= 126) ||
        (byte >= 128 && byte <= 255) ||
        byte === 10 || // line feed
        byte === 13
      ); // carriage return
    });

    // If no valid bytes remain, return empty string
    if (cleanBytes.length === 0) {
      return "";
    }

    // Decode the cleaned bytes
    const decoded = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: false,
    }).decode(new Uint8Array(cleanBytes));

    return cleanTextString(decoded);
  } catch (error) {
    console.warn("Error decoding text:", error);
    return "";
  }
};

// Conservative cleaning specifically for the "about" field to remove single leading character artifacts
export const cleanAboutText = (text: string): string => {
  if (!text) return "";

  // Start with standard cleaning
  let cleaned = cleanTextString(text);

  // Remove leading artifacts more aggressively
  // This handles cases like ";Creating", "EBuilding", "3I", etc.
  
  if (cleaned.length > 1) {
    const firstChar = cleaned.charAt(0);
    const secondChar = cleaned.charAt(1);
    const thirdChar = cleaned.length > 2 ? cleaned.charAt(2) : '';
    
    // Check what type of characters we have
    const isSingleDigit = /^\d$/.test(firstChar);
    const isLowercaseLetter = /^[a-z]$/.test(firstChar);
    const isCapitalLetter = /^[A-Z]$/.test(firstChar);
    const isSymbol = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]$/.test(firstChar);
    const isSecondCharCapital = /^[A-Z]$/.test(secondChar);
    const isCommonWordStarter = ['I', 'A', 'T', 'W', 'H', 'Y', 'O', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'U', 'V', 'X', 'Z'].includes(secondChar);
    const isThirdCharWordStart = thirdChar === ' ' || (thirdChar === thirdChar.toLowerCase() && thirdChar !== '' && /^[a-z]$/.test(thirdChar));
    const hasTextAfter = cleaned.length > 2; // There's content after the first two chars
    
    // Priority 1: Remove digits followed by ANY capital letter (like "3I", "4I", "4Design", "5Building")
    if (isSingleDigit && isSecondCharCapital && hasTextAfter) {
      cleaned = cleaned.substring(1).trim();
    }
    // Priority 2: Remove symbols/punctuation followed by capital letter (like ";Creating", "!Building", ":Design")
    else if (isSymbol && isSecondCharCapital && hasTextAfter) {
      cleaned = cleaned.substring(1).trim();
    }
    // Priority 3: Remove single capital letter if followed by another capital letter that starts a word
    // This catches cases like "EBuilding", "IDesign", "ABuilding" where the first letter is an artifact
    else if (isCapitalLetter && isSecondCharCapital && hasTextAfter) {
      // Additional check: if the second char is a common word starter, it's likely an artifact
      // Also check if third char is lowercase (indicating a word start) or space
      if (isCommonWordStarter && (isThirdCharWordStart || thirdChar === '')) {
        cleaned = cleaned.substring(1).trim();
      }
    }
    // Priority 4: Remove lowercase letter + capital letter if it looks like an artifact
    // This catches cases like "cI", "dA", etc. where first char is clearly not part of the word
    else if (
      isLowercaseLetter && 
      isSecondCharCapital && 
      isCommonWordStarter && 
      isThirdCharWordStart &&
      hasTextAfter
    ) {
      cleaned = cleaned.substring(1).trim();
    }
  }

  // Remove any non-printable Unicode characters and invalid UTF-8 sequences
  // Keep only printable ASCII and common Unicode characters
  cleaned = cleaned
    .split('')
    .filter(char => {
      const code = char.charCodeAt(0);
      // Keep printable ASCII (32-126), common whitespace, and valid Unicode letters/numbers
      return (
        (code >= 32 && code <= 126) || // Printable ASCII
        code === 10 || // Line feed
        code === 13 || // Carriage return
        (code >= 160 && code <= 255) || // Latin-1 Supplement
        (code >= 0x00A0 && code <= 0x024F) || // Latin Extended
        (code >= 0x2000 && code <= 0x206F) || // General Punctuation
        (code >= 0x20A0 && code <= 0x20CF) || // Currency Symbols
        /\p{L}|\p{N}|\p{P}|\p{Z}/u.test(char) // Unicode letters, numbers, punctuation, separators
      );
    })
    .join('')
    .trim();

  return cleaned;
};

// Enhanced helper function for URLs with better validation and cleaning
export const safeDecodeUrl = (bytes: any): string => {
  const decoded = safeDecodeText(bytes);

  // Basic URL validation and cleaning
  if (!decoded) return "";

  let cleaned = decoded;

  // Remove common URL corruption patterns
  // Fix "Chttps://" or similar corrupted URLs
  if (cleaned.match(/^[A-Za-z]https?:\/\//)) {
    cleaned = cleaned.replace(/^[A-Za-z](https?:\/\/)/, "$1");
  }

  // Fix "httpshttps://" or similar duplications
  cleaned = cleaned.replace(/https?https?:\/\//, "https://");

  // Remove any remaining control characters that might affect URLs
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, "");

  // If it doesn't start with http:// or https://, and looks like a URL, add https://
  if (
    cleaned &&
    !cleaned.startsWith("http://") &&
    !cleaned.startsWith("https://")
  ) {
    // Check if it looks like a domain (contains a dot)
    if (cleaned.includes(".") || cleaned.includes("www.")) {
      cleaned = "https://" + cleaned;
    }
  }

  // Final validation - ensure the URL is properly formatted
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      new URL(cleaned); // This will throw if the URL is invalid
    }
  } catch (error) {
    console.warn("Invalid URL after cleaning:", cleaned);
    return "";
  }

  return cleaned;
};

// Parse Move bool from devInspect return value variants
export const parseMoveBool = (raw: any): boolean => {
  if (Array.isArray(raw)) {
    // Common case: [1] or [0]
    return raw[0] === 1;
  }
  if (raw instanceof Uint8Array) {
    return raw[0] === 1;
  }
  if (typeof raw === "number") {
    return raw === 1;
  }
  if (typeof raw === "string") {
    const v = raw.toLowerCase();
    return v === "1" || v === "true";
  }
  if (raw === true) return true;
  if (raw === false) return false;
  return Boolean(raw);
};

// Cache utilities
export const isCacheValid = <T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> => {
  return entry !== null && Date.now() - entry.timestamp < entry.ttl;
};

export const setCacheEntry = <T>(data: T, ttl: number = CACHE_TTL): CacheEntry<T> => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  return entry;
};

// Enhanced error handling with retry logic
export const createWithRetry = (maxRetries: number = MAX_RETRIES, retryDelay: number = RETRY_DELAY) => {
  return async <T>(operation: () => Promise<T>): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  };
};

