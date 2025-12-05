/**
 * localStorage-based cache utility with TTL (Time To Live) support
 * Provides persistent caching across page navigations
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheConfig {
  defaultTTL?: number; // Default TTL in milliseconds
  prefix?: string; // Prefix for localStorage keys
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'tumahub_cache_';

class LocalStorageCache {
  private prefix: string;
  private defaultTTL: number;

  constructor(config: CacheConfig = {}) {
    this.prefix = config.prefix || CACHE_PREFIX;
    this.defaultTTL = config.defaultTTL || DEFAULT_TTL;
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      // Check if cache is expired
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Error reading cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };

      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old cache entries');
        this.clearOldEntries();
        // Retry once
        try {
          localStorage.setItem(
            `${this.prefix}${key}`,
            JSON.stringify({
              data,
              timestamp: Date.now(),
              ttl: ttl || this.defaultTTL,
            })
          );
        } catch (retryError) {
          console.error('Failed to cache after clearing old entries:', retryError);
        }
      } else {
        console.error(`Error setting cache for key ${key}:`, error);
      }
    }
  }

  /**
   * Delete a cached value
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear cache entries for a specific pattern
   */
  clearPattern(pattern: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(`${this.prefix}${pattern}`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Error clearing cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry: CacheEntry<any> = JSON.parse(item);
              if (now - entry.timestamp > entry.ttl) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // If we can't parse, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Clear old entries to free up space (keeps most recent 50% of entries)
   */
  private clearOldEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheEntries: Array<{ key: string; timestamp: number }> = [];

      // Collect all cache entries with timestamps
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry: CacheEntry<any> = JSON.parse(item);
              cacheEntries.push({
                key,
                timestamp: entry.timestamp,
              });
            }
          } catch (error) {
            // Remove invalid entries
            localStorage.removeItem(key);
          }
        }
      });

      // Sort by timestamp (oldest first)
      cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 50%
      const entriesToRemove = Math.floor(cacheEntries.length / 2);
      for (let i = 0; i < entriesToRemove; i++) {
        localStorage.removeItem(cacheEntries[i].key);
      }
    } catch (error) {
      console.error('Error clearing old cache entries:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    totalSize: number;
  } {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      let validEntries = 0;
      let expiredEntries = 0;
      let totalSize = 0;

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              totalSize += item.length;
              const entry: CacheEntry<any> = JSON.parse(item);
              if (now - entry.timestamp > entry.ttl) {
                expiredEntries++;
              } else {
                validEntries++;
              }
            }
          } catch (error) {
            expiredEntries++;
          }
        }
      });

      return {
        totalEntries: validEntries + expiredEntries,
        validEntries,
        expiredEntries,
        totalSize,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
      };
    }
  }
}

// Export singleton instance
export const localStorageCache = new LocalStorageCache({
  defaultTTL: DEFAULT_TTL,
  prefix: CACHE_PREFIX,
});

// Cache key generators
export const CacheKeys = {
  // Cards
  allCards: () => 'cards:all',
  card: (id: number) => `cards:${id}`,
  userCards: (address: string) => `cards:user:${address}`,
  cardCount: () => 'cards:count',

  // Projects
  allProjects: () => 'projects:all',
  project: (id: number) => `projects:${id}`,
  userProjects: (address: string) => `projects:user:${address}`,
  projectCount: () => 'projects:count',

  // Messages
  conversations: (address: string) => `messages:conversations:${address}`,
  messages: (conversationId: string) => `messages:${conversationId}`,

  // Connections
  connections: (address: string) => `connections:${address}`,

  // Proposals
  proposals: (address: string) => `proposals:${address}`,
  proposal: (id: string) => `proposals:${id}`,

  // Admin
  adminStatus: (address: string) => `admin:status:${address}`,
  platformStats: () => 'admin:platform:stats',
  platformFees: () => 'admin:platform:fees',

  // Search
  searchResults: (query: string) => `search:${query}`,

  // Dashboard
  dashboardStats: (address: string) => `dashboard:stats:${address}`,
  dashboardActivities: (address: string) => `dashboard:activities:${address}`,
};

// TTL configurations (in milliseconds)
export const CacheTTL = {
  short: 1 * 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes (default)
  long: 15 * 60 * 1000, // 15 minutes
  veryLong: 30 * 60 * 1000, // 30 minutes
  // Static data that rarely changes
  static: 60 * 60 * 1000, // 1 hour
};
