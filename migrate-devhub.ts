/**
 * Migration Script for DevHub Package Upgrade
 * 
 * This script migrates the DevHub shared object from version 1 to version 2
 * after a package upgrade.
 * 
 * Usage:
 *   npx tsx migrate-devhub.ts
 *   or
 *   node --loader ts-node/esm migrate-devhub.ts
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { execSync } from 'child_process';

// Configuration from your upgrade transaction
const PACKAGE_ID = '0x23aa50e2202d3d6b90378998f9a74a067ff6f475ce1dd4e4de6f7e773d0e2dbd';
const DEVHUB_OBJECT_ID = '0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40';
const ADMIN_CAP_ID = '0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c';

// Get signer from Sui CLI keystore
function getSigner() {
  const sender = execSync('sui client active-address', { encoding: 'utf8' }).trim();
  const keystorePath = path.join(homedir(), '.sui', 'sui_config', 'sui.keystore');
  const keystore = JSON.parse(readFileSync(keystorePath, 'utf8'));

  for (const priv of keystore) {
    const raw = fromBase64(priv);
    if (raw[0] !== 0) continue;

    const pair = Ed25519Keypair.fromSecretKey(raw.slice(1));
    if (pair.getPublicKey().toSuiAddress() === sender) {
      return { signer: pair, sender };
    }
  }

  throw new Error(`Key pair not found for sender: ${sender}`);
}

async function migrate() {
  console.log('🚀 Starting DevHub migration...\n');
  
  const { signer, sender } = getSigner();
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });

  console.log('📋 Configuration:');
  console.log(`   Package ID: ${PACKAGE_ID}`);
  console.log(`   DevHub Object: ${DEVHUB_OBJECT_ID}`);
  console.log(`   AdminCap ID: ${ADMIN_CAP_ID}`);
  console.log(`   Sender: ${sender}\n`);

  // Build migration transaction
  const tx = new Transaction();
  const devhub = tx.object(DEVHUB_OBJECT_ID);
  const adminCap = tx.object(ADMIN_CAP_ID);

  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::migrate`,
    arguments: [devhub, adminCap],
  });

  console.log('📤 Executing migration transaction...');
  
  try {
    const result = await client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('\n✅ Migration successful!\n');
    console.log('Transaction Digest:', result.digest);
    console.log('\n📊 Transaction Effects:');
    console.log(JSON.stringify(result.effects, null, 2));
    
    if (result.objectChanges) {
      console.log('\n📦 Object Changes:');
      result.objectChanges.forEach((change: any) => {
        if (change.type === 'mutated' && change.objectType?.includes('DevHub')) {
          console.log(`   DevHub updated to version 2`);
        }
      });
    }

    console.log('\n✨ DevHub is now compatible with package version 2!');
    console.log('   All functions should now work correctly.\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

// Run migration
migrate().catch(console.error);
