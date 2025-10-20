import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Shield, UserPlus, UserX, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '../hooks/useContract';
import { transferAdminTransaction } from '../lib/suiClient';
import StarBackground from '@/components/common/StarBackground';

const SuperAdminSkeletonLoader: React.FC = () => (
  <div className="bg-background min-h-screen text-foreground relative">
    <StarBackground />
    <div className="relative z-10 pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-12 bg-muted rounded w-64 mb-8 animate-pulse"></div>
        <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SuperAdmin: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { isSuperAdmin, getAdmins, getSuperAdmin } = useContract();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [superAdminAddress, setSuperAdminAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const verifySuperAdmin = useCallback(async () => {
    if (!currentAccount) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const isAuth = await isSuperAdmin(currentAccount.address);
      setIsAuthorized(isAuth);
      if (isAuth) {
        fetchAdminsAndSuperAdmin();
      }
    } catch (err) {
      setError('Failed to verify super admin status.');
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [currentAccount, isSuperAdmin]);

  const fetchAdminsAndSuperAdmin = useCallback(async () => {
    try {
      const [adminsList, superAdmin] = await Promise.all([
        getAdmins(),
        getSuperAdmin(),
      ]);
      setAdmins(adminsList);
      setSuperAdminAddress(superAdmin);
    } catch (err) {
      setError('Failed to fetch admin data.');
    }
  }, [getAdmins, getSuperAdmin]);

  useEffect(() => {
    verifySuperAdmin();
  }, [verifySuperAdmin]);

  const handleAddAdmin = async () => {
    if (!newAdminAddress || !/^0x[a-fA-F0-9]{64}$/.test(newAdminAddress)) {
      alert('Please enter a valid Sui address.');
      return;
    }

    setAddingAdmin(true);
    try {
      const tx = transferAdminTransaction(newAdminAddress);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert('Admin added successfully!');
            setNewAdminAddress('');
            fetchAdminsAndSuperAdmin();
          },
          onError: (err) => {
            alert(`Failed to add admin: ${err.message}`);
          },
          onSettled: () => {
            setAddingAdmin(false);
          },
        },
      );
    } catch (err) {
      setAddingAdmin(false);
      alert(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading || isAuthorized === null) {
    return <SuperAdminSkeletonLoader />;
  }

  if (!isAuthorized) {
    return (
      <div className="bg-background min-h-screen text-foreground relative">
        <StarBackground />
        <div className="relative z-10 pt-32 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-32 h-32 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-destructive/30">
              <Shield className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">You are not authorized to access the super admin panel.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground />
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Super Admin Panel
              </h1>
            </div>
            <p className="text-xl text-muted-foreground ml-14">Manage platform administrators</p>
          </motion.div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-8">
              <p className="text-red-300 font-medium">Error: {error}</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card/70 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl mb-8"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-purple-400" />
              <span>Add New Admin</span>
            </h3>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                className="flex-grow px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground font-mono text-sm"
                placeholder="Enter new admin Sui address (0x...)"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddAdmin}
                disabled={addingAdmin}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/25"
              >
                {addingAdmin ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                <span>{addingAdmin ? 'Adding...' : 'Add Admin'}</span>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-card/70 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">Current Admins</h3>
            <div className="space-y-3">
              {superAdminAddress && (
                <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <div className="font-mono text-sm text-purple-300 truncate" title={superAdminAddress}>
                    {superAdminAddress}
                  </div>
                  <div className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded-md">SUPER ADMIN</div>
                </div>
              )}
              {admins.map((admin, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                  <div className="font-mono text-sm text-muted-foreground truncate" title={admin}>
                    {admin}
                  </div>
                  {/* In a real app, you would have a function to revoke admin rights */}
                  <button className="text-red-500 hover:text-red-400 disabled:opacity-50" disabled>
                    <UserX className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {admins.length === 0 && !superAdminAddress && (
                <p className="text-muted-foreground text-center py-4">No admins found.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;