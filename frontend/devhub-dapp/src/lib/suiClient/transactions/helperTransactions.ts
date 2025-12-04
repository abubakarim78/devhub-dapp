import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, CONTRACT_FUNCTIONS } from '../constants';

// Helper function to create platform statistics
export function createPlatformStatisticsTransaction() {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.CREATE_PLATFORM_STATISTICS}`,
    arguments: [],
  });

  return tx;
}

// Helper function to create proposals by status
export function createProposalsByStatusTransaction() {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROPOSALS_BY_STATUS}`,
    arguments: [],
  });

  return tx;
}

// Helper function to create user proposals object
export function createUserProposalsObjectTransaction() {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.CREATE_USER_PROPOSALS_OBJECT}`,
    arguments: [],
  });

  return tx;
}

// Helper function to batch create both helper objects in one transaction
export function createHelperObjectsBatchTransaction() {
  const tx = new Transaction();

  // Create UserProposals object
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.CREATE_USER_PROPOSALS_OBJECT}`,
    arguments: [],
  });

  // Create ProposalsByStatus object
  tx.moveCall({
    target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROPOSALS_BY_STATUS}`,
    arguments: [],
  });

  return tx;
}
