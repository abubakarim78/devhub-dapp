# ⚠️ IMPORTANT: Migration Required After Upgrade

Your package has been successfully upgraded to **Version 2**, but you **must** migrate the DevHub shared object to match the new package version.

## Current Status

- ✅ Package upgraded: `0x23aa50e2202d3d6b90378998f9a74a067ff6f475ce1dd4e4de6f7e773d0e2dbd` (Version 2)
- ⚠️ DevHub shared object: Still at Version 1 (needs migration)
- 🔑 AdminCap ID: `0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c`

## What Happens Without Migration?

All calls to DevHub functions will fail with `E_WRONG_VERSION` error because:
- Package version: 2
- DevHub version: 1
- Version check: `devhub.version == VERSION` → `1 == 2` → ❌ FAILS

## How to Migrate

### Option 1: Using TypeScript/JavaScript (Recommended)

```typescript
import { migrateDevHub, getAdminCapId } from './lib/suiClient/upgrade';
import { getCurrentSigner } from './lib/suiClient'; // Your signer function

async function migrate() {
  const signer = getCurrentSigner(); // Get your signer
  const adminCapId = getAdminCapId(); // Gets from constants
  
  console.log('Starting migration...');
  const result = await migrateDevHub(signer, adminCapId);
  console.log('✅ Migration successful!', result);
}

migrate();
```

### Option 2: Using Sui CLI

```bash
# Call the migrate function
sui client call \
  --package 0x23aa50e2202d3d6b90378998f9a74a067ff6f475ce1dd4e4de6f7e773d0e2dbd \
  --module devhub \
  --function migrate \
  --args 0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40 \
        0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c \
  --gas-budget 10000000
```

### Option 3: Using the Automatic Migration Checker

```typescript
import { performUpgradeMigration } from './lib/suiClient/upgrade';
import { getCurrentSigner } from './lib/suiClient';

async function checkAndMigrate() {
  const signer = getCurrentSigner();
  const { migrated, result } = await performUpgradeMigration(signer);
  
  if (migrated) {
    console.log('✅ Migration completed!', result);
  } else {
    console.log('ℹ️ No migration needed - versions are in sync');
  }
}

checkAndMigrate();
```

## Verify Migration

After migration, verify the versions match:

```typescript
import { getPackageVersion, getDevHubVersion } from './lib/suiClient/upgrade';

async function verify() {
  const pkgVersion = await getPackageVersion();
  const devhubVersion = await getDevHubVersion();
  
  console.log(`Package: ${pkgVersion}, DevHub: ${devhubVersion}`);
  if (pkgVersion === devhubVersion) {
    console.log('✅ Versions match - migration successful!');
  } else {
    console.log('❌ Versions mismatch - migration needed');
  }
}

verify();
```

## What the Migration Does

The `migrate()` function:
1. Verifies you own the AdminCap
2. Checks that DevHub version < Package version (ensures it's an upgrade)
3. Updates `devhub.version` from 1 to 2
4. Allows all DevHub functions to work with the new package version

## After Migration

Once migration is complete:
- ✅ All DevHub functions will work normally
- ✅ All existing data (cards, projects, etc.) remains intact
- ✅ You can use the new package version features
- ✅ Future upgrades will follow the same process

---

**Next Steps:**
1. Run the migration using one of the methods above
2. Verify versions match
3. Test your application to ensure everything works
4. Update your frontend to use the new package ID (already done in constants.ts)
