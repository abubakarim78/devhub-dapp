import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Shield, DollarSign, Users, TrendingUp, UserCheck, Settings, Loader2, RefreshCw, Eye, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContract } from '../../hooks/useContract';

const AdminFeatures: React.FC = () => {
  const currentAccount = useCurrentAccount();   
  const { 
    getCardCount, 
    getPlatformFeeBalance, 
    getPlatformFee,
    getAllActiveCards,
    getCardsOpenToWork,
    clearCache,
    getAdmins,
    getSuperAdmin,
  } = useContract();

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    basicData: false,
    additionalStats: false,
    refreshing: false,
    adminData: false,
  });

  // State variables
  const [platformFees, setPlatformFees] = useState(0);
  const [currentPlatformFee, setCurrentPlatformFee] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [activeCards, setActiveCards] = useState(0);
  const [openToWorkCards, setOpenToWorkCards] = useState(0);
  const [admins, setAdmins] = useState<string[]>([]);
  const [superAdmin, setSuperAdmin] = useState<string>('');
  
  const [, setError] = useState<string | null>(null);

  // Update loading state helper
  const updateLoadingState = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // Fetch basic data
  const fetchBasicData = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentAccount) return;
    
    updateLoadingState('basicData', true);
    
    try {
      console.log('🔄 Fetching basic admin data...');
      
      const [cardCount, feeBalance, currentFee, adminsList, superAdminAddress] = await Promise.all([
        getCardCount(forceRefresh),
        getPlatformFeeBalance(forceRefresh),
        getPlatformFee(),
        getAdmins(),
        getSuperAdmin(),
      ]);
      
      console.log('📊 Basic data fetched:', { cardCount, feeBalance, currentFee, adminsList, superAdminAddress });
      
      setTotalCards(cardCount);
      setPlatformFees(feeBalance / 1_000_000_000);
      setCurrentPlatformFee(currentFee / 1_000_000_000);
      setAdmins(adminsList);
      setSuperAdmin(superAdminAddress || '');
      
      fetchAdditionalStats(forceRefresh);
      
    } catch (error) {
      console.error('❌ Error fetching basic data:', error);
      setError('Failed to load basic admin data');
    } finally {
      updateLoadingState('basicData', false);
    }
  }, [currentAccount, getCardCount, getPlatformFeeBalance, getPlatformFee, getAdmins, getSuperAdmin, updateLoadingState]);

  // Fetch additional stats
  const fetchAdditionalStats = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentAccount) return;
    
    updateLoadingState('additionalStats', true);
    
    try {
      console.log('🔄 Fetching additional stats...');
      
      const [activeCardsData, openToWorkCardsData] = await Promise.all([
        getAllActiveCards(forceRefresh),
        getCardsOpenToWork(forceRefresh),
      ]);
      
      setActiveCards(activeCardsData.length);
      setOpenToWorkCards(openToWorkCardsData.length);
      
    } catch (error) {
      console.error('❌ Error fetching additional stats:', error);
      setError('Failed to load additional statistics');
    } finally {
      updateLoadingState('additionalStats', false);
    }
  }, [currentAccount, getAllActiveCards, getCardsOpenToWork, updateLoadingState]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    updateLoadingState('refreshing', true);
    try {
      await fetchBasicData(true);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      updateLoadingState('refreshing', false);
    }
  }, [fetchBasicData, updateLoadingState]);

  // Handle clear cache
  const handleClearCache = useCallback(async () => {
    try {
      await clearCache();
      await fetchBasicData(true);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }, [clearCache, fetchBasicData]);

  useEffect(() => {
    fetchBasicData();
  }, [fetchBasicData]);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg shadow-orange-500/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-xl text-muted-foreground ml-14">Platform analytics and read-only admin information</p>
          </div>
          
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={loadingStates.refreshing}
              className="px-5 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:border-blue-400/50 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg shadow-blue-500/10"
            >
              {loadingStates.refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearCache}
              className="px-5 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 hover:border-purple-400/50 font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-purple-500/10"
            >
              <Settings className="h-4 w-4" />
              <span>Clear Cache</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-green-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{platformFees.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Platform Fees</div>
            </div>
          </div>
          <div className="text-xs text-green-400 font-medium">SUI</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-blue-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{totalCards.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Cards</div>
            </div>
          </div>
          <div className="text-xs text-blue-400 font-medium">All Time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-purple-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <UserCheck className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-right">
              {loadingStates.additionalStats ? (
                <div className="h-8 bg-muted rounded w-16 mb-2 animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-foreground">{activeCards.toLocaleString()}</div>
              )}
              <div className="text-sm text-muted-foreground">Active Cards</div>
            </div>
          </div>
          <div className="text-xs text-purple-400 font-medium">Current</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-orange-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <TrendingUp className="h-6 w-6 text-orange-400" />
            </div>
            <div className="text-right">
              {loadingStates.additionalStats ? (
                <div className="h-8 bg-muted rounded w-16 mb-2 animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-foreground">{openToWorkCards.toLocaleString()}</div>
              )}
              <div className="text-sm text-muted-foreground">Open to Work</div>
            </div>
          </div>
          <div className="text-xs text-orange-400 font-medium">Available</div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Platform Fee Information - Read Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-card/70 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Platform Fee Information</h3>
              <p className="text-sm text-muted-foreground">Read-only platform fee data</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                <Eye className="h-3 w-3" />
                <span>Read Only</span>
              </div>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl p-6 mb-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-foreground text-lg">Available Balance</h4>
                <p className="text-sm text-muted-foreground">Total accumulated platform fees</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400">{platformFees.toFixed(2)}</div>
                <div className="text-sm text-green-300">SUI</div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div>
                <p className="text-sm text-muted-foreground">Current Platform Fee</p>
                <p className="text-2xl font-bold text-foreground">{currentPlatformFee.toFixed(2)}%</p>
              </div>
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Admin Notice</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Platform fee management and withdrawals are restricted to Super Admin access only. 
                  Contact your Super Admin for fee-related operations.
                </p>
              </div>
          </div>
        </motion.div>

        {/* Admin Information - Read Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-card/70 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Admin Information</h3>
              <p className="text-sm text-muted-foreground">Current admin status and roles</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                <Eye className="h-3 w-3" />
                <span>Read Only</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Super Admin</span>
                  <Shield className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all">{superAdmin}</p>
              </div>

            <div className="p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Total Admins</span>
                <span className="text-2xl font-bold text-primary">{admins.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Active administrators on the platform</p>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Admin Notice</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Admin role management (grant/revoke) is restricted to Super Admin access only. 
                Contact your Super Admin for role-related operations.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminFeatures;