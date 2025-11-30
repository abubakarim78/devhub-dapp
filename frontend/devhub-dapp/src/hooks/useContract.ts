import { useState, useCallback, useRef, useMemo } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  DEVHUB_OBJECT_ID,
  PACKAGE_ID,
  CONTRACT_FUNCTIONS,
  DevCardData,
  FeaturedProject,
  Project,
  ProjectApplication,
  Proposal,
  Conversation,
  Connection,
  Message,
  SocialLinks,
  getAdmins as getAdminsFromContract,
  getSuperAdmin,
  getProposalDetails,
  getUserProposals,
  getProposalsByStatus,
  getPlatformStatistics,
  isConnected,
  searchCardsBySkill,
  searchCardsByLocation,
  searchCardsByWorkType,
  searchCardsByNiche,
  searchProjectsBySkill,
  getAvailableDevelopers,
  getOpenProjects,
  getUIUXDesigners,
  getContentCreators,
  getDevOpsProfessionals,
  getProjectManagers,
  getCommunityManagers,
  getDevelopmentDirectors,
  getProductManagers,
  getMarketingSpecialists,
  getBusinessAnalysts,
  getCustomNiches,
  getAllNichesInUse,
  getAvailableNiches,
  isCustomNiche,
  // New messaging SDK functions
  createMessagingChannel,
  getUserMemberships,
  getChannelObjects,
  sendMessage,
  getChannelMessages,
  // New channel management functions
  createChannelTransaction,
  sendMessageToChannelTransaction,
  addMemberToChannelTransaction,
  removeMemberFromChannelTransaction,
  getChannelMessagesTransaction,
  getChannelMembersTransaction,
  getUserChannelMemberships,
  getChannelDetails,
  getChannelMessagesFromObject,
  getCardSkills,
  getCardReviews,
  getWorkPreferences,
  getSocialLinks,
  getLanguages,
  getDetailedAnalytics,
} from "../lib/suiClient";
import { WalrusService, type WalrusBlob } from "../services/walrus";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}


interface UseContractState {
  loading: boolean;
  error: string | null;
  cardCount: number | null;
  projectCount: number | null;
  lastFetch: number | null;
  // Add Walrus-related state
  walrusUploading: boolean;
  walrusProgress: string;
  // Add channel-related state
  channels: any[];
  channelLoading: boolean;
  channelError: string | null;
}

// Add Walrus-related interfaces
interface WalrusUploadResult {
  blob: WalrusBlob;
  originalUrl?: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Helper function to convert byte array to hex address
const bytesToHexAddress = (bytes: any): string => {
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

// Enhanced helper function to safely decode text from byte arrays with better cleaning
const safeDecodeText = (bytes: any): string => {
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

// Parse Move bool from devInspect return value variants
const parseMoveBool = (raw: any): boolean => {
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

// Conservative cleaning specifically for the "about" field to remove single leading character artifacts
const cleanAboutText = (text: string): string => {
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
const safeDecodeUrl = (bytes: any): string => {
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

export function useContract() {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();

  const [state, setState] = useState<UseContractState>({
    loading: false,
    error: null,
    cardCount: null,
    projectCount: null,
    lastFetch: null,
    // Initialize Walrus state
    walrusUploading: false,
    walrusProgress: "",
    // Initialize channel state
    channels: [],
    channelLoading: false,
    channelError: null,
  });

  // Enhanced caching with TTL
  const cacheRef = useRef({
    cards: new Map<number, CacheEntry<DevCardData>>(),
    userCards: new Map<string, CacheEntry<DevCardData[]>>(),
    projects: new Map<number, CacheEntry<Project>>(),
    projectApplications: new Map<number, CacheEntry<ProjectApplication[]>>(),
    proposals: new Map<string, CacheEntry<Proposal>>(),
    conversations: new Map<string, CacheEntry<Conversation[]>>(),
    connections: new Map<string, CacheEntry<Connection[]>>(),
    messages: new Map<string, CacheEntry<Message[]>>(),
    cardCount: null as CacheEntry<number> | null,
    projectCount: null as CacheEntry<number> | null,
    platformFeeBalance: null as CacheEntry<number> | null,
    adminStatus: new Map<string, CacheEntry<boolean>>(),
    searchResults: new Map<string, CacheEntry<number[]>>(),
  });

  // Cache utilities
  const isCacheValid = useCallback(
    <T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> => {
      return entry !== null && Date.now() - entry.timestamp < entry.ttl;
    },
    [],
  );

  const setCacheEntry = useCallback(
    <T>(data: T, ttl: number = CACHE_TTL): CacheEntry<T> => {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      return entry;
    },
    [],
  );

  // Enhanced error handling with retry logic
  const withRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      maxRetries: number = MAX_RETRIES,
    ): Promise<T> => {
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
          const delay = RETRY_DELAY * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
    },
    [],
  );

  // NEW: Walrus upload functions
  const uploadToWalrus = useCallback(
    async (
      file: File,
      progressCallback?: (message: string) => void,
    ): Promise<WalrusUploadResult> => {
      // Client-side size guard to avoid 413 from publisher
      const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
      if (file.size > MAX_BYTES) {
        throw new Error(
          `File too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). ` +
          `Maximum allowed is 5 MB. Please compress the video or upload a smaller file.`
        );
      }

      setState((prev) => ({
        ...prev,
        walrusUploading: true,
        walrusProgress: "Uploading to Walrus...",
      }));

      const updateProgress = (message: string) => {
        setState((prev) => ({ ...prev, walrusProgress: message }));
        progressCallback?.(message);
      };

      try {
        updateProgress("Uploading file to Walrus...");

        // Pass the user's address to ensure blob ownership
        const blob = await WalrusService.uploadFile(
          file,
          currentAccount?.address,
        );

        updateProgress("Upload successful! Waiting for blob certification...");

        const isCertified = await WalrusService.waitForBlobCertification(
          blob.blobId,
          updateProgress,
        );

        if (isCertified) {
          updateProgress("File uploaded and certified successfully!");
        } else {
          updateProgress(
            "File uploaded! Certification may take a few more moments.",
          );
        }

        // Clear progress after delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, walrusProgress: "" }));
        }, 3000);

        return { blob };
      } catch (error) {
        console.error("Walrus upload failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          walrusProgress: "",
          error: `Failed to upload to Walrus: ${errorMessage}`,
        }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, walrusUploading: false }));
      }
    },
    [currentAccount?.address],
  );

  const uploadUrlToWalrus = useCallback(
    async (
      url: string,
      progressCallback?: (message: string) => void,
    ): Promise<WalrusUploadResult> => {
      if (!url.trim()) {
        throw new Error("Please provide a valid URL");
      }

      // Check if it's already a Walrus URL
      if (WalrusService.isWalrusUrl(url)) {
        throw new Error("This is already a Walrus URL");
      }

      setState((prev) => ({
        ...prev,
        walrusUploading: true,
        walrusProgress: "Fetching URL and uploading to Walrus...",
      }));

      const updateProgress = (message: string) => {
        setState((prev) => ({ ...prev, walrusProgress: message }));
        progressCallback?.(message);
      };

      try {
        updateProgress("Fetching from URL and uploading to Walrus...");

        // Pass the user's address to ensure blob ownership
        const blob = await WalrusService.uploadFromUrl(
          url,
          currentAccount?.address,
        );

        updateProgress("Upload successful! Waiting for blob certification...");

        const isCertified = await WalrusService.waitForBlobCertification(
          blob.blobId,
          updateProgress,
        );

        if (isCertified) {
          updateProgress("URL content uploaded and certified successfully!");
        } else {
          updateProgress(
            "URL content uploaded! Certification may take a few more moments.",
          );
        }

        // Clear progress after delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, walrusProgress: "" }));
        }, 3000);

        return { blob, originalUrl: url };
      } catch (error) {
        console.error("Walrus URL upload failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          walrusProgress: "",
          error: `Failed to upload URL to Walrus: ${errorMessage}`,
        }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, walrusUploading: false }));
      }
    },
    [currentAccount?.address],
  );

  // NEW: Check if URL is a Walrus URL
  const isWalrusUrl = useCallback((url: string): boolean => {
    return WalrusService.isWalrusUrl(url);
  }, []);

  // NEW: Get Walrus blob info
  const getWalrusBlob = useCallback(
    async (blobId: string): Promise<WalrusBlob | null> => {
      try {
        // This would need to be implemented in your WalrusService
        // For now, we'll create a basic blob object
        return {
          blobId,
          walrusUrl: `https://aggregator-devnet.walrus.space/v1/${blobId}`,
        };
      } catch (error) {
        console.error("Error getting Walrus blob:", error);
        return null;
      }
    },
    [],
  );

  // Enhanced debugging for getCardCount
  const getCardCount = useCallback(
    async (forceRefresh: boolean = false): Promise<number> => {
      const cached = cacheRef.current.cardCount;

      if (!forceRefresh && isCacheValid(cached)) {
        console.log(`📋 Using cached card count: ${cached.data}`);
        return cached.data;
      }

      try {
        console.log(`🔢 Fetching card count...`);

        const count = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID)],
          });

          console.log(
            `📤 Card count transaction target: ${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          );

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender:
              currentAccount?.address ||
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          });

          console.log(`📥 Card count raw result:`, result);

          if (result.results?.[0]?.returnValues?.[0]) {
            const [bytes] = result.results[0].returnValues[0];
            const count = parseInt(bytes.toString());
            console.log(`📊 Parsed card count: ${count}`);
            return count;
          }

          console.log(`⚠️ No card count data found, returning 0`);
          return 0;
        });

        cacheRef.current.cardCount = setCacheEntry(count);
        setState((prev) => ({ ...prev, cardCount: count }));
        console.log(`✅ Final card count: ${count}`);
        return count;
      } catch (err) {
        console.error("❌ Error getting card count:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get card count";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return 0;
      }
    },
    [client, currentAccount, isCacheValid, setCacheEntry, withRetry],
  );

  // Enhanced debugging for getCardInfo function with IMPROVED address parsing and text decoding
  const getCardInfo = useCallback(
    async (
      cardId: number,
      forceRefresh: boolean = false,
    ): Promise<DevCardData | null> => {
      const cached = cacheRef.current.cards.get(cardId) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log(`🔍 Fetching card info for ID: ${cardId}`);

        const cardData = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.u64(cardId)],
          });

          console.log(
            `📤 Transaction target: ${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
          );
          console.log(`📤 DevHub Object ID: ${DEVHUB_OBJECT_ID}`);
          console.log(`📤 Sender address: ${currentAccount?.address || "0x0"}`);

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender:
              currentAccount?.address ||
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          });

          console.log(`📥 Raw result for card ${cardId}:`, result);

          if (result.results?.[0]?.returnValues) {
            const values = result.results[0].returnValues;
            console.log(`📊 Return values for card ${cardId}:`, values);

            // Use the enhanced decoding functions with improved cleaning
            // Match the Move contract return order:
            // (name, owner, niche, image_url, about, years_of_experience, technologies, portfolio, contact, open_to_work, featured_projects, total_views, avatar_walrus_blob_id, created_at, last_updated)
            const name = safeDecodeText(values[0]?.[0]);
            const owner = bytesToHexAddress(values[1]?.[0]);
            const niche = safeDecodeText(values[2]?.[0]);
            let imageUrl = safeDecodeUrl(values[3]?.[0]);
            // Use aggressive cleaning only for the "about" field
            const descriptionRaw = safeDecodeText(values[4]?.[0]); // about field
            const description = cleanAboutText(descriptionRaw);
            const yearsOfExperience = values[5]?.[0]
              ? parseInt(values[5][0].toString())
              : 0;
            const technologies = safeDecodeText(values[6]?.[0]);
            const portfolio = safeDecodeUrl(values[7]?.[0]);
            const contact = safeDecodeText(values[8]?.[0]);
            const openToWork = parseMoveBool(values[9]?.[0]);
            // featured_projects is a vector<String> - the structure might be different
            // Try to get the full return value first, then extract the vector
            const featuredProjectsRaw = values[10]; // Get the full return value for vector<String>
            const totalViews = values[11]?.[0] ? parseInt(values[11][0].toString()) : 0;
            const isActive = true; // Default to active since the contract doesn't return this field

            // Walrus support: if on-chain imageUrl is empty, try constructing from walrus blob id
            const walrusBlobIdRaw = values[12]?.[0]; // avatar_walrus_blob_id is at index 12
            const walrusBlobId = safeDecodeText(walrusBlobIdRaw);

            // Parse created_at and last_updated timestamps (u64 values)
            // Helper function to parse u64 values (similar to parseU64Value in suiClient.ts)
            const parseU64Timestamp = (value: any): number => {
              if (!value) return Date.now();
              if (typeof value === 'number') return value;
              if (typeof value === 'string') {
                const parsed = Number(value);
                if (!isNaN(parsed)) return parsed;
              }
              // Handle byte array format (8 bytes, little-endian)
              if (Array.isArray(value) && value.length === 8 && typeof value[0] === 'number') {
                let u64Value = 0n;
                for (let i = 0; i < 8; i++) {
                  u64Value += BigInt(value[i] || 0) << BigInt(i * 8);
                }
                return Number(u64Value);
              }
              // Handle [byteArray, type] format
              if (Array.isArray(value) && value.length === 2 && Array.isArray(value[0]) && value[0].length === 8) {
                let u64Value = 0n;
                for (let i = 0; i < 8; i++) {
                  u64Value += BigInt(value[0][i] || 0) << BigInt(i * 8);
                }
                return Number(u64Value);
              }
              // Handle [type, data] format where type is 0 and data is the number
              if (Array.isArray(value) && value.length === 2 && value[0] === 0) {
                if (typeof value[1] === 'number') return value[1];
                if (typeof value[1] === 'string') {
                  const parsed = Number(value[1]);
                  if (!isNaN(parsed)) return parsed;
                }
              }
              return Date.now(); // Fallback to current time
            };

            const createdAt = values[13]?.[0] ? parseU64Timestamp(values[13][0]) : Date.now();
            const lastUpdated = values[14]?.[0] ? parseU64Timestamp(values[14][0]) : Date.now();
            if ((!imageUrl || imageUrl.trim() === "") && walrusBlobId) {
              imageUrl = WalrusService.getBlobUrl(walrusBlobId);
            }

            // Parse featured projects - handle vector<String> from Move contract
            // Similar to languages, this might be BCS-encoded
            // Each string is a JSON object that needs to be parsed
            let featuredProjects: FeaturedProject[] = [];

            console.log(`🔍 Raw featured projects structure for card ${cardId}:`, {
              raw: featuredProjectsRaw,
              type: typeof featuredProjectsRaw,
              isArray: Array.isArray(featuredProjectsRaw),
              length: Array.isArray(featuredProjectsRaw) ? featuredProjectsRaw.length : 'N/A',
              firstElement: Array.isArray(featuredProjectsRaw) && featuredProjectsRaw.length > 0 ? featuredProjectsRaw[0] : 'N/A',
            });

            // Check if it's [bcsBytes, type] format
            let actualData: any = featuredProjectsRaw;
            if (Array.isArray(featuredProjectsRaw) && featuredProjectsRaw.length === 2) {
              const [bcsBytes, type] = featuredProjectsRaw;
              console.log(`🔍 Found [bcsBytes, type] format - type: ${type}`);
              actualData = bcsBytes;
            }

            // Check if actualData is a byte array (array of numbers) - this is BCS-encoded
            const isByteArray = Array.isArray(actualData) &&
              actualData.length > 0 &&
              typeof actualData[0] === 'number' &&
              actualData.length > 10;

            if (isByteArray) {
              console.log(`🔍 Detected BCS-encoded byte array format for featured projects`);
              const byteArray = actualData as number[];
              console.log(`🔍 Byte array length: ${byteArray.length}`, byteArray.slice(0, 50));

              // Parse BCS-encoded vector<String>
              // Format: [vector_length (uleb128), string1_length, string1_bytes..., string2_length, string2_bytes..., ...]
              let index = 0;

              // Read vector length (uleb128)
              let vectorLength = 0;
              let shift = 0;
              while (index < byteArray.length) {
                const byte = byteArray[index++];
                vectorLength |= (byte & 0x7F) << shift;
                if ((byte & 0x80) === 0) break;
                shift += 7;
              }
              console.log(`🔍 Featured projects vector length: ${vectorLength}`);

              // Parse each string
              for (let i = 0; i < vectorLength && index < byteArray.length; i++) {
                // Read string length (uleb128)
                let strLength = 0;
                shift = 0;
                while (index < byteArray.length) {
                  const byte = byteArray[index++];
                  strLength |= (byte & 0x7F) << shift;
                  if ((byte & 0x80) === 0) break;
                  shift += 7;
                }

                // Read string bytes
                if (index + strLength > byteArray.length) {
                  console.warn(`⚠️ Featured project ${i}: Not enough bytes (need ${strLength}, have ${byteArray.length - index})`);
                  break;
                }
                const textBytes = byteArray.slice(index, index + strLength);
                const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
                const trimmed = decoded.trim();
                if (trimmed.length > 0 && !trimmed.includes('vector') && !trimmed.includes('String')) {
                  // Parse JSON string into FeaturedProject object
                  try {
                    const parsed = JSON.parse(trimmed) as FeaturedProject;
                    featuredProjects.push(parsed);
                    console.log(`✅ Decoded featured project ${i}:`, parsed);
                  } catch (parseError) {
                    console.warn(`⚠️ Failed to parse featured project JSON: "${trimmed}"`, parseError);
                  }
                } else {
                  console.warn(`⚠️ Filtered out invalid featured project: "${trimmed}"`);
                }
                index += strLength;
              }
            } else {
              // Try different ways to extract the vector data (fallback for non-BCS format)
              let vectorData: any = null;

              // Method 1: Check if it's in [type, data] format
              if (Array.isArray(actualData) && actualData.length === 2) {
                vectorData = actualData[1];
              }
              // Method 2: Check if it's directly the array
              else if (Array.isArray(actualData)) {
                vectorData = actualData;
              }
              // Method 3: Check if it's nested as [data]
              else if (actualData && typeof actualData === 'object') {
                if (Array.isArray(actualData[0])) {
                  vectorData = actualData[0];
                } else {
                  vectorData = actualData;
                }
              }

              // Now parse the vector data
              if (vectorData && Array.isArray(vectorData)) {
                // Check if it's a nested structure (BCS encoding - each element is a byte array)
                if (vectorData.length > 0 && Array.isArray(vectorData[0])) {
                  // Nested array structure - each element is an array of bytes representing a string
                  featuredProjects = vectorData
                    .map((p: any) => {
                      let decoded: string;
                      if (Array.isArray(p)) {
                        decoded = safeDecodeText(p);
                      } else if (typeof p === 'string') {
                        decoded = p.trim();
                      } else {
                        decoded = safeDecodeText(p);
                      }
                      return decoded;
                    })
                    .filter((p: string) => p && p.trim().length > 0 && !p.includes('vector') && !p.includes('String'))
                    .map((jsonStr: string) => {
                      try {
                        return JSON.parse(jsonStr) as FeaturedProject;
                      } catch (parseError) {
                        console.warn(`⚠️ Failed to parse featured project JSON: "${jsonStr}"`, parseError);
                        return null;
                      }
                    })
                    .filter((p: FeaturedProject | null): p is FeaturedProject => p !== null);
                } else {
                  // Flat array - each element might be a string or byte array
                  featuredProjects = vectorData
                    .map((p: any) => {
                      let decoded: string;
                      if (typeof p === 'string') {
                        decoded = p.trim();
                      } else if (Array.isArray(p)) {
                        decoded = safeDecodeText(p);
                      } else {
                        decoded = safeDecodeText(p);
                      }
                      return decoded;
                    })
                    .filter((p: string) => p && p.trim().length > 0 && !p.includes('vector') && !p.includes('String'))
                    .map((jsonStr: string) => {
                      try {
                        return JSON.parse(jsonStr) as FeaturedProject;
                      } catch (parseError) {
                        console.warn(`⚠️ Failed to parse featured project JSON: "${jsonStr}"`, parseError);
                        return null;
                      }
                    })
                    .filter((p: FeaturedProject | null): p is FeaturedProject => p !== null);
                }
              } else if (typeof vectorData === 'string') {
                // Single string (shouldn't happen for vector, but handle it)
                if (!vectorData.includes('vector') && !vectorData.includes('String')) {
                  try {
                    const parsed = JSON.parse(vectorData.trim()) as FeaturedProject;
                    featuredProjects = [parsed];
                  } catch (parseError) {
                    console.warn(`⚠️ Failed to parse featured project JSON: "${vectorData}"`, parseError);
                    featuredProjects = [];
                  }
                }
              } else if (vectorData === null || vectorData === undefined) {
                featuredProjects = [];
              } else {
                console.warn(`⚠️ Featured projects has unexpected format:`, vectorData);
                featuredProjects = [];
              }
            }

            console.log(`✅ Parsed featured projects for card ${cardId}:`, featuredProjects);

            console.log(`📝 Raw decoded data for card ${cardId}:`, {
              name,
              owner,
              niche,
              imageUrl,
              description,
              yearsOfExperience,
              technologies,
              portfolio,
              contact,
              openToWork,
              featuredProjects,
              totalViews,
            });

            // Fetch additional card data in parallel
            const [skills, reviews, workPrefs, socialLinks, languages, analytics] = await Promise.all([
              getCardSkills(cardId).catch(err => {
                console.warn(`Failed to fetch skills for card ${cardId}:`, err);
                return [];
              }),
              getCardReviews(cardId).catch(err => {
                console.warn(`Failed to fetch reviews for card ${cardId}:`, err);
                return [];
              }),
              getWorkPreferences(cardId).catch(err => {
                console.warn(`Failed to fetch work preferences for card ${cardId}:`, err);
                return null;
              }),
              getSocialLinks(cardId).catch(err => {
                console.warn(`Failed to fetch social links for card ${cardId}:`, err);
                return null;
              }),
              getLanguages(cardId).catch(err => {
                console.warn(`Failed to fetch languages for card ${cardId}:`, err);
                return [];
              }),
              getDetailedAnalytics(cardId).catch(err => {
                console.warn(`Failed to fetch analytics for card ${cardId}:`, err);
                return null;
              }),
            ]);

            // Parse skills - handle Move struct format
            let parsedSkills: Array<{ skill: string; proficiency: number; yearsExperience: number }> = [];
            if (Array.isArray(skills)) {
              parsedSkills = skills.map((skill: any) => {
                if (typeof skill === 'object' && skill !== null) {
                  // Handle Move struct format: could be {skill: ..., proficiency: ..., years_experience: ...}
                  const skillName = skill.skill || skill.name || '';
                  const skillText = typeof skillName === 'string' ? skillName : safeDecodeText(skillName);
                  return {
                    skill: skillText,
                    proficiency: Number(skill.proficiency || skill.level || 0),
                    yearsExperience: Number(skill.years_experience || skill.yearsExperience || skill.years || 0),
                  };
                }
                return { skill: '', proficiency: 0, yearsExperience: 0 };
              }).filter(s => s.skill);
            }

            // Parse reviews - getCardReviews already returns properly parsed Review objects
            // Just ensure they're in the correct format
            let parsedReviews: Array<{ reviewer: string; rating: number; review_text?: string; timestamp: number }> = [];
            if (Array.isArray(reviews) && reviews.length > 0) {
              parsedReviews = reviews.map((review: any) => {
                // If review is already in the correct format from getCardReviews, use it directly
                if (review && typeof review === 'object' && review.reviewer && review.rating) {
                  return {
                    reviewer: typeof review.reviewer === 'string' ? review.reviewer : bytesToHexAddress(review.reviewer),
                    rating: Number(review.rating),
                    review_text: review.review_text,
                    timestamp: Number(review.timestamp || 0),
                  };
                }

                // Fallback: try to parse if it's in a different format
                if (typeof review === 'object' && review !== null) {
                  const reviewerAddr = review.reviewer
                    ? (typeof review.reviewer === 'string' ? review.reviewer : bytesToHexAddress(review.reviewer))
                    : '';

                  // Parse review_text - handle Option<String>
                  let reviewText: string | undefined = undefined;
                  if (review.review_text) {
                    if (typeof review.review_text === 'object' && review.review_text !== null) {
                      if (review.review_text.Some !== undefined) {
                        reviewText = typeof review.review_text.Some === 'string'
                          ? review.review_text.Some
                          : safeDecodeText(review.review_text.Some);
                      }
                    } else if (typeof review.review_text === 'string') {
                      reviewText = review.review_text;
                    }
                  }

                  return {
                    reviewer: reviewerAddr || '',
                    rating: Number(review.rating || 0),
                    review_text: reviewText,
                    timestamp: Number(review.timestamp || review.time || Date.now()),
                  };
                }
                return { reviewer: '', rating: 0, timestamp: Date.now() };
              }).filter(r => r.reviewer && r.rating > 0 && r.rating <= 5);
            }

            console.log(`✅ Final parsed reviews for card ${cardId}:`, parsedReviews);

            // Parse work preferences - handle Option<u64> for hourly_rate
            const parseOptionU64 = (value: any): number | undefined => {
              if (!value) return undefined;
              // Handle Option format: could be {Some: value} or {None: null}
              if (typeof value === 'object' && value !== null) {
                if (value.Some !== undefined) {
                  return Number(value.Some);
                }
                if (value.None !== undefined) return undefined;
              }
              if (typeof value === 'number') return value;
              const parsed = Number(value);
              return isNaN(parsed) ? undefined : parsed;
            };

            const parsedWorkPrefs = workPrefs && typeof workPrefs === 'object' ? {
              workTypes: Array.isArray((workPrefs as any).work_types)
                ? (workPrefs as any).work_types.map((wt: any) => typeof wt === 'string' ? wt : safeDecodeText(wt))
                : Array.isArray(workPrefs.workTypes) ? workPrefs.workTypes : [],
              locationPreference: (workPrefs as any).location_preference
                ? (typeof (workPrefs as any).location_preference === 'string' ? (workPrefs as any).location_preference : safeDecodeText((workPrefs as any).location_preference))
                : workPrefs.locationPreference || '',
              availability: workPrefs.availability
                ? (typeof workPrefs.availability === 'string' ? workPrefs.availability : safeDecodeText(workPrefs.availability))
                : '',
              hourlyRate: parseOptionU64((workPrefs as any).hourly_rate || workPrefs.hourlyRate),
            } : {
              workTypes: [],
              locationPreference: "",
              availability: "",
            };

            // Parse social links - handle Option<String> format from Move
            // The getSocialLinks function should already return properly parsed SocialLinks
            // But we'll add additional parsing here as a fallback if needed
            const parseOptionString = (value: any): string => {
              if (!value) return '';

              // Handle Option format: could be {Some: value} or {None: null} or [0, value] or [1] for None
              if (typeof value === 'object' && value !== null) {
                // Check for {Some: ...} or {None: ...} format
                if (value.Some !== undefined) {
                  const val = value.Some;
                  if (typeof val === 'string') return val.trim();
                  if (Array.isArray(val)) {
                    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(val)).trim();
                  }
                  return safeDecodeText(val);
                }
                if (value.None !== undefined) return '';

                // Check for array format [0, value] (Some) or [1] (None)
                if (Array.isArray(value) && value.length > 0) {
                  if (value[0] === 0 && value.length > 1) {
                    // Some(value) - value is at index 1
                    const val = value[1];
                    if (typeof val === 'string') return val.trim();
                    if (Array.isArray(val)) {
                      return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(val)).trim();
                    }
                    return safeDecodeText(val);
                  }
                  if (value[0] === 1) {
                    // None
                    return '';
                  }
                }

                // If it's already a string field, use it directly
                if (typeof value === 'string') return value.trim();
              }

              if (typeof value === 'string') return value.trim();
              if (Array.isArray(value)) {
                return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(value)).trim();
              }
              return safeDecodeText(value);
            };

            console.log(`🔍 Raw social links data for card ${cardId}:`, socialLinks);

            // getSocialLinks should return a properly parsed SocialLinks object with string values
            // If it's already in the correct format, use it directly
            let parsedSocialLinks: SocialLinks;

            if (socialLinks && typeof socialLinks === 'object') {
              // Check if it's already in the correct format (has string properties)
              const socialLinksAny = socialLinks as any;
              const hasStringProperties =
                (socialLinks.github === undefined || typeof socialLinks.github === 'string') &&
                (socialLinks.linkedin === undefined || typeof socialLinks.linkedin === 'string') &&
                (socialLinks.twitter === undefined || typeof socialLinks.twitter === 'string') &&
                (socialLinks.personalWebsite === undefined || typeof socialLinks.personalWebsite === 'string') &&
                (socialLinksAny.personal_website === undefined || typeof socialLinksAny.personal_website === 'string');

              if (hasStringProperties) {
                // Already parsed, use directly
                parsedSocialLinks = {
                  github: socialLinks.github || '',
                  linkedin: socialLinks.linkedin || '',
                  twitter: socialLinks.twitter || '',
                  personalWebsite: socialLinks.personalWebsite || socialLinksAny.personal_website || '',
                };
                console.log(`✅ Using directly parsed social links for card ${cardId}:`, parsedSocialLinks);
              } else {
                // Needs parsing - might still be in Option format
                parsedSocialLinks = {
                  github: parseOptionString(socialLinks.github || socialLinksAny[0]),
                  linkedin: parseOptionString(socialLinks.linkedin || socialLinksAny[1]),
                  twitter: parseOptionString(socialLinks.twitter || socialLinksAny[2]),
                  personalWebsite: parseOptionString(socialLinksAny.personal_website || socialLinks.personalWebsite || socialLinksAny[3]),
                };
                console.log(`✅ Re-parsed social links for card ${cardId}:`, parsedSocialLinks);
              }
            } else {
              // Fallback to empty object
              parsedSocialLinks = {
                github: "",
                linkedin: "",
                twitter: "",
                personalWebsite: "",
              };
              console.log(`⚠️ Social links is null or invalid for card ${cardId}, using empty object`);
            }

            console.log(`✅ Final parsed social links for card ${cardId}:`, parsedSocialLinks);

            // Parse languages - handle vector<String> from Move contract
            let parsedLanguages: string[] = [];
            if (languages && Array.isArray(languages)) {
              // Check if it's a nested structure (BCS encoding - each element is a byte array)
              if (languages.length > 0 && Array.isArray(languages[0])) {
                // Nested array structure - each element is an array of bytes representing a string
                parsedLanguages = languages
                  .map((lang: any) => {
                    if (Array.isArray(lang)) {
                      // Each item is a byte array - decode it
                      return safeDecodeText(lang);
                    }
                    if (typeof lang === 'string') return lang.trim();
                    // Try to decode as bytes
                    return safeDecodeText(lang);
                  })
                  .filter((lang: string) => lang && lang.trim().length > 0);
              } else {
                // Flat array - each element might be a string or byte array
                parsedLanguages = languages
                  .map((lang: any) => {
                    if (typeof lang === 'string') {
                      // Already a string
                      return lang.trim();
                    }
                    if (Array.isArray(lang)) {
                      // Byte array - decode it
                      return safeDecodeText(lang);
                    }
                    // Try to decode as bytes
                    return safeDecodeText(lang);
                  })
                  .filter((lang: string) => lang && lang.trim().length > 0);
              }
            }

            console.log(`✅ Parsed languages for card ${cardId}:`, parsedLanguages);
            console.log(`✅ Parsed social links for card ${cardId}:`, parsedSocialLinks);
            console.log(`🔍 Raw analytics data for card ${cardId}:`, analytics);

            // Parse analytics - handle both camelCase and snake_case field names
            const analyticsAny = analytics as any;
            const parsedAnalytics = analytics ? {
              totalViews: Number(analyticsAny.total_views || analytics.totalViews || totalViews || 0),
              profileViews: Number(analyticsAny.profile_views || analytics.profileViews || 0),
              monthlyViews: Number(analyticsAny.monthly_views || (analytics as any).monthlyViews || 0),
              contactClicks: Number(analyticsAny.contact_clicks || analytics.contactClicks || 0),
              projectApplications: Number(analyticsAny.project_applications || analytics.projectApplications || 0),
              totalReviews: Number(analyticsAny.total_reviews || analytics.totalReviews || parsedReviews.length || 0),
              averageRating: Number(analyticsAny.average_rating || analytics.averageRating || 0),
              lastViewReset: Number(analyticsAny.last_view_reset || (analytics as any).lastViewReset || 0),
            } : {
              totalViews: totalViews || 0,
              profileViews: 0,
              monthlyViews: 0,
              contactClicks: 0,
              projectApplications: 0,
              totalReviews: parsedReviews.length,
              averageRating: parsedReviews.length > 0
                ? Math.round((parsedReviews.reduce((sum, r) => sum + r.rating, 0) / parsedReviews.length) * 100)
                : 0,
              lastViewReset: 0,
            };

            console.log(`✅ Final parsed analytics for card ${cardId}:`, parsedAnalytics);
            console.log(`🔍 Profile Views: ${parsedAnalytics.profileViews}, Contact Clicks: ${parsedAnalytics.contactClicks}`);

            // Updated data parsing to match new contract structure
            const cardData: DevCardData = {
              id: cardId,
              name,
              owner,
              niche,
              description,
              imageUrl,
              skills: parsedSkills,
              yearsOfExperience,
              technologies,
              workPreferences: parsedWorkPrefs,
              contact,
              socialLinks: parsedSocialLinks,
              portfolio,
              featuredProjects,
              languages: parsedLanguages,
              openToWork,
              isActive,
              verified: false, // Would need to check separately or add to get_card_info
              reviews: parsedReviews,
              createdAt: createdAt, // From contract
              lastUpdated: lastUpdated, // From contract - shows last update since creation
              analytics: parsedAnalytics,
            };

            // Validate required fields
            if (!cardData.name || !cardData.owner) {
              throw new Error(`Invalid card data for ID ${cardId}`);
            }

            console.log(`✅ Complete card data for ${cardId}:`, {
              skills: parsedSkills.length,
              reviews: parsedReviews.length,
              featuredProjects: featuredProjects.length,
              analytics: parsedAnalytics,
            });

            return cardData;
          }
          throw new Error(`No data found for card ID ${cardId}`);
        });

        cacheRef.current.cards.set(cardId, setCacheEntry(cardData));
        return cardData;
      } catch (err) {
        console.error(`❌ Error getting card info for ID ${cardId}:`, err);
        return null;
      }
    },
    [client, currentAccount, isCacheValid, setCacheEntry, withRetry],
  );

  // Optimized batch fetching with better concurrency control
  const batchFetchCards = useCallback(
    async (
      cardIds: number[],
      forceRefresh: boolean = false,
    ): Promise<DevCardData[]> => {
      const results: DevCardData[] = [];
      const uncachedIds: number[] = [];

      for (const cardId of cardIds) {
        const cached = cacheRef.current.cards.get(cardId) || null;
        if (!forceRefresh && isCacheValid(cached)) {
          results.push(cached.data);
        } else {
          uncachedIds.push(cardId);
        }
      }

      if (uncachedIds.length === 0) {
        return results.sort((a, b) => a.id - b.id);
      }

      // Batch fetch uncached cards
      const batchPromises: Promise<DevCardData[]>[] = [];

      for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
        const batch = uncachedIds.slice(i, i + BATCH_SIZE);

        const batchPromise = Promise.all(
          batch.map((id) => getCardInfo(id, forceRefresh)),
        ).then((batchResults) =>
          batchResults.filter((card): card is DevCardData => card !== null),
        );

        batchPromises.push(batchPromise);
      }

      try {
        const batchResults = await Promise.all(batchPromises);
        const newCards = batchResults.flat();
        results.push(...newCards);

        return results.sort((a, b) => a.id - b.id);
      } catch (err) {
        console.error("Error in batch fetch:", err);
        throw err;
      }
    },
    [getCardInfo, isCacheValid],
  );

  // Enhanced getAllCards with progress tracking
  const getAllCards = useCallback(
    async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const count = await getCardCount(forceRefresh);
        if (count === 0) {
          setState((prev) => ({ ...prev, loading: false }));
          return [];
        }

        const cardIds = Array.from({ length: count }, (_, i) => i + 1);
        const cards = await batchFetchCards(cardIds, forceRefresh);

        setState((prev) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        return cards;
      } catch (err) {
        console.error("Error getting all cards:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get all cards";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getCardCount, batchFetchCards],
  );

  // Get only active cards
  const getAllActiveCards = useCallback(
    async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const allCards = await getAllCards(forceRefresh);
        const activeCards = allCards.filter((card) => card.isActive);

        setState((prev) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        return activeCards;
      } catch (err) {
        console.error("Error getting active cards:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get active cards";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getAllCards],
  );

  // Get cards open to work
  const getCardsOpenToWork = useCallback(
    async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const allCards = await getAllCards(forceRefresh);
        const openToWorkCards = allCards.filter(
          (card) => card.openToWork && card.isActive,
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        return openToWorkCards;
      } catch (err) {
        console.error("Error getting cards open to work:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get cards open to work";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getAllCards],
  );

  const getUserCards = useCallback(
    async (
      userAddress: string,
      forceRefresh: boolean = false,
    ): Promise<DevCardData[]> => {
      if (!userAddress) return [];

      // PERFORMANCE FIX: Check cache first without blocking
      const cached = cacheRef.current.userCards.get(userAddress) || null;
      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        // OPTIMIZATION: Use Promise.allSettled for parallel processing
        const count = await getCardCount(forceRefresh);
        if (count === 0) return [];

        // OPTIMIZED: Process in smaller chunks with better concurrency
        const CHUNK_SIZE = 3; // Smaller chunks for faster first results
        const MAX_CONCURRENT = 2; // Limit concurrent requests

        const userCards: DevCardData[] = [];
        const totalChunks = Math.ceil(count / CHUNK_SIZE);

        // Process chunks with controlled concurrency
        for (let i = 0; i < totalChunks; i += MAX_CONCURRENT) {
          const chunkPromises = [];

          for (let j = 0; j < MAX_CONCURRENT && i + j < totalChunks; j++) {
            const chunkIndex = i + j;
            const startId = chunkIndex * CHUNK_SIZE + 1;
            const endId = Math.min(startId + CHUNK_SIZE - 1, count);

            const chunkPromise = processCardChunk(
              startId,
              endId,
              userAddress,
              forceRefresh,
            );
            chunkPromises.push(chunkPromise);
          }

          const results = await Promise.allSettled(chunkPromises);
          results.forEach((result) => {
            if (result.status === "fulfilled") {
              userCards.push(...result.value);
            }
          });
        }

        const sortedCards = userCards.sort((a, b) => a.id - b.id);
        cacheRef.current.userCards.set(userAddress, setCacheEntry(sortedCards));
        return sortedCards;
      } catch (err) {
        console.error("❌ Error getting user cards:", err);
        return [];
      }
    },
    [getCardCount, isCacheValid, setCacheEntry],
  );

  // Helper function for processing card chunks
  const processCardChunk = async (
    startId: number,
    endId: number,
    userAddress: string,
    forceRefresh: boolean,
  ): Promise<DevCardData[]> => {
    const cardIds = Array.from(
      { length: endId - startId + 1 },
      (_, i) => startId + i,
    );

    try {
      // Use Promise.all for parallel fetching within chunk
      const cardPromises = cardIds.map((id) => getCardInfo(id, forceRefresh));
      const cards = await Promise.all(cardPromises);

      return cards
        .filter((card): card is DevCardData => card !== null)
        .filter(
          (card) => card.owner.toLowerCase() === userAddress.toLowerCase(),
        );
    } catch (error) {
      console.warn(`Error processing chunk ${startId}-${endId}:`, error);
      return [];
    }
  };

  const isAdmin = useCallback(
    async (
      address: string,
      forceRefresh: boolean = false,
    ): Promise<boolean> => {
      const cached = cacheRef.current.adminStatus.get(address) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log(`🔍 Checking admin status for: ${address}`);
        console.log(`📦 Using PACKAGE_ID: ${PACKAGE_ID}`);
        console.log(`📦 Using DEVHUB_OBJECT_ID: ${DEVHUB_OBJECT_ID}`);

        // Use getAdmins and check if address is in the list
        // IMPORTANT: Publisher (super_admin) should NOT have regular admin access
        // This is a workaround since is_admin function doesn't exist in devhub module
        const adminStatus = await withRetry(async () => {
          const [admins, superAdminAddr] = await Promise.all([
            getAdminsFromContract(),
            getSuperAdmin(),
          ]);

          console.log(`📋 Admins list:`, admins);
          console.log(`📋 Super admin:`, superAdminAddr);

          // Normalize addresses for comparison (remove leading zeros, ensure lowercase)
          const normalizeAddress = (addr: string) => addr.toLowerCase().trim();
          const normalizedAddress = normalizeAddress(address);

          // Explicitly exclude super admin (publisher) from regular admin access
          if (superAdminAddr && normalizeAddress(superAdminAddr) === normalizedAddress) {
            console.log(`👑 Address ${address} is super admin (publisher) - NOT granting regular admin access`);
            return false; // Publisher should only have super admin access, not regular admin
          }

          // Check if address is in admins list (excluding super admin)
          const isInAdmins = admins.some(
            (adminAddr) => normalizeAddress(adminAddr) === normalizedAddress
          );

          console.log(`👑 Admin status for ${address}:`, isInAdmins);
          return isInAdmins;
        });

        cacheRef.current.adminStatus.set(address, setCacheEntry(adminStatus));
        return adminStatus;
      } catch (err: any) {
        // Check if error is about package not existing
        const errorMessage = err?.message || err?.toString() || '';
        if (errorMessage.includes('Package object does not exist') || 
            errorMessage.includes('does not exist with ID')) {
          console.warn(`⚠️ Package ${PACKAGE_ID} does not exist on the network. This may be normal if the package hasn't been published yet.`);
          return false;
        }
        console.error(`❌ Error checking admin status:`, err);
        return false; // ✅ Always default to false on error
      }
    },
    [isCacheValid, setCacheEntry, withRetry],
  );

  const isSuperAdmin = useCallback(
    async (
      address: string,
    ): Promise<boolean> => {
      try {
        console.log(`🔍 Checking super admin status for: ${address}`);

        // Only the publisher address (super_admin) can be a super admin
        // This checks if the given address matches the contract's super_admin (publisher)
        // Use getSuperAdmin and check if address matches
        // This is a workaround since is_super_admin function doesn't exist in devhub module
        const superAdminStatus = await withRetry(async () => {
          const superAdminAddr = await getSuperAdmin();

          console.log(`📋 Super admin address:`, superAdminAddr);

          if (!superAdminAddr) {
            console.log(`⚠️ No super admin found`);
            return false;
          }

          // Normalize addresses for comparison (remove leading zeros, ensure lowercase)
          const normalizeAddress = (addr: string) => addr.toLowerCase().trim();
          const normalizedAddress = normalizeAddress(address);
          const normalizedSuperAdmin = normalizeAddress(superAdminAddr);

          const isSuperAdminResult = normalizedSuperAdmin === normalizedAddress;

          console.log(`👑 Super admin status for ${address}:`, isSuperAdminResult);
          return isSuperAdminResult;
        });

        return superAdminStatus;
      } catch (err: any) {
        // Check if error is about package not existing
        const errorMessage = err?.message || err?.toString() || '';
        if (errorMessage.includes('Package object does not exist') || 
            errorMessage.includes('does not exist with ID')) {
          console.warn(`⚠️ Package ${PACKAGE_ID} does not exist on the network. This may be normal if the package hasn't been published yet.`);
          return false;
        }
        console.error(`❌ Error checking super admin status:`, err);
        return false; // ✅ Always default to false on error
      }
    },
    [withRetry],
  );

  const getAdmins = useCallback(
    async (): Promise<string[]> => {
      try {
        console.log('Fetching admins from contract...');
        const admins = await getAdminsFromContract();
        console.log('Retrieved admins:', admins);
        return admins;
      } catch (error) {
        console.error('Error fetching admins:', error);
        setState((prev) => ({ ...prev, error: "Failed to fetch admins" }));
        return [];
      }
    },
    [],
  );

  const getPlatformFeeBalance = useCallback(
    async (forceRefresh: boolean = false): Promise<number> => {
      const cached = cacheRef.current.platformFeeBalance;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log("🔍 Fetching platform fee balance...");

        const balance = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID)],
          });

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender: currentAccount?.address || "0x0",
          });

          console.log("📥 Platform fee balance result:", result);

          if (result.results?.[0]?.returnValues?.[0]) {
            const [bytes] = result.results[0].returnValues[0];
            console.log("📊 Raw bytes:", bytes);

            // Handle different byte formats for u64
            let balance: number;
            if (Array.isArray(bytes)) {
              // Convert little-endian byte array to number
              balance = bytes.reduce((acc, byte, index) => {
                return acc + byte * Math.pow(256, index);
              }, 0);
            } else if (typeof bytes === "string") {
              balance = parseInt(bytes);
            } else {
              balance = Number(bytes);
            }

            console.log("💰 Parsed balance:", balance, "MIST");
            return balance;
          }
          return 0;
        });

        cacheRef.current.platformFeeBalance = setCacheEntry(balance);
        return balance;
      } catch (err) {
        console.error("❌ Error getting platform fee balance:", err);
        setState((prev) => ({
          ...prev,
          error: "Failed to get platform fee balance",
        }));
        return 0;
      }
    },
    [client, currentAccount, isCacheValid, setCacheEntry, withRetry],
  );

  // Add this function after the getPlatformFeeBalance function in your useContract hook

  const getPlatformFee = useCallback(async (): Promise<number> => {
    // You can cache this if needed, but platform fee is usually a constant
    try {
      console.log("🔍 Fetching platform fee...");

      const fee = await withRetry(async () => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx as any,
          sender: currentAccount?.address || "0x0",
        });

        console.log("📥 Platform fee result:", result);

        if (result.results?.[0]?.returnValues?.[0]) {
          const [bytes] = result.results[0].returnValues[0];
          console.log("📊 Raw bytes:", bytes);

          // Handle different byte formats for u64
          let fee: number;
          if (Array.isArray(bytes)) {
            // Convert little-endian byte array to number
            fee = bytes.reduce((acc, byte, index) => {
              return acc + byte * Math.pow(256, index);
            }, 0);
          } else if (typeof bytes === "string") {
            fee = parseInt(bytes);
          } else {
            fee = Number(bytes);
          }

          console.log("💰 Parsed platform fee:", fee, "MIST");
          return fee;
        }
        return 0;
      });

      return fee;
    } catch (err) {
      console.error("❌ Error getting platform fee:", err);
      setState((prev) => ({ ...prev, error: "Failed to get platform fee" }));
      return 0;
    }
  }, [client, currentAccount, withRetry]);
  // Check if card is active
  const isCardActive = useCallback(
    async (cardId: number, forceRefresh: boolean = false): Promise<boolean> => {
      try {
        // First try to get from cache
        const cached = cacheRef.current.cards.get(cardId);
        if (!forceRefresh && cached && isCacheValid(cached)) {
          return cached.data.isActive;
        }

        // Fetch fresh data
        const cardData = await getCardInfo(cardId, forceRefresh);
        return cardData?.isActive || false;
      } catch (err) {
        console.error(`Error checking if card ${cardId} is active:`, err);
        return false;
      }
    },
    [getCardInfo, isCacheValid],
  );

  // Check if card is open to work
  const isCardOpenToWork = useCallback(
    async (cardId: number, forceRefresh: boolean = false): Promise<boolean> => {
      try {
        // First try to get from cache
        const cached = cacheRef.current.cards.get(cardId);
        if (!forceRefresh && cached && isCacheValid(cached)) {
          return cached.data.openToWork;
        }

        // Fetch fresh data
        const cardData = await getCardInfo(cardId, forceRefresh);
        return cardData?.openToWork || false;
      } catch (err) {
        console.error(`Error checking if card ${cardId} is open to work:`, err);
        return false;
      }
    },
    [getCardInfo, isCacheValid],
  );

  // Enhanced cache management
  const clearCache = useCallback((userAddress?: string) => {
    if (userAddress) {
      // Clear cache for specific user
      cacheRef.current.userCards.delete(userAddress);
      cacheRef.current.adminStatus.delete(userAddress);
    } else {
      // Clear all cache
      cacheRef.current.cards.clear();
      cacheRef.current.userCards.clear();
      cacheRef.current.adminStatus.clear();
      cacheRef.current.cardCount = null;
      cacheRef.current.platformFeeBalance = null;
    }

    setState((prev) => ({ ...prev, error: null, lastFetch: null }));
  }, []);

  // Enhanced cache update methods
  const updateCardInCache = useCallback(
    (cardId: number, updatedCard: DevCardData) => {
      cacheRef.current.cards.set(cardId, setCacheEntry(updatedCard));

      // Update user-specific cache
      cacheRef.current.userCards.forEach((entry, userAddress) => {
        if (isCacheValid(entry)) {
          const updatedUserCards = entry.data.map((card) =>
            card.id === cardId ? updatedCard : card,
          );
          cacheRef.current.userCards.set(
            userAddress,
            setCacheEntry(updatedUserCards),
          );
        }
      });
    },
    [setCacheEntry, isCacheValid],
  );

  const addCardToUserCache = useCallback(
    (userAddress: string, newCard: DevCardData) => {
      // Add to individual card cache
      cacheRef.current.cards.set(newCard.id, setCacheEntry(newCard));

      // Add to user-specific cache
      const userCacheEntry = cacheRef.current.userCards.get(userAddress);
      if (userCacheEntry && isCacheValid(userCacheEntry)) {
        const updatedUserCards = [...userCacheEntry.data, newCard].sort(
          (a, b) => a.id - b.id,
        );
        cacheRef.current.userCards.set(
          userAddress,
          setCacheEntry(updatedUserCards),
        );
      }

      // Invalidate card count cache
      cacheRef.current.cardCount = null;
    },
    [setCacheEntry, isCacheValid],
  );

  const removeCardFromCache = useCallback(
    (cardId: number, userAddress: string) => {
      // Remove from individual card cache
      cacheRef.current.cards.delete(cardId);

      // Remove from user-specific cache
      const userCacheEntry = cacheRef.current.userCards.get(userAddress);
      if (userCacheEntry && isCacheValid(userCacheEntry)) {
        const filteredUserCards = userCacheEntry.data.filter(
          (card) => card.id !== cardId,
        );
        cacheRef.current.userCards.set(
          userAddress,
          setCacheEntry(filteredUserCards),
        );
      }

      // Invalidate card count cache
      cacheRef.current.cardCount = null;
    },
    [setCacheEntry, isCacheValid],
  );

  // Cache statistics for debugging
  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const stats = {
      totalCards: cacheRef.current.cards.size,
      validCards: Array.from(cacheRef.current.cards.values()).filter(
        (entry) => now - entry.timestamp < entry.ttl,
      ).length,
      totalUserCaches: cacheRef.current.userCards.size,
      validUserCaches: Array.from(cacheRef.current.userCards.values()).filter(
        (entry) => now - entry.timestamp < entry.ttl,
      ).length,
      hasCardCount: cacheRef.current.cardCount !== null,
      cardCountValid: cacheRef.current.cardCount
        ? now - cacheRef.current.cardCount.timestamp <
        cacheRef.current.cardCount.ttl
        : false,
    };
    return stats;
  }, []);

  // Error state setter for external use
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Project functions
  const getProjectInfo = useCallback(
    async (projectId: number, forceRefresh: boolean = false): Promise<Project | null> => {
      const cached = cacheRef.current.projects.get(projectId) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const project = await withRetry(async () => {
          return await getProjectInfo(projectId);
        });

        if (project) {
          cacheRef.current.projects.set(projectId, setCacheEntry(project));
        }
        return project;
      } catch (err) {
        console.error(`Error getting project info for ID ${projectId}:`, err);
        return null;
      }
    },
    [isCacheValid, setCacheEntry, withRetry],
  );

  const getProjectApplications = useCallback(
    async (projectId: number, forceRefresh: boolean = false): Promise<ProjectApplication[]> => {
      const cached = cacheRef.current.projectApplications.get(projectId) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const applications = await withRetry(async () => {
          return await getProjectApplications(projectId);
        });

        cacheRef.current.projectApplications.set(projectId, setCacheEntry(applications));
        return applications;
      } catch (err) {
        console.error(`Error getting project applications for ID ${projectId}:`, err);
        return [];
      }
    },
    [isCacheValid, setCacheEntry, withRetry],
  );

  // Search functions
  const searchCards = useCallback(
    async (
      searchType: 'skill' | 'location' | 'workType' | 'niche',
      query: string,
      minProficiency?: number,
      forceRefresh: boolean = false
    ): Promise<number[]> => {
      const cacheKey = `${searchType}:${query}:${minProficiency || 0}`;
      const cached = cacheRef.current.searchResults.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        let results: number[];
        switch (searchType) {
          case 'skill':
            results = await searchCardsBySkill(query, minProficiency || 1);
            break;
          case 'location':
            results = await searchCardsByLocation(query);
            break;
          case 'workType':
            results = await searchCardsByWorkType(query);
            break;
          case 'niche':
            results = await searchCardsByNiche(query);
            break;
          default:
            results = [];
        }

        cacheRef.current.searchResults.set(cacheKey, setCacheEntry(results));
        return results;
      } catch (err) {
        console.error(`Error searching cards by ${searchType}:`, err);
        return [];
      }
    },
    [isCacheValid, setCacheEntry],
  );

  // Helper functions for messaging
  const getConversationMessages = useCallback(
    async (conversationId: string, participants?: string[]): Promise<Message[]> => {
      try {
        console.log('Getting messages for conversation:', conversationId);

        // Get the conversation object from the blockchain
        const conversationObject = await client.getObject({
          id: conversationId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (!conversationObject.data || !conversationObject.data.content) {
          console.log('Conversation object not found or no content');
          console.log('Conversation object response:', conversationObject);
          return [];
        }

        const conversationContent = conversationObject.data.content as any;
        const conversationData = conversationContent.fields as any;

        console.log('Conversation object structure:', conversationObject);
        console.log('Conversation content:', conversationContent);
        console.log('Conversation data:', conversationData);

        if (!conversationData.messages) {
          console.log('No messages field found in conversation');
          return [];
        }

        console.log('Messages field:', conversationData.messages);

        // Check different possible structures for the messages field
        let messagesVector;
        if (conversationData.messages.fields && conversationData.messages.fields.contents) {
          messagesVector = conversationData.messages.fields.contents;
        } else if (Array.isArray(conversationData.messages)) {
          messagesVector = conversationData.messages;
        } else if (conversationData.messages.contents) {
          messagesVector = conversationData.messages.contents;
        } else {
          console.log('Messages field structure not recognized:', conversationData.messages);
          return [];
        }

        if (!messagesVector || messagesVector.length === 0) {
          console.log('No messages found in conversation');
          return [];
        }

        console.log('Found', messagesVector.length, 'messages in conversation');

        const messages: Message[] = [];

        for (let i = 0; i < messagesVector.length; i++) {
          const messageData = messagesVector[i].fields;

          console.log(`Message ${i} raw data:`, JSON.stringify(messageData, null, 2));
          console.log(`Message ${i} has encrypted_content:`, !!messageData.encrypted_content);
          console.log(`Message ${i} encrypted_content type:`, typeof messageData.encrypted_content);
          console.log(`Message ${i} encrypted_content value:`, messageData.encrypted_content);
          console.log(`Message ${i} has participants:`, !!participants);
          console.log(`Message ${i} all message fields:`, Object.keys(messageData));

          try {
            // Decrypt the message content
            let decryptedContent = '';

            if (messageData.encrypted_content && participants) {
              // Debug the encrypted content structure
              console.log(`Message ${i} encrypted_content:`, messageData.encrypted_content);
              console.log(`Message ${i} encrypted_content type:`, typeof messageData.encrypted_content);
              console.log(`Message ${i} encrypted_content length:`, messageData.encrypted_content?.length);

              // Convert the encrypted content back to Uint8Array
              let encryptedBytes;
              if (Array.isArray(messageData.encrypted_content)) {
                encryptedBytes = new Uint8Array(messageData.encrypted_content);
              } else if (messageData.encrypted_content instanceof Uint8Array) {
                encryptedBytes = messageData.encrypted_content;
              } else {
                console.error(`Unexpected encrypted content format for message ${i}:`, messageData.encrypted_content);
                decryptedContent = '[Invalid encrypted content format]';
                continue;
              }

              console.log(`Message ${i} encrypted bytes length:`, encryptedBytes.length);
              console.log(`Message ${i} encrypted bytes (first 20):`, Array.from(encryptedBytes.slice(0, 20)));

              // Note: Legacy Seal client usage is deprecated
              // The new messaging SDK handles encryption automatically

              try {
                // Legacy encryption is no longer supported
                console.warn('Legacy Seal encryption is deprecated. Use the new messaging SDK instead.');

                // Try to parse the encrypted content as an EncryptedObject first
                const { EncryptedObject } = await import('@mysten/seal');
                let encryptedObject;

                try {
                  encryptedObject = EncryptedObject.parse(encryptedBytes);
                  console.log(`Message ${i} parsed as EncryptedObject:`, encryptedObject);
                } catch (parseError) {
                  console.log(`Message ${i} could not be parsed as EncryptedObject:`, parseError);
                  console.log(`Message ${i} raw bytes (first 50):`, Array.from(encryptedBytes.slice(0, 50)));

                  // Check if this might be plain text (not encrypted)
                  try {
                    const textDecoder = new TextDecoder();
                    const decodedText = textDecoder.decode(encryptedBytes);
                    console.log(`Message ${i} appears to be plain text:`, decodedText);
                    decryptedContent = decodedText;
                    // Don't continue here - we want to add this message to the results
                  } catch (textError) {
                    console.log(`Message ${i} is not valid text either:`, textError);
                    // If parsing fails, this might be an old message format or corrupted data
                    decryptedContent = '[Message content format not supported - may be from older version]';
                  }
                }

                // If we have decrypted content (either from encrypted object or plain text), add it to results
                if (decryptedContent) {
                  console.log(`Message ${i} final decrypted content:`, decryptedContent);

                  // Add the message to the results
                  messages.push({
                    sender: messageData.sender,
                    content: decryptedContent,
                    timestamp: messageData.timestamp.toString(),
                    isRead: messageData.is_read || false
                  });

                  console.log(`Message ${i} added to results. Total messages so far:`, messages.length);
                  continue; // Move to next message
                }

                // If we reach here, we need to handle encrypted objects
                console.log(`Message ${i} processing as encrypted object...`);

                // Create a transaction that calls the seal_approve_conversation function
                const tx = new Transaction();
                tx.moveCall({
                  target: `${PACKAGE_ID}::messaging::seal_approve_conversation`,
                  arguments: [
                    tx.pure.vector('u8', Array.from(new TextEncoder().encode(conversationId))),
                    tx.object(conversationId),
                  ],
                });

                console.log(`Message ${i} transaction arguments:`, {
                  conversationId: conversationId,
                  conversationIdBytes: Array.from(new TextEncoder().encode(conversationId)),
                  packageId: PACKAGE_ID
                });

                // Build the transaction bytes (not used in current implementation)
                // const txBytes = tx.build({ client, onlyTransactionKind: true });

                // Legacy Seal client is no longer supported
                console.warn('Legacy Seal client is deprecated. Use the new messaging SDK instead.');
                throw new Error('Legacy encryption is no longer supported. Use the new messaging SDK.');

                console.log(`Message ${i} encrypted object details:`, {
                  id: encryptedObject.id,
                  threshold: encryptedObject.threshold,
                  services: encryptedObject.services,
                  packageId: encryptedObject.packageId
                });

                // Now let's try to actually decrypt the message
                try {
                  // Try using fetchKeys method instead of session key
                  console.log(`Message ${i} attempting to fetch keys for decryption...`);

                  // Legacy decryption is no longer supported
                  console.warn('Legacy Seal decryption is deprecated. Use the new messaging SDK instead.');
                  decryptedContent = 'Legacy encryption not supported. Use new messaging SDK.';
                  console.log(`Successfully decrypted message ${i}:`, decryptedContent);
                } catch (decryptError: any) {
                  console.error(`Failed to decrypt message ${i} with fetchKeys:`, decryptError);

                  // Try alternative approach - maybe the issue is with the transaction format
                  try {
                    console.log(`Message ${i} trying alternative decryption approach...`);

                    // Create a simpler transaction
                    const simpleTx = new Transaction();
                    simpleTx.moveCall({
                      target: `${PACKAGE_ID}::messaging::seal_approve_conversation`,
                      arguments: [
                        simpleTx.pure.vector('u8', Array.from(new TextEncoder().encode(conversationId))),
                        simpleTx.object(conversationId),
                      ],
                    });

                    // const simpleTxBytes = simpleTx.build({ client, onlyTransactionKind: true });

                    // Legacy decryption is no longer supported
                    console.warn('Legacy Seal decryption is deprecated. Use the new messaging SDK instead.');
                    decryptedContent = 'Legacy encryption not supported. Use new messaging SDK.';
                    console.log(`Successfully decrypted message ${i} with alternative approach:`, decryptedContent);
                  } catch (altDecryptError: any) {
                    console.error(`Alternative decryption also failed for message ${i}:`, altDecryptError);
                    // Fallback to showing metadata
                    decryptedContent = `[Encrypted message - ID: ${encryptedObject.id}, Threshold: ${encryptedObject.threshold}]`;
                  }
                }
              } catch (decryptError: any) {
                console.error(`Failed to decrypt message ${i}:`, decryptError);
                console.error(`Decrypt error details:`, {
                  error: decryptError.message,
                  encryptedBytesLength: encryptedBytes.length,
                  conversationId,
                  participants
                });
                decryptedContent = '[Encrypted message - decryption failed]';
              }
            } else if (messageData.encrypted_content) {
              // encrypted_content exists but participants not available - decode as plain text
              console.log(`Message ${i} has encrypted_content but no participants, decoding as plain text`);
              try {
                // encrypted_content is an array of bytes (plain text in this case)
                if (Array.isArray(messageData.encrypted_content)) {
                  const textDecoder = new TextDecoder('utf-8', { fatal: false });
                  decryptedContent = textDecoder.decode(new Uint8Array(messageData.encrypted_content));
                  console.log(`Message ${i} decoded as plain text:`, decryptedContent);
                } else {
                  console.log(`Message ${i} encrypted_content is not an array:`, typeof messageData.encrypted_content);
                  decryptedContent = '[Invalid message format]';
                }
              } catch (error) {
                console.error(`Message ${i} failed to decode as plain text:`, error);
                decryptedContent = '[Message decode failed]';
              }
            } else {
              // No encrypted_content field at all
              console.log(`Message ${i} no encrypted_content field, trying direct content field`);
              if (messageData.content) {
                decryptedContent = messageData.content;
                console.log(`Message ${i} using direct content field:`, decryptedContent);
              } else {
                decryptedContent = '[Message content not available]';
                console.log(`Message ${i} no content available`);
              }
            }

            messages.push({
              sender: messageData.sender,
              content: decryptedContent,
              timestamp: messageData.timestamp.toString(),
              isRead: messageData.is_read || false
            });
          } catch (messageError) {
            console.error(`Error processing message ${i}:`, messageError);
            // Add a placeholder message if decryption fails
            messages.push({
              sender: messageData.sender || 'Unknown',
              content: '[Message processing failed]',
              timestamp: messageData.timestamp?.toString() || '0',
              isRead: false
            });
          }
        }

        console.log('Retrieved and decrypted messages for conversation:', conversationId, messages);
        return messages;
      } catch (err) {
        console.error('Error getting conversation messages:', err);
        return [];
      }
    },
    [client],
  );

  const getConnections = useCallback(
    async (_connectionStoreId: string, user: string): Promise<Connection[]> => {
      try {
        // Query ConnectionAccepted events
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::devhub::ConnectionAccepted`
          },
          limit: 100,
          order: 'ascending'
        });

        const connections: Connection[] = [];
        for (const event of events.data) {
          if (event.parsedJson) {
            const { user1, user2 } = event.parsedJson as any;
            // Filter connections where the user is involved
            if (user1 === user || user2 === user) {
              const connectedUser = user1 === user ? user2 : user1;
              connections.push({
                user: connectedUser,
                status: 'Connected',
                notificationsEnabled: true,
                profileShared: true,
                messagesAllowed: true
              });
            }
          }
        }

        return connections;
      } catch (err) {
        console.error('Error getting connections:', err);
        return [];
      }
    },
    [client],
  );

  const getConversations = useCallback(
    async (user: string): Promise<any[]> => {
      try {
        // Query ConversationCreated events
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::messaging::ConversationCreated`
          },
          limit: 100,
          order: 'ascending'
        });

        const conversations: any[] = [];
        for (const event of events.data) {
          if (event.parsedJson) {
            const eventData = event.parsedJson as any;
            // Filter conversations where the user is a participant
            if (eventData.participant1 === user || eventData.participant2 === user) {
              conversations.push({
                id: eventData.conversation_id,
                participant1: eventData.participant1,
                participant2: eventData.participant2,
                timestamp: eventData.timestamp
              });
            }
          }
        }

        return conversations;
      } catch (err) {
        console.error('Error getting conversations:', err);
        return [];
      }
    },
    [client],
  );

  // Message-related hooks
  const useMessages = useCallback(
    async (conversationId: string, forceRefresh: boolean = false): Promise<Message[]> => {
      const cacheKey = `messages:${conversationId}`;
      const cached = cacheRef.current.messages?.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const messages = await getConversationMessages(conversationId);

        // Update cache
        if (!cacheRef.current.messages) {
          cacheRef.current.messages = new Map();
        }
        cacheRef.current.messages.set(cacheKey, setCacheEntry(messages));

        return messages;
      } catch (err) {
        console.error('Error fetching messages:', err);
        return [];
      }
    },
    [isCacheValid, setCacheEntry],
  );

  const useConnections = useCallback(
    async (connectionStoreId: string, user: string, forceRefresh: boolean = false): Promise<Connection[]> => {
      const cacheKey = `connections:${connectionStoreId}:${user}`;
      const cached = cacheRef.current.connections?.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const connections = await getConnections(connectionStoreId, user);

        // Update cache
        if (!cacheRef.current.connections) {
          cacheRef.current.connections = new Map();
        }
        cacheRef.current.connections.set(cacheKey, setCacheEntry(connections));

        return connections;
      } catch (err) {
        console.error('Error fetching connections:', err);
        return [];
      }
    },
    [isCacheValid, setCacheEntry],
  );

  const useConversations = useCallback(
    async (user: string, forceRefresh: boolean = false): Promise<Conversation[]> => {
      const cacheKey = `conversations:${user}`;
      const cached = cacheRef.current.conversations?.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        // Query ConversationCreated events
        console.log('Querying for ConversationCreated events with package ID:', PACKAGE_ID);
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::messaging::ConversationCreated`
          },
          limit: 100,
          order: 'ascending'
        });

        console.log('Found events:', events.data.length);
        console.log('Events data:', events.data);
        console.log('Package ID being used:', PACKAGE_ID);

        const conversationsByPair: Record<string, Conversation> = {};
        for (const event of events.data) {
          if (event.parsedJson) {
            const { conversation_id, participant1, participant2 } = event.parsedJson as any;
            console.log('Processing event:', { conversation_id, participant1, participant2, user });
            const p1 = participant1?.toLowerCase();
            const p2 = participant2?.toLowerCase();
            const u = user?.toLowerCase();

            // Filter conversations where the user is a participant
            if (p1 === u || p2 === u) {
              console.log('Adding conversation:', conversation_id);
              const a = participant1.toLowerCase();
              const b = participant2.toLowerCase();
              const key = a < b ? `${a}-${b}` : `${b}-${a}`;
              conversationsByPair[key] = {
                id: conversation_id,
                participant1,
                participant2,
                messages: []
              };
            }
          }
        }
        const conversations = Object.values(conversationsByPair);

        // Update cache
        if (!cacheRef.current.conversations) {
          cacheRef.current.conversations = new Map();
        }
        cacheRef.current.conversations.set(cacheKey, setCacheEntry(conversations));

        return conversations;
      } catch (err) {
        console.error('Error fetching conversations:', err);
        return [];
      }
    },
    [isCacheValid, setCacheEntry, client],
  );

  // Memoized return object to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      // State
      loading: state.loading,
      error: state.error,
      cardCount: state.cardCount,
      projectCount: state.projectCount,
      lastFetch: state.lastFetch,

      // Add these Walrus state properties:
      walrusUploading: state.walrusUploading,
      walrusProgress: state.walrusProgress,

      // Core functions
      getCardCount,
      getCardInfo,
      getAllCards,
      getAllActiveCards,
      getCardsOpenToWork,
      getUserCards,
      isWalrusUrl,
      uploadToWalrus,
      uploadUrlToWalrus,
      isAdmin,
      getPlatformFee,
      getPlatformFeeBalance,
      isCardActive,
      isCardOpenToWork,
      getWalrusBlob,
      isSuperAdmin,
      getSuperAdmin,
      getAdmins,

      // Project functions
      getProjectInfo,
      getProjectApplications,

      // Search functions
      searchCards,
      searchCardsBySkill,
      searchCardsByLocation,
      searchCardsByWorkType,
      searchCardsByNiche,
      searchProjectsBySkill,
      getAvailableDevelopers,
      getOpenProjects,
      getUIUXDesigners,
      getContentCreators,
      getDevOpsProfessionals,
      getProjectManagers,
      getCommunityManagers,
      getDevelopmentDirectors,
      getProductManagers,
      getMarketingSpecialists,
      getBusinessAnalysts,
      getCustomNiches,
      getAllNichesInUse,
      getAvailableNiches,
      isCustomNiche,

      // Proposal functions
      getProposalDetails,
      getUserProposals,
      getProposalsByStatus,
      getPlatformStatistics,

      // Messaging functions (New SDK)
      createMessagingChannel: async (userAddress: string, participantAddress: string, signer: any) => {
        return await createMessagingChannel(userAddress, participantAddress, signer);
      },
      getUserMemberships: async (userAddress: string) => {
        return await getUserMemberships(userAddress);
      },
      getChannelObjects: async (channelIds: string[], userAddress: string) => {
        return await getChannelObjects(channelIds, userAddress);
      },
      sendMessage: async (channelId: string, memberCapId: string, message: string, encryptedKey: any, signer: any) => {
        return await sendMessage(channelId, memberCapId, message, encryptedKey, signer);
      },
      getChannelMessages: async (channelId: string, userAddress: string, limit?: number, direction?: 'forward' | 'backward') => {
        return await getChannelMessages(channelId, userAddress, limit, direction);
      },

      // Additional channel management functions
      getUserChannelMemberships: async (userAddress: string) => {
        return await getUserChannelMemberships(userAddress);
      },
      getChannelDetails: async (channelId: string) => {
        return await getChannelDetails(channelId);
      },
      getChannelMembers: async (channelId: string) => {
        const tx = await getChannelMembersTransaction(channelId);
        return tx;
      },
      getChannelMessagesTx: async (channelId: string) => {
        const tx = await getChannelMessagesTransaction(channelId);
        return tx;
      },

      // Legacy messaging functions
      getConversationMessages,
      useMessages: async (conversationId: string, participants?: string[]) => {
        return await getConversationMessages(conversationId, participants);
      },
      useConnections: getConnections,
      useConversations,

      // Connection functions
      getConnections,
      isConnected,

      // Channel management functions
      createChannelTransaction,
      sendMessageToChannelTransaction,
      addMemberToChannelTransaction,
      removeMemberFromChannelTransaction,
      getChannelMessagesTransaction,
      getChannelMembersTransaction,
      getChannelMessagesFromObject,

      // Cache management
      clearCache,
      updateCardInCache,
      addCardToUserCache,
      removeCardFromCache,
      getCacheStats,

      // Utility
      setError,
    }),
    [
      state,
      getCardCount,
      getCardInfo,
      getAllCards,
      getAllActiveCards,
      getCardsOpenToWork,
      getUserCards,
      isAdmin,
      getPlatformFee,
      getPlatformFeeBalance,
      getWalrusBlob,
      isWalrusUrl,
      uploadToWalrus,
      uploadUrlToWalrus,
      isCardActive,
      isCardOpenToWork,
      clearCache,
      updateCardInCache,
      addCardToUserCache,
      removeCardFromCache,
      getCacheStats,
      setError,
      isSuperAdmin,
      getSuperAdmin,
      getAdmins,
      getProjectInfo,
      getProjectApplications,
      searchCards,
      getConversationMessages,
      getConnections,
      getConversations,
      useMessages,
      useConnections,
      useConversations,
      createMessagingChannel,
      getUserMemberships,
      getChannelObjects,
      sendMessage,
      // New channel management functions (already included in return object above)
    ],
  );

  return returnValue;
}