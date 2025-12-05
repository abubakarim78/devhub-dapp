import { useCallback, useEffect, useRef } from 'react';
import { localStorageCache, CacheKeys, CacheTTL } from '../lib/cache/localStorageCache';

/**
 * Hook for persistent caching with localStorage
 * Integrates with existing in-memory cache for optimal performance
 */
export function usePersistentCache() {
  const cacheInitialized = useRef(false);

  // Initialize cache cleanup on mount
  useEffect(() => {
    if (!cacheInitialized.current) {
      // Clear expired entries on app start
      localStorageCache.clearExpired();
      cacheInitialized.current = true;
    }
  }, []);

  /**
   * Get cached data with fallback
   */
  const getCached = useCallback(<T,>(
    key: string
  ): T | null => {
    return localStorageCache.get<T>(key);
  }, []);

  /**
   * Set cached data
   */
  const setCached = useCallback(<T,>(
    key: string,
    data: T,
    ttl?: number
  ): void => {
    localStorageCache.set(key, data, ttl);
  }, []);

  /**
   * Invalidate cache for a specific key
   */
  const invalidate = useCallback((key: string): void => {
    localStorageCache.delete(key);
  }, []);

  /**
   * Invalidate cache for a pattern (e.g., all cards)
   */
  const invalidatePattern = useCallback((pattern: string): void => {
    localStorageCache.clearPattern(pattern);
  }, []);

  /**
   * Clear all cache
   */
  const clearAll = useCallback((): void => {
    localStorageCache.clear();
  }, []);

  /**
   * Cache cards data
   */
  const cacheCards = useCallback((cards: any[], ttl?: number): void => {
    setCached(CacheKeys.allCards(), cards, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached cards
   */
  const getCachedCards = useCallback((): any[] | null => {
    return getCached<any[]>(CacheKeys.allCards());
  }, [getCached]);

  /**
   * Cache user cards
   */
  const cacheUserCards = useCallback((address: string, cards: any[], ttl?: number): void => {
    setCached(CacheKeys.userCards(address), cards, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached user cards
   */
  const getCachedUserCards = useCallback((address: string): any[] | null => {
    return getCached<any[]>(CacheKeys.userCards(address));
  }, [getCached]);

  /**
   * Cache projects
   */
  const cacheProjects = useCallback((projects: any[], ttl?: number): void => {
    setCached(CacheKeys.allProjects(), projects, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached projects
   */
  const getCachedProjects = useCallback((): any[] | null => {
    return getCached<any[]>(CacheKeys.allProjects());
  }, [getCached]);

  /**
   * Cache user projects
   */
  const cacheUserProjects = useCallback((address: string, projects: any[], ttl?: number): void => {
    setCached(CacheKeys.userProjects(address), projects, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached user projects
   */
  const getCachedUserProjects = useCallback((address: string): any[] | null => {
    return getCached<any[]>(CacheKeys.userProjects(address));
  }, [getCached]);

  /**
   * Cache conversations
   */
  const cacheConversations = useCallback((address: string, conversations: any[], ttl?: number): void => {
    setCached(CacheKeys.conversations(address), conversations, ttl || CacheTTL.short);
  }, [setCached]);

  /**
   * Get cached conversations
   */
  const getCachedConversations = useCallback((address: string): any[] | null => {
    return getCached<any[]>(CacheKeys.conversations(address));
  }, [getCached]);

  /**
   * Cache messages for a conversation
   */
  const cacheMessages = useCallback((conversationId: string, messages: any[], ttl?: number): void => {
    setCached(CacheKeys.messages(conversationId), messages, ttl || CacheTTL.short);
  }, [setCached]);

  /**
   * Get cached messages
   */
  const getCachedMessages = useCallback((conversationId: string): any[] | null => {
    return getCached<any[]>(CacheKeys.messages(conversationId));
  }, [getCached]);

  /**
   * Cache connections
   */
  const cacheConnections = useCallback((address: string, connections: any[], ttl?: number): void => {
    setCached(CacheKeys.connections(address), connections, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached connections
   */
  const getCachedConnections = useCallback((address: string): any[] | null => {
    return getCached<any[]>(CacheKeys.connections(address));
  }, [getCached]);

  /**
   * Cache proposals
   */
  const cacheProposals = useCallback((address: string, proposals: any[], ttl?: number): void => {
    setCached(CacheKeys.proposals(address), proposals, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached proposals
   */
  const getCachedProposals = useCallback((address: string): any[] | null => {
    return getCached<any[]>(CacheKeys.proposals(address));
  }, [getCached]);

  /**
   * Cache dashboard stats
   */
  const cacheDashboardStats = useCallback((address: string, stats: any, ttl?: number): void => {
    setCached(CacheKeys.dashboardStats(address), stats, ttl || CacheTTL.short);
  }, [setCached]);

  /**
   * Get cached dashboard stats
   */
  const getCachedDashboardStats = useCallback((address: string): any | null => {
    return getCached<any>(CacheKeys.dashboardStats(address));
  }, [getCached]);

  /**
   * Cache dashboard activities
   */
  const cacheDashboardActivities = useCallback((address: string, activities: any[], ttl?: number): void => {
    setCached(CacheKeys.dashboardActivities(address), activities, ttl || CacheTTL.short);
  }, [setCached]);

  /**
   * Get cached dashboard activities
   */
  const getCachedDashboardActivities = useCallback((address: string): any[] | null => {
    return getCached<any[]>(CacheKeys.dashboardActivities(address));
  }, [getCached]);

  /**
   * Cache admin status
   */
  const cacheAdminStatus = useCallback((address: string, isAdmin: boolean, ttl?: number): void => {
    setCached(CacheKeys.adminStatus(address), isAdmin, ttl || CacheTTL.long);
  }, [setCached]);

  /**
   * Get cached admin status
   */
  const getCachedAdminStatus = useCallback((address: string): boolean | null => {
    return getCached<boolean>(CacheKeys.adminStatus(address));
  }, [getCached]);

  /**
   * Cache platform stats
   */
  const cachePlatformStats = useCallback((stats: any, ttl?: number): void => {
    setCached(CacheKeys.platformStats(), stats, ttl || CacheTTL.medium);
  }, [setCached]);

  /**
   * Get cached platform stats
   */
  const getCachedPlatformStats = useCallback((): any | null => {
    return getCached<any>(CacheKeys.platformStats());
  }, [getCached]);

  /**
   * Invalidate all cards cache
   */
  const invalidateCards = useCallback((): void => {
    invalidatePattern('cards:');
  }, [invalidatePattern]);

  /**
   * Invalidate all projects cache
   */
  const invalidateProjects = useCallback((): void => {
    invalidatePattern('projects:');
  }, [invalidatePattern]);

  /**
   * Invalidate all messages cache
   */
  const invalidateMessages = useCallback((): void => {
    invalidatePattern('messages:');
  }, [invalidatePattern]);

  /**
   * Invalidate user-specific cache
   */
  const invalidateUserCache = useCallback((address: string): void => {
    invalidate(CacheKeys.userCards(address));
    invalidate(CacheKeys.userProjects(address));
    invalidate(CacheKeys.conversations(address));
    invalidate(CacheKeys.connections(address));
    invalidate(CacheKeys.proposals(address));
    invalidate(CacheKeys.dashboardStats(address));
    invalidate(CacheKeys.dashboardActivities(address));
  }, [invalidate]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return localStorageCache.getStats();
  }, []);

  return {
    // Generic cache methods
    getCached,
    setCached,
    invalidate,
    invalidatePattern,
    clearAll,

    // Cards
    cacheCards,
    getCachedCards,
    cacheUserCards,
    getCachedUserCards,
    invalidateCards,

    // Projects
    cacheProjects,
    getCachedProjects,
    cacheUserProjects,
    getCachedUserProjects,
    invalidateProjects,

    // Messages
    cacheConversations,
    getCachedConversations,
    cacheMessages,
    getCachedMessages,
    invalidateMessages,

    // Connections
    cacheConnections,
    getCachedConnections,

    // Proposals
    cacheProposals,
    getCachedProposals,

    // Dashboard
    cacheDashboardStats,
    getCachedDashboardStats,
    cacheDashboardActivities,
    getCachedDashboardActivities,

    // Admin
    cacheAdminStatus,
    getCachedAdminStatus,
    cachePlatformStats,
    getCachedPlatformStats,

    // Utilities
    invalidateUserCache,
    getCacheStats,
  };
}
