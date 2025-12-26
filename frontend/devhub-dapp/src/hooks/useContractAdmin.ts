import { useCallback } from "react";
import { getCurrentPackageId, getAdmins as getAdminsFromContract, getSuperAdmin } from "../lib/suiClient";
import type { ContractCacheRef } from "./useContractCache";
import { isCacheValid, setCacheEntry } from "./useContractUtils";

export const useContractAdmin = (
  cacheRef: React.MutableRefObject<ContractCacheRef>,
  withRetry: <T>(operation: () => Promise<T>) => Promise<T>,
) => {

  const isAdmin = useCallback(
    async (
      address: string,
      forceRefresh: boolean = false,
    ): Promise<boolean> => {
      const cached = cacheRef.current.adminStatus.get(address) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log(`🔍 Checking admin status for: ${address}`);
        const currentPackageId = getCurrentPackageId();
        console.log(`📦 Using PACKAGE_ID: ${currentPackageId}`);

        // Use getAdmins and check if address is in the list
        // IMPORTANT: Publisher (super_admin) should NOT have regular admin access
        // This is a workaround since is_admin function doesn't exist in devhub module
        const adminStatus = await withRetry(async () => {
          const [admins, superAdminAddr] = await Promise.all([
            getAdminsFromContract(),
            getSuperAdmin(),
          ]);

          console.log(`📋 Admins list:`, admins);
          console.log(`📋 Super admin:`, superAdminAddr);

          // Normalize addresses for comparison (remove leading zeros, ensure lowercase)
          const normalizeAddress = (addr: string) => addr.toLowerCase().trim();
          const normalizedAddress = normalizeAddress(address);

          // Explicitly exclude super admin (publisher) from regular admin access
          if (superAdminAddr && normalizeAddress(superAdminAddr) === normalizedAddress) {
            console.log(`👑 Address ${address} is super admin (publisher) - NOT granting regular admin access`);
            return false; // Publisher should only have super admin access, not regular admin
          }

          // Check if address is in admins list (excluding super admin)
          const isInAdmins = admins.some(
            (adminAddr) => normalizeAddress(adminAddr) === normalizedAddress
          );

          console.log(`👑 Admin status for ${address}:`, isInAdmins);
          return isInAdmins;
        });

        cacheRef.current.adminStatus.set(address, setCacheEntry(adminStatus));
        return adminStatus;
      } catch (err: any) {
        // Check if error is about package not existing
        const errorMessage = err?.message || err?.toString() || '';
        if (errorMessage.includes('Package object does not exist') || 
            errorMessage.includes('does not exist with ID')) {
          const currentPackageId = getCurrentPackageId();
          console.warn(`⚠️ Package ${currentPackageId} does not exist on the network. This may be normal if the package hasn't been published yet.`);
          return false;
        }
        console.error(`❌ Error checking admin status:`, err);
        return false; // ✅ Always default to false on error
      }
    },
    [cacheRef, withRetry],
  );

  const isSuperAdmin = useCallback(
    async (
      address: string,
    ): Promise<boolean> => {
      try {
        console.log(`🔍 Checking super admin status for: ${address}`);

        // Only the publisher address (super_admin) can be a super admin
        // This checks if the given address matches the contract's super_admin (publisher)
        // Use getSuperAdmin and check if address matches
        // This is a workaround since is_super_admin function doesn't exist in devhub module
        const superAdminStatus = await withRetry(async () => {
          const superAdminAddr = await getSuperAdmin();

          console.log(`📋 Super admin address from chain:`, superAdminAddr);

          if (!superAdminAddr) {
            console.log(`⚠️ No super admin found`);
            return false;
          }

          // Normalize addresses for comparison:
          // - lowercase
          // - strip 0x prefix
          // - remove leading zeros
          const normalizeAddress = (addr: string) => {
            if (!addr) return "";
            let s = addr.toLowerCase().trim();
            if (s.startsWith("0x")) {
              s = s.slice(2);
            }
            // Remove leading zeros then pad/trim to 64 chars for safety
            s = s.replace(/^0+/, "");
            if (s.length < 64) {
              s = s.padStart(64, "0");
            } else if (s.length > 64) {
              s = s.slice(-64);
            }
            return s;
          };

          const normalizedAddress = normalizeAddress(address);
          const normalizedSuperAdmin = normalizeAddress(superAdminAddr);

          console.log("👑 Super admin comparison:", {
            inputAddress: address,
            chainAddress: superAdminAddr,
            normalizedInput: normalizedAddress,
            normalizedChain: normalizedSuperAdmin,
          });

          const isSuperAdminResult = normalizedSuperAdmin === normalizedAddress;

          console.log(`👑 Super admin status for ${address}:`, isSuperAdminResult);
          return isSuperAdminResult;
        });

        return superAdminStatus;
      } catch (err: any) {
        // Check if error is about package not existing
        const errorMessage = err?.message || err?.toString() || '';
        if (errorMessage.includes('Package object does not exist') || 
            errorMessage.includes('does not exist with ID')) {
          const currentPackageId = getCurrentPackageId();
          console.warn(`⚠️ Package ${currentPackageId} does not exist on the network. This may be normal if the package hasn't been published yet.`);
          return false;
        }
        console.error(`❌ Error checking super admin status:`, err);
        return false; // ✅ Always default to false on error
      }
    },
    [withRetry],
  );

  const getAdmins = useCallback(
    async (): Promise<string[]> => {
      try {
        console.log('Fetching admins from contract...');
        const admins = await getAdminsFromContract();
        console.log('Retrieved admins:', admins);
        return admins;
      } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
      }
    },
    [],
  );

  return {
    isAdmin,
    isSuperAdmin,
    getAdmins,
    getSuperAdmin,
  };
};

