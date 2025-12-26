# Package Upgrade Guide

This guide explains how to upgrade your DevHub package while maintaining all existing data on the chain.

## Overview

The DevHub package uses a versioned upgrade pattern to ensure:
1. **Data Persistence**: All existing data (cards, projects, applications) remains accessible after upgrades
2. **Version Control**: The shared `DevHub` object tracks its version and only accepts calls from matching package versions
3. **Migration Safety**: A migration step ensures the shared object is updated to work with the new package version

## Architecture

### Contract Side

1. **Version Tracking**: 
   - Each package has a `VERSION` constant (currently `1`)
   - The `DevHub` shared object stores its current `version` field
   - All entry functions check `devhub.version == VERSION` before execution

2. **AdminCap**:
   - Controls who can perform upgrades
   - Created during `init()` and transferred to the deployer
   - Required for calling the `migrate()` function

3. **Migration Function**:
   - `migrate(devhub: &mut DevHub, admin_cap: &AdminCap)`
   - Updates the DevHub's version to match the new package version
   - Can only be called by the AdminCap owner
   - Must be called after each package upgrade

### Frontend Side

1. **Storage**: 
   - `UpgradeCap` ID stored in localStorage under `devhub_upgrade_cap_id`
   - `AdminCap` ID stored in localStorage under `devhub_admin_cap_id`
   - Current package ID stored under `devhub_package_id`

2. **Utilities**: 
   - Functions in `lib/suiClient/upgrade.ts` handle upgrade operations
   - Check version compatibility
   - Perform migrations automatically

## Upgrade Process

### Step 1: Make Your Contract Changes

Update your Move code as needed. Remember:
- ✅ You can change function implementations
- ✅ You can add new structs and functions
- ✅ You can change non-public function signatures
- ❌ You **cannot** change public function signatures
- ❌ You **cannot** change existing struct layouts

### Step 2: Increment the Version Constant

In `contracts/sources/devhub.move`, update:

```move
const VERSION: u64 = 2; // Increment from previous version
```

### Step 3: Publish/Upgrade the Package

#### Option A: Using Sui CLI (Recommended)

```bash
# If you have the UpgradeCap ID stored
UPGRADE_CAP=$(cat .upgrade-cap-id)  # Store this from first publish
sui client upgrade --upgrade-capability $UPGRADE_CAP

# Save the new package ID from the output
```

#### Option B: Using TypeScript SDK

```typescript
import { Transaction, UpgradePolicy } from '@mysten/sui/transactions';
import { extractUpgradeInfo, storeUpgradeInfo } from './lib/suiClient/upgrade';

// Build your package (requires sui CLI)
const { modules, dependencies, digest } = await buildPackage();

const tx = new Transaction();
const upgradeCap = tx.object(UPGRADE_CAP_ID);
const ticket = tx.upgrade({
  modules,
  dependencies,
  packageId: CURRENT_PACKAGE_ID,
  ticket: tx.moveCall({
    target: '0x2::package::authorize_upgrade',
    arguments: [upgradeCap, tx.pure(UpgradePolicy.COMPATIBLE), tx.pure(digest)],
  }),
});

const receipt = tx.upgrade({
  modules,
  dependencies,
  packageId: CURRENT_PACKAGE_ID,
  ticket,
});

tx.moveCall({
  target: '0x2::package::commit_upgrade',
  arguments: [upgradeCap, receipt],
});

const result = await signer.signAndExecuteTransaction({ transaction: tx });

// Extract and store upgrade info
const { upgradeCapId, adminCapId, packageId } = extractUpgradeInfo(result);
storeUpgradeInfo(upgradeCapId, adminCapId, packageId);
```

### Step 4: Migrate the Shared Object

After upgrading, you **must** migrate the `DevHub` shared object:

```typescript
import { migrateDevHub, getDevHubAdminCapId } from './lib/suiClient/upgrade';

const adminCapId = await getDevHubAdminCapId();
if (!adminCapId) {
  throw new Error('AdminCap not found');
}

await migrateDevHub(signer, adminCapId);
```

Or use the automatic migration checker:

```typescript
import { performUpgradeMigration } from './lib/suiClient/upgrade';

const { migrated, result } = await performUpgradeMigration(signer);
if (migrated) {
  console.log('Migration completed successfully!');
}
```

### Step 5: Update Frontend Configuration

The package ID should be automatically updated via `storeUpgradeInfo()`, but you can manually update `constants.ts` if needed:

```typescript
export const PACKAGE_ID = '0x...NEW_PACKAGE_ID...';
```

## Verifying Upgrades

### Check Package Version

```typescript
import { getPackageVersion, getDevHubVersion } from './lib/suiClient/upgrade';

const pkgVersion = await getPackageVersion();
const devhubVersion = await getDevHubVersion();

console.log(`Package: ${pkgVersion}, DevHub: ${devhubVersion}`);
// Should match after successful migration
```

### Check if Migration is Needed

```typescript
import { needsMigration } from './lib/suiClient/upgrade';

const needsMig = await needsMigration();
if (needsMig) {
  console.log('⚠️ Migration required!');
}
```

## Important Notes

1. **Backward Compatibility**: Old package versions remain on-chain and can still be accessed. Users using old versions will get `E_WRONG_VERSION` errors until they update.

2. **Migration is Required**: After every upgrade, you must call `migrate()` to update the shared object's version. Without migration, all calls to DevHub will fail.

3. **AdminCap Ownership**: The AdminCap must remain accessible to the deployer/admin for migrations. Consider using a multisig or governance mechanism for production.

4. **UpgradeCap Security**: Protect your UpgradeCap! Anyone with it can upgrade your package. Consider using custom upgrade policies for production.

5. **Testing**: Always test upgrades on testnet/devnet before mainnet.

## Troubleshooting

### "E_WRONG_VERSION" Error

This means the DevHub version doesn't match the package version. Run the migration:

```typescript
await performUpgradeMigration(signer);
```

### "AdminCap not found"

1. Check localStorage for `devhub_admin_cap_id`
2. If missing, extract from the initial publish transaction
3. Or query on-chain using the DevHub object's `admin_cap_id` field

### Package ID Mismatch

The frontend might be using an old package ID. Update it:

```typescript
import { updatePackageId } from './lib/suiClient/constants';
updatePackageId('0x...NEW_ID...');
```

## Example: Complete Upgrade Script

```typescript
import { 
  performUpgradeMigration, 
  getPackageVersion,
  getDevHubVersion,
  needsMigration 
} from './lib/suiClient/upgrade';

async function upgradePackage(signer: any) {
  console.log('1. Checking current versions...');
  const pkgVersion = await getPackageVersion();
  const devhubVersion = await getDevHubVersion();
  console.log(`   Package: ${pkgVersion}, DevHub: ${devhubVersion}`);
  
  console.log('2. Checking if migration needed...');
  const needsMig = await needsMigration();
  
  if (needsMig) {
    console.log('3. Performing migration...');
    const { migrated, result } = await performUpgradeMigration(signer);
    
    if (migrated) {
      console.log('✅ Migration successful!');
      console.log('4. Verifying...');
      const newDevhubVersion = await getDevHubVersion();
      if (newDevhubVersion === pkgVersion) {
        console.log('✅ Versions match - upgrade complete!');
      } else {
        console.error('❌ Version mismatch after migration');
      }
    } else {
      console.log('ℹ️ No migration needed');
    }
  } else {
    console.log('ℹ️ Versions are in sync');
  }
}
```

## Next Steps

After reading this guide:
1. Store your UpgradeCap and AdminCap IDs after first publish
2. Create upgrade scripts for your deployment process
3. Set up monitoring to detect version mismatches
4. Consider implementing custom upgrade policies for production
