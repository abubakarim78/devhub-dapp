import { Transaction } from '@mysten/sui/transactions';
import { 
  suiClient, 
  DEVHUB_OBJECT_ID,
  CONTRACT_FUNCTIONS,
  storeUpgradeCapId,
  getAdminCapId,
  storeAdminCapId,
  updatePackageId,
  getCurrentPackageId,
} from './constants';

/**
 * Interface for upgrade result
 */
export interface UpgradeResult {
  newPackageId: string;
  upgradeCapId?: string;
  adminCapId?: string;
  digest: number[];
}

/**
 * Get the current package version from the chain
 */
export async function getPackageVersion(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      sender: '0x0',
      transactionBlock: {
        kind: 'moveCall',
        data: {
          packageId: getCurrentPackageId(),
          module: 'devhub',
          function: CONTRACT_FUNCTIONS.GET_PACKAGE_VERSION,
          arguments: [],
        },
      },
    });

    if (result.results && result.results[0]?.returnValues) {
      const returnValue = result.results[0].returnValues[0];
      if (returnValue) {
        // Decode u64 from bcs
        const version = Number(BigInt(returnValue[0]));
        return version;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error getting package version:', error);
    return 0;
  }
}

/**
 * Get the current DevHub shared object version
 */
export async function getDevHubVersion(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      sender: '0x0',
      transactionBlock: {
        kind: 'moveCall',
        data: {
          packageId: getCurrentPackageId(),
          module: 'devhub',
          function: CONTRACT_FUNCTIONS.GET_VERSION,
          arguments: [DEVHUB_OBJECT_ID],
        },
      },
    });

    if (result.results && result.results[0]?.returnValues) {
      const returnValue = result.results[0].returnValues[0];
      if (returnValue) {
        const version = Number(BigInt(returnValue[0]));
        return version;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error getting DevHub version:', error);
    return 0;
  }
}

/**
 * Migrate the DevHub shared object after a package upgrade
 * This updates the shared object's version to match the new package version
 */
export async function migrateDevHub(
  signer: any,
  adminCapId: string
): Promise<{ digest: string; effects?: any }> {
  const tx = new Transaction();
  
  const adminCap = tx.object(adminCapId);
  const devhub = tx.object(DEVHUB_OBJECT_ID);

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.MIGRATE}`,
    arguments: [devhub, adminCap],
  });

  const result = await signer.signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  return result;
}

/**
 * Extract UpgradeCap and AdminCap IDs from publish transaction result
 */
export function extractUpgradeInfo(publishResult: any): {
  upgradeCapId?: string;
  adminCapId?: string;
  packageId: string;
} {
  const objectChanges = publishResult.objectChanges || [];
  let upgradeCapId: string | undefined;
  let adminCapId: string | undefined;
  let packageId: string = '';

  for (const change of objectChanges) {
    if (change.type === 'published') {
      packageId = change.packageId;
    } else if (change.type === 'created') {
      const objectType = change.objectType;
      if (typeof objectType === 'string') {
        if (objectType.includes('UpgradeCap')) {
          upgradeCapId = change.objectId;
        } else if (objectType.includes('AdminCap')) {
          adminCapId = change.objectId;
        }
      }
    }
  }

  return { upgradeCapId, adminCapId, packageId };
}

/**
 * Store upgrade information after publishing
 */
export function storeUpgradeInfo(
  upgradeCapId?: string,
  adminCapId?: string,
  packageId?: string
): void {
  if (upgradeCapId) {
    storeUpgradeCapId(upgradeCapId);
  }
  if (adminCapId) {
    storeAdminCapId(adminCapId);
  }
  if (packageId) {
    updatePackageId(packageId);
  }
}

/**
 * Check if the DevHub needs migration after an upgrade
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const packageVersion = await getPackageVersion();
    const devhubVersion = await getDevHubVersion();
    
    console.log(`Package version: ${packageVersion}, DevHub version: ${devhubVersion}`);
    
    return devhubVersion < packageVersion;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Get AdminCap ID associated with DevHub
 * Uses the constant or localStorage value (set during publish)
 */
export async function getDevHubAdminCapId(): Promise<string> {
  // Return the constant value (set from publish transaction)
  // This is more reliable than querying on-chain
  return getAdminCapId();
}

/**
 * Complete upgrade workflow:
 * 1. Check if migration is needed
 * 2. Perform migration if needed
 */
export async function performUpgradeMigration(
  signer: any
): Promise<{ migrated: boolean; result?: any }> {
  const needsMig = await needsMigration();
  
  if (!needsMig) {
    console.log('No migration needed - versions are in sync');
    return { migrated: false };
  }

  console.log('Migration needed - performing migration...');
  
  const adminCapId = await getDevHubAdminCapId();
  console.log('Using AdminCap ID:', adminCapId);

  const result = await migrateDevHub(signer, adminCapId);
  console.log('Migration completed:', result);

  return { migrated: true, result };
}
