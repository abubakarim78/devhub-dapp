import { useRef, useCallback, useEffect } from "react";
import type { DevCardData, Project, ProjectApplication, Proposal, Conversation, Connection, Message } from "../lib/suiClient";
import { CacheEntry } from "./useContractUtils";
import { localStorageCache, CacheKeys, CacheTTL } from "../lib/cache/localStorageCache";

// Cache reference type
export interface ContractCacheRef {
  cards: Map<number, CacheEntry<DevCardData>>;
  userCards: Map<string, CacheEntry<DevCardData[]>>;
  projects: Map<number, CacheEntry<Project>>;
  projectApplications: Map<number, CacheEntry<ProjectApplication[]>>;
  proposals: Map<string, CacheEntry<Proposal>>;
  conversations: Map<string, CacheEntry<Conversation[]>>;
  connections: Map<string, CacheEntry<Connection[]>>;
  messages: Map<string, CacheEntry<Message[]>>;
  cardCount: CacheEntry<number> | null;
  projectCount: CacheEntry<number> | null;
  platformFeeBalance: CacheEntry<number> | null;
  adminStatus: Map<string, CacheEntry<boolean>>;
  searchResults: Map<string, CacheEntry<number[]>>;
}

// Initialize cache reference
export const useContractCache = () => {
  const cacheRef = useRef<ContractCacheRef>({
    cards: new Map<number, CacheEntry<DevCardData>>(),
    userCards: new Map<string, CacheEntry<DevCardData[]>>(),
    projects: new Map<number, CacheEntry<Project>>(),
    projectApplications: new Map<number, CacheEntry<ProjectApplication[]>>(),
    proposals: new Map<string, CacheEntry<Proposal>>(),
    conversations: new Map<string, CacheEntry<Conversation[]>>(),
    connections: new Map<string, CacheEntry<Connection[]>>(),
    messages: new Map<string, CacheEntry<Message[]>>(),
    cardCount: null,
    projectCount: null,
    platformFeeBalance: null,
    adminStatus: new Map<string, CacheEntry<boolean>>(),
    searchResults: new Map<string, CacheEntry<number[]>>(),
  });

  // Load persistent cache on mount
  useEffect(() => {
    try {
      // Load all cards from localStorage
      const cachedCards = localStorageCache.get<DevCardData[]>(CacheKeys.allCards());
      if (cachedCards && Array.isArray(cachedCards)) {
        cachedCards.forEach((card) => {
          if (card.id !== undefined) {
            cacheRef.current.cards.set(card.id, {
              data: card,
              timestamp: Date.now(),
              ttl: CacheTTL.medium,
            });
          }
        });
      }

      // Load card count
      const cachedCount = localStorageCache.get<number>(CacheKeys.cardCount());
      if (cachedCount !== null) {
        cacheRef.current.cardCount = {
          data: cachedCount,
          timestamp: Date.now(),
          ttl: CacheTTL.medium,
        };
      }
    } catch (error) {
      console.error('Error loading persistent cache:', error);
    }
  }, []);

  // Enhanced cache management
  const clearCache = useCallback((userAddress?: string) => {
    if (userAddress) {
      // Clear cache for specific user (both in-memory and localStorage)
      cacheRef.current.userCards.delete(userAddress);
      cacheRef.current.adminStatus.delete(userAddress);
      localStorageCache.delete(CacheKeys.userCards(userAddress));
      localStorageCache.delete(CacheKeys.adminStatus(userAddress));
      localStorageCache.delete(CacheKeys.dashboardStats(userAddress));
      localStorageCache.delete(CacheKeys.dashboardActivities(userAddress));
    } else {
      // Clear all cache (both in-memory and localStorage)
      cacheRef.current.cards.clear();
      cacheRef.current.userCards.clear();
      cacheRef.current.adminStatus.clear();
      cacheRef.current.cardCount = null;
      cacheRef.current.platformFeeBalance = null;
      cacheRef.current.projects.clear();
      cacheRef.current.projectApplications.clear();
      cacheRef.current.proposals.clear();
      cacheRef.current.conversations.clear();
      cacheRef.current.connections.clear();
      cacheRef.current.messages.clear();
      cacheRef.current.searchResults.clear();
      
      // Clear localStorage cache
      localStorageCache.clear();
    }
  }, []);

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

  return {
    cacheRef,
    clearCache,
    getCacheStats,
  };
};

