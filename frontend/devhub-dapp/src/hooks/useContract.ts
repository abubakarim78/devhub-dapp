import { useState, useCallback, useRef, useMemo } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  DEVHUB_OBJECT_ID,
  PACKAGE_ID,
  CONTRACT_FUNCTIONS,
  DevCardData,
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
  lastFetch: number | null;
  // Add Walrus-related state
  walrusUploading: boolean;
  walrusProgress: string;
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
    if (bytes.includes(",")) {
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

  // Convert byte array to hex string
  const hexString = byteArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `0x${hexString}`;
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
      } else if (bytes.includes(",")) {
        byteArray = bytes.split(",").map(Number);
      } else {
        return cleanTextString(bytes); // Already a string, just clean it
      }
    } else if (Array.isArray(bytes)) {
      byteArray = bytes;
    } else if (bytes instanceof Uint8Array) {
      byteArray = Array.from(bytes);
    } else {
      return cleanTextString(bytes.toString());
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
const cleanTextString = (text: string): string => {
  if (!text) return "";

  let cleaned = text
    // Remove control characters except newlines and carriage returns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove common unwanted prefixes that might be added during encoding
    .replace(/^[^\w\s"'`]/, "") // Remove leading non-word, non-space, non-quote characters
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
    lastFetch: null,
    // Initialize Walrus state
    walrusUploading: false,
    walrusProgress: "",
  });

  // Enhanced caching with TTL
  const cacheRef = useRef({
    cards: new Map<number, CacheEntry<DevCardData>>(),
    userCards: new Map<string, CacheEntry<DevCardData[]>>(),
    cardCount: null as CacheEntry<number> | null,
    platformFeeBalance: null as CacheEntry<number> | null,
    adminStatus: new Map<string, CacheEntry<boolean>>(),
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
            target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID)],
          });

          console.log(
            `📤 Card count transaction target: ${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          );

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
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
            target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.u64(cardId)],
          });

          console.log(
            `📤 Transaction target: ${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
          );
          console.log(`📤 DevHub Object ID: ${DEVHUB_OBJECT_ID}`);
          console.log(`📤 Sender address: ${currentAccount?.address || "0x0"}`);

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender:
              currentAccount?.address ||
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          });

          console.log(`📥 Raw result for card ${cardId}:`, result);

          if (result.results?.[0]?.returnValues) {
            const values = result.results[0].returnValues;
            console.log(`📊 Return values for card ${cardId}:`, values);

            // Use the enhanced decoding functions with improved cleaning
            const name = safeDecodeText(values[0]?.[0]);
            const owner = bytesToHexAddress(values[1]?.[0]);
            const title = safeDecodeText(values[2]?.[0]);
            let imageUrl = safeDecodeUrl(values[3]?.[0]);
            const description = safeDecodeText(values[4]?.[0]);
            const yearsOfExperience = values[5]?.[0]
              ? parseInt(values[5][0].toString())
              : 0;
            const technologies = safeDecodeText(values[6]?.[0]);
            const portfolio = safeDecodeUrl(values[7]?.[0]);
            const contact = safeDecodeText(values[8]?.[0]);
            const openToWork = parseMoveBool(values[9]?.[0]);
            const isActive = parseMoveBool(values[10]?.[0]);

            // Walrus support: if on-chain imageUrl is empty, try constructing from walrus blob id
            const walrusBlobIdRaw = values[11]?.[0];
            const walrusBlobId = safeDecodeText(walrusBlobIdRaw);
            if ((!imageUrl || imageUrl.trim() === "") && walrusBlobId) {
              imageUrl = WalrusService.getBlobUrl(walrusBlobId);
            }

            console.log(`📝 Raw decoded data for card ${cardId}:`, {
              name,
              owner,
              title,
              imageUrl,
              description,
              yearsOfExperience,
              technologies,
              portfolio,
              contact,
              openToWork,
              isActive,
            });

            // Updated data parsing to match new contract structure
            const cardData: DevCardData = {
              id: cardId,
              name,
              owner,
              title,
              imageUrl,
              description,
              yearsOfExperience,
              technologies,
              portfolio,
              contact,
              openToWork,
              isActive,
            };

            // Validate required fields
            if (!cardData.name || !cardData.owner) {
              throw new Error(`Invalid card data for ID ${cardId}`);
            }

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

        const adminStatus = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.IS_ADMIN}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.address(address)],
          });

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender:
              "0x0000000000000000000000000000000000000000000000000000000000000000", // ✅ Neutral sender
          });

          console.log(`📥 Admin check result:`, result);

          if (result.results?.[0]?.returnValues?.[0]) {
            const [bytes] = result.results[0].returnValues[0];
            console.log(`📊 Raw bytes:`, bytes);

            // ✅ Proper boolean parsing
            let isAdminResult: boolean;
            if (Array.isArray(bytes)) {
              isAdminResult = bytes[0] === 1; // Move boolean is 1 for true, 0 for false
            } else {
              isAdminResult = bytes === 1 || bytes === true;
            }

            console.log(`👑 Admin status for ${address}:`, isAdminResult);
            return isAdminResult;
          }
          return false;
        });

        cacheRef.current.adminStatus.set(address, setCacheEntry(adminStatus));
        return adminStatus;
      } catch (err) {
        console.error(`❌ Error checking admin status:`, err);
        return false; // ✅ Always default to false on error
      }
    },
    [client, isCacheValid, setCacheEntry, withRetry],
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
            target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID)],
          });

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
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
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx,
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

  // Memoized return object to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      // State
      loading: state.loading,
      error: state.error,
      cardCount: state.cardCount,
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
    ],
  );

  return returnValue;
}
