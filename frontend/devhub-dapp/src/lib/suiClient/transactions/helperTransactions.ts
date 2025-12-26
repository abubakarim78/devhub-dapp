import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';

// Helper function to create platform statistics
export function createPlatformStatisticsTransaction() {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CREATE_PLATFORM_STATISTICS}`,
    arguments: [],
  });

  return tx;
}

// Helper function to create proposals by status
export function createProposalsByStatusTransaction() {
  const tx = new Transaction();
  const packageId = getCurrentPackageId();
  
  console.log('🔍 createProposalsByStatusTransaction using package ID:', packageId);
  console.log('🔍 Function target:', `${packageId}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROPOSALS_BY_STATUS}`);
  
  tx.moveCall({
    target: `${packageId}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROPOSALS_BY_STATUS}`,
    arguments: [],
  });

  return tx;
}

// Helper function to create user proposals object
export function createUserProposalsObjectTransaction() {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CREATE_USER_PROPOSALS_OBJECT}`,
    arguments: [],
  });

  return tx;
}

// Helper function to batch create both helper objects in one transaction
export function createHelperObjectsBatchTransaction() {
  const tx = new Transaction();

  // Create UserProposals object
  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CREATE_USER_PROPOSALS_OBJECT}`,
    arguments: [],
  });

  // Create ProposalsByStatus object
  const packageId = getCurrentPackageId();
  tx.moveCall({
    target: `${packageId}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROPOSALS_BY_STATUS}`,
    arguments: [],
  });

  return tx;
}
