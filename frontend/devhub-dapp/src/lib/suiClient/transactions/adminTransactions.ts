import { Transaction } from '@mysten/sui/transactions';
import { DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';

// Helper function to grant admin role
export function grantAdminRoleTransaction(newAdmin: string) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GRANT_ADMIN_ROLE}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(newAdmin),
    ],
  });

  return tx;
}

// Helper function to revoke admin role
export function revokeAdminRoleTransaction(adminToRevoke: string) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.REVOKE_ADMIN_ROLE}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(adminToRevoke),
    ],
  });

  return tx;
}

// Helper function to change platform fee (admin only)
export function changePlatformFeeTransaction(newFee: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::change_platform_fee`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(newFee),
    ],
  });

  return tx;
}

// Helper function to change project posting fee (admin only)
export function changeProjectPostingFeeTransaction(newFee: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::change_project_posting_fee`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(newFee),
    ],
  });

  return tx;
}

// Helper function to withdraw platform fees (admin only)
export function withdrawFeesTransaction(recipient: string, amount: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.WITHDRAW_PLATFORM_FEES}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.address(recipient),
      tx.pure.u64(amount),
    ],
  });

  return tx;
}

