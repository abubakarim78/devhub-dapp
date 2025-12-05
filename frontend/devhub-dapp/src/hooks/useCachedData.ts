import { useState, useEffect, useCallback } from 'react';
import { usePersistentCache } from './usePersistentCache';
import { CacheTTL } from '../lib/cache/localStorageCache';

/**
 * Hook for fetching and caching data with automatic cache management
 * Returns cached data immediately if available, then fetches fresh data in background
 */
export function useCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    forceRefresh?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { getCached, setCached } = usePersistentCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { ttl = CacheTTL.medium, forceRefresh = false, enabled = true } = options;

  const loadData = useCallback(async (skipCache = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      // Try to get from cache first (unless force refresh or skip cache)
      if (!skipCache && !forceRefresh) {
        const cached = getCached<T>(cacheKey);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          setError(null);
          
          // Fetch fresh data in background
          try {
            const freshData = await fetchFn();
            setCached(cacheKey, freshData, ttl);
            setData(freshData);
          } catch (err) {
            console.warn(`Background refresh failed for ${cacheKey}:`, err);
            // Keep using cached data if background refresh fails
          }
          return;
        }
      }

      // No cache or force refresh - fetch fresh data
      setLoading(true);
      const freshData = await fetchFn();
      setCached(cacheKey, freshData, ttl);
      setData(freshData);
      setError(null);
    } catch (err) {
      console.error(`Error fetching data for ${cacheKey}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Try to use cached data as fallback
      if (!forceRefresh) {
        const cached = getCached<T>(cacheKey);
        if (cached !== null) {
          setData(cached);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ttl, forceRefresh, enabled, getCached, setCached]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return { data, loading, error, refresh };
}

/**
 * Hook for caching array data with automatic updates
 */
export function useCachedArray<T>(
  cacheKey: string,
  fetchFn: () => Promise<T[]>,
  options: {
    ttl?: number;
    forceRefresh?: boolean;
    enabled?: boolean;
  } = {}
) {
  const result = useCachedData<T[]>(cacheKey, fetchFn, options);
  return {
    ...result,
    data: result.data || [],
  };
}
