/**
 * Quick script to check if package version matches DevHub version
 * Run with: npx tsx check-package-version.ts
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const PACKAGE_ID = '0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2';
const DEVHUB_OBJECT_ID = '0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40';

async function checkVersions() {
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  
  try {
    // Check DevHub object
    const devhub = await client.getObject({
      id: DEVHUB_OBJECT_ID,
      options: { showContent: true, showType: true }
    });
    
    console.log('DevHub Object:', devhub);
    console.log('\nObject Type:', devhub.data?.type);
    
    // Try to call get_version
    const { Transaction } = await import('@mysten/sui/transactions');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::devhub::get_version`,
      arguments: [tx.object(DEVHUB_OBJECT_ID)],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx as any,
      sender: '0x0',
    });

    console.log('\nPackage Version Check Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVersions();
