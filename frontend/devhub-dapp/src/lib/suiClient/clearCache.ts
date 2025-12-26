/**
 * Utility functions to clear cache after package upgrades
 */

/**
 * Clear all DevHub-related cache from localStorage
 * Use this after package upgrades to ensure fresh data
 */
export function clearDevHubCache(): void {
  const keysToRemove: string[] = [];
  
  // Find all DevHub-related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('devhub_') ||
      key.startsWith('card_') ||
      key.startsWith('project_') ||
      key.startsWith('cache_') ||
      key.includes('cards') ||
      key.includes('projects')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Cleared cache: ${key}`);
  });
  
  console.log(`✅ Cleared ${keysToRemove.length} cache entries`);
}

/**
 * Clear cache but preserve upgrade-related IDs
 */
export function clearDataCachePreserveUpgradeInfo(): void {
  const upgradeKeys = [
    'devhub_upgrade_cap_id',
    'devhub_admin_cap_id',
    'devhub_package_id',
    'devhub_connection_store_id'
  ];
  
  const keysToPreserve = new Set(upgradeKeys);
  const keysToRemove: string[] = [];
  
  // Find all DevHub-related keys except upgrade info
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToPreserve.has(key) && (
      key.startsWith('devhub_') ||
      key.startsWith('card_') ||
      key.startsWith('project_') ||
      key.startsWith('cache_') ||
      key.includes('cards') ||
      key.includes('projects')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Cleared cache: ${key}`);
  });
  
  console.log(`✅ Cleared ${keysToRemove.length} data cache entries (preserved upgrade info)`);
}

