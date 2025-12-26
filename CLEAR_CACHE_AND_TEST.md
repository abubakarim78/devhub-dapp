# Fix: Data Not Displaying After Upgrade

## Quick Fix: Clear Cache

The most common issue after an upgrade is stale cache. Try this:

### Option 1: Clear Cache from Browser Console

Open your browser console (F12) and run:

```javascript
// Clear all DevHub cache
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.startsWith('devhub_') || key.startsWith('card_') || key.includes('cards'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => {
  if (!key.includes('upgrade_cap') && !key.includes('admin_cap') && !key.includes('package_id')) {
    localStorage.removeItem(key);
    console.log('Cleared:', key);
  }
});
location.reload();
```

### Option 2: Use the Clear Cache Function

Import and use in your code:

```typescript
import { clearDataCachePreserveUpgradeInfo } from './lib/suiClient/clearCache';

// Clear cache but keep upgrade info
clearDataCachePreserveUpgradeInfo();
```

## Verify Data Exists On-Chain

Run this command to check if data exists:

```bash
sui client call \
  --package 0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2 \
  --module devhub \
  --function get_card_count \
  --args 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40 \
  --gas-budget 10000000
```

This should return the actual card count if data exists.

## Check Version Compatibility

Verify versions match:

```bash
# Check package version
sui client call \
  --package 0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2 \
  --module devhub \
  --function get_package_version \
  --gas-budget 10000000

# Check DevHub version
sui client call \
  --package 0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2 \
  --module devhub \
  --function get_version \
  --args 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40 \
  --gas-budget 10000000
```

Both should return `2` after successful migration.

## Common Issues

### Issue: Version Mismatch

If you get `E_WRONG_VERSION`, run migration again:

```bash
sui client call \
  --package 0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2 \
  --module devhub \
  --function migrate \
  --args 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40 \
        0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c \
  --gas-budget 10000000
```

### Issue: Object Type References Old Package

**This is normal!** The DevHub object's type will always show the original package ID:
- Type: `0x43096e49e837fdf621305180a32f20c8ce8526583dbd363d05aeb852cb3693cb::devhub::DevHub`

This doesn't prevent access. Sui allows using shared objects from older packages with newer package versions as long as the struct layout is compatible.

## Next Steps

1. Clear the cache using Option 1 or 2 above
2. Refresh your browser
3. Check the browser console for any errors
4. If data still doesn't appear, verify it exists on-chain using the commands above

