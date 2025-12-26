# Diagnosing Missing Data After Upgrade

## Quick Checks

1. **Check if the DevHub object exists and has data:**
```bash
sui client object 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40
```

2. **Check the object type** - it should show the original package ID in the type:
   - Type should be: `0x43096e49e837fdf621305180a32f20c8ce8526583dbd363d05aeb852cb3693cb::devhub::DevHub`
   - This is normal! The object type includes the original package ID.

3. **Try calling a function directly:**
```bash
sui client call \
  --package 0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2 \
  --module devhub \
  --function get_card_count \
  --args 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40 \
  --gas-budget 10000000
```

4. **Clear browser cache and localStorage:**
   - Open browser DevTools
   - Go to Application > Local Storage
   - Clear all `devhub_*` entries
   - Refresh the page

## Common Issues

### Issue 1: Version Mismatch
If you see `E_WRONG_VERSION` errors, the migration didn't complete properly.

**Fix:** Run migration again:
```bash
sui client call \
  --package 0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2 \
  --module devhub \
  --function migrate \
  --args 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40 \
        0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c \
  --gas-budget 10000000
```

### Issue 2: Stale Cache
The frontend might be using cached data that references the old package.

**Fix:** Clear localStorage and refresh

### Issue 3: Object Type Mismatch
The DevHub object's type still references the old package ID, which is expected.

**Note:** This is normal! In Sui, the object type includes the original package ID, but you can still use it with the new package as long as the struct layout is compatible (which it is since we followed upgrade rules).

