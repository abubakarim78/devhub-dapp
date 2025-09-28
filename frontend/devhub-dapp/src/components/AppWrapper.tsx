'use client';

import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
// NOTE: You need to create or move your `useContract` hook. For now, we'll mock it.
// import { useContract } from '@/hooks/useContract';
import Navbar from '@/components/common/Navbar';

// MOCK HOOK: Replace this with your actual useContract hook implementation
const useContract = () => ({
    isAdmin: async (address: string): Promise<boolean> => {
        console.log("Checking admin status for:", address);
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // For testing, make a specific address an admin
        if (address.startsWith("0x123")) {
            console.log("User is admin");
            return true;
        }
        console.log("User is not admin");
        return false;
    }
});


export function AppWrapper({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const { isAdmin } = useContract();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentAddress = useMemo(() => currentAccount?.address, [currentAccount]);

  const checkAdminStatus = useCallback(async (address: string) => {
    setLoading(true);
    try {
      const status = await isAdmin(address);
      setIsAdminUser(status);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdminUser(false);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (currentAddress) {
      checkAdminStatus(currentAddress);
    } else {
      setIsAdminUser(false);
    }
  }, [currentAddress, checkAdminStatus]);

  return (
    <div className="relative overflow-hidden">
        {loading && (
             <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
                Checking admin status...
             </div>
        )}
      <Navbar isAdmin={isAdminUser} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}