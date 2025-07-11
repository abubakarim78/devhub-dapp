import { useState, useCallback, useRef, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { DEVHUB_OBJECT_ID, PACKAGE_ID, CONTRACT_FUNCTIONS, DevCardData } from '../lib/suiClient';

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
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function useContract() {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  
  const [state, setState] = useState<UseContractState>({
    loading: false,
    error: null,
    cardCount: null,
    lastFetch: null,
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
  const isCacheValid = useCallback(<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> => {
    return entry !== null && Date.now() - entry.timestamp < entry.ttl;
  }, []);

  const setCacheEntry = useCallback(<T>(
    data: T,  // Remove key parameter since it's not being used
    ttl: number = CACHE_TTL
  ): CacheEntry<T> => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    return entry;
  }, []);

  // Enhanced error handling with retry logic
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }, []);

  // Optimized card count fetching with caching
  const getCardCount = useCallback(async (forceRefresh: boolean = false): Promise<number> => {
    const cached = cacheRef.current.cardCount; // This is fine, it's CacheEntry<number> | null
    
    if (!forceRefresh && isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const count = await withRetry(async () => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount?.address || '0x0',
        });

        if (result.results?.[0]?.returnValues?.[0]) {
          const [bytes] = result.results[0].returnValues[0];
          return parseInt(bytes.toString());
        }
        return 0;
      });

      cacheRef.current.cardCount = setCacheEntry(count);
      setState(prev => ({ ...prev, cardCount: count }));
      return count;
    } catch (err) {
      console.error('Error getting card count:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get card count';
      setState(prev => ({ ...prev, error: errorMessage }));
      return 0;
    }
  }, [client, currentAccount, isCacheValid, setCacheEntry, withRetry]);

  // Enhanced card info fetching with better error handling
  const getCardInfo = useCallback(async (cardId: number, forceRefresh: boolean = false): Promise<DevCardData | null> => {
    const cached = cacheRef.current.cards.get(cardId) || null; // Convert undefined to null
    
    if (!forceRefresh && isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const cardData = await withRetry(async () => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.u64(cardId)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount?.address || '0x0',
        });

        if (result.results?.[0]?.returnValues) {
          const values = result.results[0].returnValues;
          
          // Enhanced data parsing with validation
          const cardData: DevCardData = {
            id: cardId,
            name: values[0]?.[0] ? new TextDecoder().decode(new Uint8Array(values[0][0])) : '',
            owner: values[1]?.[0] ? values[1][0].toString() : '',
            title: values[2]?.[0] ? new TextDecoder().decode(new Uint8Array(values[2][0])) : '',
            imageUrl: values[3]?.[0] ? new TextDecoder().decode(new Uint8Array(values[3][0])) : '',
            description: values[4]?.[0] ? new TextDecoder().decode(new Uint8Array(values[4][0])) : undefined,
            yearsOfExperience: values[5]?.[0] ? parseInt(values[5][0].toString()) : 0,
            technologies: values[6]?.[0] ? new TextDecoder().decode(new Uint8Array(values[6][0])) : '',
            portfolio: values[7]?.[0] ? new TextDecoder().decode(new Uint8Array(values[7][0])) : '',
            contact: values[8]?.[0] ? new TextDecoder().decode(new Uint8Array(values[8][0])) : '',
            openToWork: values[9]?.[0] ? Boolean(values[9][0]) : false,
            skills: values[10] ? values[10].map((skill: any) => 
              new TextDecoder().decode(new Uint8Array(skill))
            ) : [],
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
      console.error(`Error getting card info for ID ${cardId}:`, err);
      return null;
    }
  }, [client, currentAccount, isCacheValid, setCacheEntry, withRetry]);

  // Optimized batch fetching with better concurrency control
  const batchFetchCards = useCallback(async (
    cardIds: number[],
    forceRefresh: boolean = false
  ): Promise<DevCardData[]> => {
    const results: DevCardData[] = [];
    const uncachedIds: number[] = [];

   // Fix: Add || null to convert undefined to null
for (const cardId of cardIds) {
  const cached = cacheRef.current.cards.get(cardId) || null; // Convert undefined to null
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
        batch.map(id => getCardInfo(id, forceRefresh))
      ).then(batchResults => 
        batchResults.filter((card): card is DevCardData => card !== null)
      );
      
      batchPromises.push(batchPromise);
    }

    try {
      const batchResults = await Promise.all(batchPromises);
      const newCards = batchResults.flat();
      results.push(...newCards);
      
      return results.sort((a, b) => a.id - b.id);
    } catch (err) {
      console.error('Error in batch fetch:', err);
      throw err;
    }
  }, [getCardInfo, isCacheValid]);

  // Enhanced getAllCards with progress tracking
  const getAllCards = useCallback(async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const count = await getCardCount(forceRefresh);
      if (count === 0) {
        setState(prev => ({ ...prev, loading: false }));
        return [];
      }

      const cardIds = Array.from({ length: count }, (_, i) => i + 1);
      const cards = await batchFetchCards(cardIds, forceRefresh);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        lastFetch: Date.now(),
        error: null 
      }));
      
      return cards;
    } catch (err) {
      console.error('Error getting all cards:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get all cards';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return [];
    }
  }, [getCardCount, batchFetchCards]);

  // Significantly improved getUserCards with smart caching
  const getUserCards = useCallback(async (
    userAddress: string,
    forceRefresh: boolean = false
  ): Promise<DevCardData[]> => {
    if (!userAddress) {
      return [];
    }

    const cached = cacheRef.current.userCards.get(userAddress) || null; // Convert undefined to null
  
    if (!forceRefresh && isCacheValid(cached)) {
      return cached.data;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Strategy 1: Try to get user cards from existing cache first
      const allCachedCards = Array.from(cacheRef.current.cards.values())
        .filter(entry => isCacheValid(entry))
        .map(entry => entry.data)
        .filter(card => card.owner === userAddress);

      // If we have cached cards and they're recent, use them
      if (allCachedCards.length > 0 && !forceRefresh) {
        const userCards = allCachedCards.sort((a, b) => a.id - b.id);
        cacheRef.current.userCards.set(userAddress, setCacheEntry(userCards));
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          lastFetch: Date.now(),
          error: null 
        }));
        
        return userCards;
      }

      // Strategy 2: Fetch all cards and filter (more efficient for small datasets)
      const count = await getCardCount(forceRefresh);
      if (count === 0) {
        const emptyResult: DevCardData[] = [];
        cacheRef.current.userCards.set(userAddress, setCacheEntry(emptyResult));
        
        setState(prev => ({ ...prev, loading: false }));
        return emptyResult;
      }

      // For better performance, we'll fetch cards in smaller batches
      // and filter as we go, allowing early termination if needed
      const userCards: DevCardData[] = [];
      const totalBatches = Math.ceil(count / BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startId = batchIndex * BATCH_SIZE + 1;
        const endId = Math.min(startId + BATCH_SIZE - 1, count);
        const batchIds = Array.from({ length: endId - startId + 1 }, (_, i) => startId + i);
        
        try {
          const batchCards = await batchFetchCards(batchIds, forceRefresh);
          const userCardsInBatch = batchCards.filter(card => card.owner === userAddress);
          userCards.push(...userCardsInBatch);
        } catch (err) {
          console.warn(`Error fetching batch ${batchIndex + 1}:`, err);
          // Continue with other batches
        }
      }

      const sortedUserCards = userCards.sort((a, b) => a.id - b.id);
      cacheRef.current.userCards.set(userAddress, setCacheEntry(sortedUserCards));
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        lastFetch: Date.now(),
        error: null 
      }));
      
      return sortedUserCards;
    } catch (err) {
      console.error('Error getting user cards:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user cards';
      
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return [];
    }
  }, [getCardCount, batchFetchCards, isCacheValid, setCacheEntry]);

  // Enhanced admin check with caching
  const isAdmin = useCallback(async (address: string, forceRefresh: boolean = false): Promise<boolean> => {
    const cached = cacheRef.current.adminStatus.get(address) || null; // Convert undefined to null
    
    if (!forceRefresh && isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const adminStatus = await withRetry(async () => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.IS_ADMIN}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.address(address)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount?.address || '0x0',
        });

        if (result.results?.[0]?.returnValues?.[0]) {
          return Boolean(result.results[0].returnValues[0][0]);
        }
        return false;
      });

      cacheRef.current.adminStatus.set(address, setCacheEntry(adminStatus));
      return adminStatus;
    } catch (err) {
      console.error('Error checking admin status:', err);
      setState(prev => ({ ...prev, error: 'Failed to check admin status' }));
      return false;
    }
  }, [client, currentAccount, isCacheValid, setCacheEntry, withRetry]);

  // Enhanced platform fee balance with caching
  const getPlatformFeeBalance = useCallback(async (forceRefresh: boolean = false): Promise<number> => {
    const cached = cacheRef.current.platformFeeBalance;
    
    if (!forceRefresh && isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const balance = await withRetry(async () => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount?.address || '0x0',
        });

        if (result.results?.[0]?.returnValues?.[0]) {
          const [bytes] = result.results[0].returnValues[0];
          return parseInt(bytes.toString());
        }
        return 0;
      });

      cacheRef.current.platformFeeBalance = setCacheEntry(balance);
      return balance;
    } catch (err) {
      console.error('Error getting platform fee balance:', err);
      setState(prev => ({ ...prev, error: 'Failed to get platform fee balance' }));
      return 0;
    }
  }, [client, currentAccount, isCacheValid, setCacheEntry, withRetry]);

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
    
    setState(prev => ({ ...prev, error: null, lastFetch: null }));
  }, []);

  // Enhanced cache update methods
  const updateCardInCache = useCallback((cardId: number, updatedCard: DevCardData) => {
    cacheRef.current.cards.set(cardId, setCacheEntry(updatedCard));
    
    // Update user-specific cache
    cacheRef.current.userCards.forEach((entry, userAddress) => {
      if (isCacheValid(entry)) {
        const updatedUserCards = entry.data.map(card => 
          card.id === cardId ? updatedCard : card
        );
        cacheRef.current.userCards.set(userAddress, setCacheEntry(updatedUserCards));
      }
    });
  }, [setCacheEntry, isCacheValid]);

  const addCardToUserCache = useCallback((userAddress: string, newCard: DevCardData) => {
    // Add to individual card cache
    cacheRef.current.cards.set(newCard.id, setCacheEntry(newCard));
    
    // Add to user-specific cache
    const userCacheEntry = cacheRef.current.userCards.get(userAddress);
    if (userCacheEntry && isCacheValid(userCacheEntry)) {
      const updatedUserCards = [...userCacheEntry.data, newCard].sort((a, b) => a.id - b.id);
      cacheRef.current.userCards.set(userAddress, setCacheEntry(updatedUserCards));
    }
    
    // Invalidate card count cache
    cacheRef.current.cardCount = null;
  }, [setCacheEntry, isCacheValid]);

  const removeCardFromCache = useCallback((cardId: number, userAddress: string) => {
    // Remove from individual card cache
    cacheRef.current.cards.delete(cardId);
    
    // Remove from user-specific cache
    const userCacheEntry = cacheRef.current.userCards.get(userAddress);
    if (userCacheEntry && isCacheValid(userCacheEntry)) {
      const filteredUserCards = userCacheEntry.data.filter(card => card.id !== cardId);
      cacheRef.current.userCards.set(userAddress, setCacheEntry(filteredUserCards));
    }
    
    // Invalidate card count cache
    cacheRef.current.cardCount = null;
  }, [setCacheEntry, isCacheValid]);

  // Cache statistics for debugging
  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const stats = {
      totalCards: cacheRef.current.cards.size,
      validCards: Array.from(cacheRef.current.cards.values()).filter(entry => 
        now - entry.timestamp < entry.ttl
      ).length,
      totalUserCaches: cacheRef.current.userCards.size,
      validUserCaches: Array.from(cacheRef.current.userCards.values()).filter(entry => 
        now - entry.timestamp < entry.ttl
      ).length,
      hasCardCount: cacheRef.current.cardCount !== null,
      cardCountValid: cacheRef.current.cardCount ? 
        now - cacheRef.current.cardCount.timestamp < cacheRef.current.cardCount.ttl : false,
    };
    return stats;
  }, []);

  // Error state setter for external use
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Memoized return object to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    // State
    loading: state.loading,
    error: state.error,
    cardCount: state.cardCount,
    lastFetch: state.lastFetch,
    
    // Core functions
    getCardCount,
    getCardInfo,
    getAllCards,
    getUserCards,
    isAdmin,
    getPlatformFeeBalance,
    
    // Cache management
    clearCache,
    updateCardInCache,
    addCardToUserCache,
    removeCardFromCache,
    getCacheStats,
    
    // Utility
    setError,
  }), [
    state,
    getCardCount,
    getCardInfo,
    getAllCards,
    getUserCards,
    isAdmin,
    getPlatformFeeBalance,
    clearCache,
    updateCardInCache,
    addCardToUserCache,
    removeCardFromCache,
    getCacheStats,
    setError,
  ]);

  return returnValue;
}