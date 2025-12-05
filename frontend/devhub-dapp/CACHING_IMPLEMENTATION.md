# Caching Implementation Guide

## Overview

This document describes the localStorage-based caching system implemented to optimize page navigation and reduce data refetching across the TumaHub application.

## Architecture

The caching system consists of three main components:

1. **localStorageCache** (`src/lib/cache/localStorageCache.ts`)
   - Core caching utility with TTL (Time To Live) support
   - Handles localStorage operations with error handling
   - Automatic cache expiration and cleanup

2. **usePersistentCache** (`src/hooks/usePersistentCache.ts`)
   - React hook providing high-level cache operations
   - Type-safe cache methods for different data types
   - Cache invalidation utilities

3. **useCachedData** (`src/hooks/useCachedData.ts`)
   - Hook for automatic cache-first data fetching
   - Background refresh support
   - Fallback to cached data on errors

## Cache TTL Configuration

- **short**: 1 minute - For frequently changing data (messages, activities)
- **medium**: 5 minutes - Default for most data (cards, projects, connections)
- **long**: 15 minutes - For semi-static data (admin status)
- **veryLong**: 30 minutes - For rarely changing data
- **static**: 1 hour - For static configuration data

## Usage Examples

### Basic Usage in Components

```typescript
import { usePersistentCache } from '@/hooks/usePersistentCache';
import { CacheKeys, CacheTTL } from '@/lib/cache/localStorageCache';

function MyComponent() {
  const persistentCache = usePersistentCache();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Check cache first
    const cached = persistentCache.getCachedCards();
    if (cached) {
      setData(cached);
      // Fetch fresh in background
      fetchFreshData().then(fresh => {
        persistentCache.cacheCards(fresh);
        setData(fresh);
      });
    } else {
      // No cache, fetch fresh
      fetchFreshData().then(fresh => {
        persistentCache.cacheCards(fresh);
        setData(fresh);
      });
    }
  }, []);
}
```

### Using useCachedData Hook

```typescript
import { useCachedData } from '@/hooks/useCachedData';
import { CacheKeys, CacheTTL } from '@/lib/cache/localStorageCache';

function MyComponent() {
  const { data, loading, error, refresh } = useCachedData(
    CacheKeys.allCards(),
    () => getAllCards(),
    { ttl: CacheTTL.medium }
  );

  // data is automatically loaded from cache first, then refreshed in background
}
```

## Cache Keys

All cache keys are generated using the `CacheKeys` utility:

- `CacheKeys.allCards()` - All professional profiles
- `CacheKeys.card(id)` - Specific profile by ID
- `CacheKeys.userCards(address)` - User's profiles
- `CacheKeys.allProjects()` - All projects
- `CacheKeys.userProjects(address)` - User's projects
- `CacheKeys.conversations(address)` - User's conversations
- `CacheKeys.messages(conversationId)` - Messages for a conversation
- `CacheKeys.connections(address)` - User's connections
- `CacheKeys.dashboardStats(address)` - Dashboard statistics
- `CacheKeys.dashboardActivities(address)` - Dashboard activities
- `CacheKeys.adminStatus(address)` - Admin status
- `CacheKeys.platformStats()` - Platform statistics

## Cache Invalidation

### Manual Invalidation

```typescript
// Invalidate specific cache
persistentCache.invalidate(CacheKeys.allCards());

// Invalidate pattern (all cards)
persistentCache.invalidatePattern('cards:');

// Invalidate all user-specific cache
persistentCache.invalidateUserCache(userAddress);

// Clear all cache
persistentCache.clearAll();
```

### Automatic Invalidation

Cache is automatically invalidated when:
- Data is updated (e.g., after creating/updating a card)
- User logs out
- Cache TTL expires

## Implementation Status

### ✅ Completed
- Core caching infrastructure
- Dashboard page caching (stats, activities, user cards)
- Browse page caching (all cards)
- Cache persistence across page navigations
- Automatic cache expiration

### 🔄 In Progress
- Admin pages caching
- SuperAdmin pages caching
- Messages page caching
- Projects page caching
- Connections page caching

### 📋 To Do
- Add cache invalidation on mutations
- Implement cache versioning
- Add cache size monitoring
- Optimize cache for large datasets

## Best Practices

1. **Always check cache first** - Use cached data for instant UI updates
2. **Fetch fresh in background** - Update cache with fresh data asynchronously
3. **Set appropriate TTL** - Match TTL to data change frequency
4. **Invalidate on mutations** - Clear relevant cache when data changes
5. **Handle errors gracefully** - Fall back to cached data if fetch fails

## Performance Benefits

- **Instant page loads** - Cached data displays immediately
- **Reduced API calls** - Less blockchain queries
- **Better UX** - No loading spinners for cached data
- **Offline support** - Cached data available when offline
- **Bandwidth savings** - Less data transfer

## Monitoring

Cache statistics are available via:

```typescript
const stats = persistentCache.getCacheStats();
// Returns: { totalEntries, validEntries, expiredEntries, totalSize }
```

## Troubleshooting

### Cache not working
- Check browser localStorage is enabled
- Verify cache keys are correct
- Check TTL hasn't expired
- Clear cache and retry: `persistentCache.clearAll()`

### Stale data
- Reduce TTL for frequently changing data
- Add cache invalidation on mutations
- Force refresh: `useCachedData(..., { forceRefresh: true })`

### localStorage quota exceeded
- Cache automatically clears old entries
- Reduce cache TTL to expire entries faster
- Clear cache manually if needed
