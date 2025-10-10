import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Shield, DollarSign, Users, TrendingUp, UserCheck, Settings, Loader2, RefreshCw, Edit, Save, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '../hooks/useContract';
import { withdrawFeesTransaction, withdrawAllFeesTransaction, setPlatformFeeTransaction, transferAdminTransaction } from '../lib/suiClient';
import StarBackground from '@/components/common/StarBackground';

interface AdminPanelProps {
  isAdmin: boolean;
}

// Skeleton components for better loading UX
const StatCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl animate-pulse"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-800/50 rounded-xl w-12 h-12"></div>
      <div className="text-right">
        <div className="h-8 bg-gray-800/50 rounded w-20 mb-2"></div>
        <div className="h-4 bg-gray-800/50 rounded w-16"></div>
      </div>
    </div>
  </motion.div>
);

const AdminSkeletonLoader: React.FC = () => (
  <div className="bg-black min-h-screen text-white relative">
    <StarBackground />
    <div className="relative z-10 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gray-800/50 rounded-xl animate-pulse w-14 h-14"></div>
            <div>
              <div className="h-12 bg-gray-800/50 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-800/50 rounded w-80 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    </div>
  </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ }) => {
  const currentAccount = useCurrentAccount();   
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { 
    getCardCount, 
    getPlatformFeeBalance, 
    getPlatformFee,
    isAdmin: checkIsAdmin,
    getAllActiveCards,
    getCardsOpenToWork,
    clearCache,
    getCacheStats
  } = useContract();

  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    adminVerification: true,
    basicData: false,
    additionalStats: false,
    withdrawing: false,
    refreshing: false,
    updatingPlatformFee: false,
    transferringAdmin: false,
  });

  // State variables
  const [platformFees, setPlatformFees] = useState(0);
  const [currentPlatformFee, setCurrentPlatformFee] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [activeCards, setActiveCards] = useState(0);
  const [openToWorkCards, setOpenToWorkCards] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Platform fee editing state
  const [editingPlatformFee, setEditingPlatformFee] = useState(false);
  const [newPlatformFee, setNewPlatformFee] = useState('');
  
  // Transfer admin state
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  
  // Admin verification state
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update loading state helper
  const updateLoadingState = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // Admin verification
  const verifyAdminAccess = useCallback(async () => {
    if (!currentAccount) {
      setAdminVerified(false);
      updateLoadingState('adminVerification', false);
      return;
    }

    try {
      console.log('🔐 Starting admin verification process...');
      
      const isAdminResult = await checkIsAdmin(currentAccount.address, true);
      console.log(`🔐 Admin verification for ${currentAccount.address}:`, isAdminResult);
      
      setAdminVerified(isAdminResult);
      
      if (isAdminResult) {
        fetchBasicData();
      }
      
    } catch (error) {
      console.error('❌ Admin verification failed:', error);
      setAdminVerified(false);
      setError('Failed to verify admin access');
    } finally {
      updateLoadingState('adminVerification', false);
    }
  }, [currentAccount, checkIsAdmin, updateLoadingState]);

  // Fetch basic data
  const fetchBasicData = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentAccount || adminVerified === false) return;
    
    updateLoadingState('basicData', true);
    
    try {
      console.log('🔄 Fetching basic admin data...');
      
      const [cardCount, feeBalance, currentFee] = await Promise.all([
        getCardCount(forceRefresh),
        getPlatformFeeBalance(forceRefresh),
        getPlatformFee(),
      ]);
      
      console.log('📊 Basic data fetched:', { cardCount, feeBalance, currentFee });
      
      setTotalCards(cardCount);
      setPlatformFees(feeBalance / 1_000_000_000);
      setCurrentPlatformFee(currentFee / 1_000_000_000);
      
      fetchAdditionalStats(forceRefresh);
      
    } catch (error) {
      console.error('❌ Error fetching basic data:', error);
      setError('Failed to load basic admin data');
    } finally {
      updateLoadingState('basicData', false);
    }
  }, [currentAccount, adminVerified, getCardCount, getPlatformFeeBalance, getPlatformFee, getCacheStats, updateLoadingState]);

  // Fetch additional stats
  const fetchAdditionalStats = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentAccount || adminVerified === false) return;
    
    updateLoadingState('additionalStats', true);
    
    try {
      console.log('🔄 Fetching additional stats...');
      
      const [activeCardsData, openToWorkCardsData] = await Promise.all([
        getAllActiveCards(forceRefresh),
        getCardsOpenToWork(forceRefresh),
      ]);
      
      setActiveCards(activeCardsData.length);
      setOpenToWorkCards(openToWorkCardsData.length);
      
      console.log('📈 Additional stats loaded:', { 
        activeCards: activeCardsData.length, 
        openToWork: openToWorkCardsData.length 
      });
      
    } catch (error) {
      console.warn('⚠️ Error fetching additional stats:', error);
    } finally {
      updateLoadingState('additionalStats', false);
    }
  }, [currentAccount, adminVerified, getAllActiveCards, getCardsOpenToWork, updateLoadingState]);

  useEffect(() => {
    verifyAdminAccess();
  }, [verifyAdminAccess]);

  const handleRefresh = useCallback(() => {
    updateLoadingState('refreshing', true);
    fetchBasicData(true).finally(() => {
      updateLoadingState('refreshing', false);
    });
  }, [fetchBasicData, updateLoadingState]);

  const handleClearCache = useCallback(() => {
    clearCache();
    handleRefresh();
  }, [clearCache, handleRefresh]);

  const handleEditPlatformFee = useCallback(() => {
    setEditingPlatformFee(true);
    setNewPlatformFee(currentPlatformFee.toString());
  }, [currentPlatformFee]);

  const handleCancelEditPlatformFee = useCallback(() => {
    setEditingPlatformFee(false);
    setNewPlatformFee('');
  }, []);

  const handleUpdatePlatformFee = useCallback(async () => {
    if (!currentAccount) return;
    
    const newFee = parseFloat(newPlatformFee);
    if (isNaN(newFee) || newFee < 0) {
      alert('Invalid platform fee amount');
      return;
    }

    const newFeeInMist = Math.floor(newFee * 1_000_000_000);
    
    updateLoadingState('updatingPlatformFee', true);
    try {
      console.log('💰 Updating platform fee:', { newFee, newFeeInMist });
      const tx = setPlatformFeeTransaction(newFeeInMist);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            console.log('✅ Platform fee update successful');
            setCurrentPlatformFee(newFee);
            setEditingPlatformFee(false);
            setNewPlatformFee('');
            alert(`Successfully updated platform fee to ${newFee} SUI`);
            fetchBasicData(true);
          },
          onError: (error: Error) => {
            console.error('❌ Error updating platform fee:', error.message);
            alert('Failed to update platform fee. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in platform fee update process:', error);
    } finally {
      updateLoadingState('updatingPlatformFee', false);
    }
  }, [currentAccount, newPlatformFee, signAndExecute, fetchBasicData, updateLoadingState]);

  const handleEditAdmin = useCallback(() => {
    setEditingAdmin(true);
    setNewAdminAddress('');
  }, []);

  const handleCancelEditAdmin = useCallback(() => {
    setEditingAdmin(false);
    setNewAdminAddress('');
  }, []);

  const validateAddress = useCallback((address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }, []);

  const handleTransferAdmin = useCallback(async () => {
    if (!currentAccount) return;
    
    if (!newAdminAddress.trim()) {
      alert('Please enter a valid admin address');
      return;
    }

    if (!validateAddress(newAdminAddress)) {
      alert('Invalid Sui address format. Address should be 66 characters starting with 0x');
      return;
    }

    if (newAdminAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
      alert('Cannot transfer admin to the same address');
      return;
    }

    const confirmMessage = `Are you sure you want to transfer admin privileges to:\n\n${newAdminAddress}\n\nThis action cannot be undone and you will lose admin access immediately.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    updateLoadingState('transferringAdmin', true);
    try {
      console.log('👑 Transferring admin privileges to:', newAdminAddress);
      const tx = transferAdminTransaction(newAdminAddress);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            console.log('✅ Admin transfer successful');
            setEditingAdmin(false);
            setNewAdminAddress('');
            alert(`Successfully transferred admin privileges to ${newAdminAddress}\n\nYou will need to refresh the page.`);
            
            setAdminVerified(false);
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onError: (error: Error) => {
            console.error('❌ Error transferring admin:', error.message);
            alert('Failed to transfer admin privileges. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in admin transfer process:', error);
    } finally {
      updateLoadingState('transferringAdmin', false);
    }
  }, [currentAccount, newAdminAddress, validateAddress, signAndExecute, updateLoadingState]);

  const handleWithdraw = useCallback(async () => {
    if (!currentAccount) return;
    
    const amount = parseFloat(withdrawAmount);
    const amountInMist = Math.floor(amount * 1_000_000_000);
    
    if (amount <= 0 || amount > platformFees) {
      alert('Invalid withdrawal amount');
      return;
    }

    updateLoadingState('withdrawing', true);
    try {
      console.log('💰 Withdrawing fees:', { amount, amountInMist });
      const tx = withdrawFeesTransaction(currentAccount.address, amountInMist);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            console.log('✅ Withdrawal successful');
            setPlatformFees(prev => prev - amount);
            setWithdrawAmount('');
            alert(`Successfully withdrew ${amount} SUI`);
            fetchBasicData(true);
          },
          onError: (error: Error) => {
            console.error('❌ Error withdrawing fees:', error.message);
            alert('Failed to withdraw fees. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in withdrawal process:', error);
    } finally {
      updateLoadingState('withdrawing', false);
    }
  }, [currentAccount, withdrawAmount, platformFees, signAndExecute, fetchBasicData, updateLoadingState]);

  const handleWithdrawAll = useCallback(async () => {
    if (!currentAccount || platformFees <= 0) return;

    updateLoadingState('withdrawing', true);
    try {
      console.log('💰 Withdrawing all fees:', { platformFees });
      const tx = withdrawAllFeesTransaction();
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            const withdrawnAmount = platformFees;
            console.log('✅ Withdraw all successful');
            setPlatformFees(0);
            setWithdrawAmount('');
            alert(`Successfully withdrew all ${withdrawnAmount.toFixed(2)} SUI`);
            fetchBasicData(true);
          },
          onError: (error) => {
            console.error('❌ Error withdrawing all fees:', error);
            alert('Failed to withdraw fees. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in withdrawal process:', error);
    } finally {
      updateLoadingState('withdrawing', false);
    }
  }, [currentAccount, platformFees, signAndExecute, fetchBasicData, updateLoadingState]);

  // Early returns
  if (!currentAccount) {
    return (
      <div className="bg-black min-h-screen text-white relative">
        <StarBackground />
        <div className="relative z-10 pt-32 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/30">
              <Shield className="h-12 w-12 text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-gray-400 mb-6">You need to connect your wallet to access the admin panel.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loadingStates.adminVerification) {
    return <AdminSkeletonLoader />;
  }

  if (adminVerified === false) {
    return (
      <div className="bg-black min-h-screen text-white relative">
        <StarBackground />
        <div className="relative z-10 pt-32 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30">
              <Shield className="h-16 w-16 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-6">You are not authorized to access the admin panel.</p>
            <p className="text-sm text-gray-500 mb-6">Only the contract publisher or transferred admins can access this area.</p>
            <button
              onClick={verifyAdminAccess}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Verification</span>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loadingStates.basicData) {
    return <AdminSkeletonLoader />;
  }

  return (
    <div className="bg-black min-h-screen text-white relative">
      <StarBackground />
      
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    Admin Panel
                  </h1>
                </div>
                <p className="text-xl text-gray-400 ml-14">Platform management and analytics dashboard</p>
                <div className="flex items-center space-x-2 ml-14 mt-2">
                  <div className="flex items-center space-x-1 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Admin Verified</span>
                  </div>
                </div>
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
              className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-green-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{platformFees.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Platform Fees</div>
                </div>
              </div>
              <div className="text-xs text-green-400 font-medium">SUI</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{totalCards.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Cards</div>
                </div>
              </div>
              <div className="text-xs text-blue-400 font-medium">All Time</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <UserCheck className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-right">
                  {loadingStates.additionalStats ? (
                    <div className="h-8 bg-gray-800/50 rounded w-16 mb-2 animate-pulse"></div>
                  ) : (
                    <div className="text-3xl font-bold text-white">{activeCards.toLocaleString()}</div>
                  )}
                  <div className="text-sm text-gray-400">Active Cards</div>
                </div>
              </div>
              <div className="text-xs text-purple-400 font-medium">Current</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-orange-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                </div>
                <div className="text-right">
                  {loadingStates.additionalStats ? (
                    <div className="h-8 bg-gray-800/50 rounded w-16 mb-2 animate-pulse"></div>
                  ) : (
                    <div className="text-3xl font-bold text-white">{openToWorkCards.toLocaleString()}</div>
                  )}
                  <div className="text-sm text-gray-400">Open to Work</div>
                </div>
              </div>
              <div className="text-xs text-orange-400 font-medium">Available</div>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Fee Management */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                  <DollarSign className="h-6 w-6 text-green-400" />
                  <span>Platform Fee Management</span>
                </h3>
                
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl p-6 mb-6 border border-green-500/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white text-lg">Available Balance</h4>
                      <p className="text-sm text-gray-400">Total accumulated platform fees</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-400">{platformFees.toFixed(2)}</div>
                      <div className="text-sm text-green-300">SUI</div>
                    </div>
                  </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Withdrawal Amount (SUI)
                    </label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={platformFees}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWithdraw}
                      disabled={loadingStates.withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-green-500/25"
                    >
                      {loadingStates.withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Withdraw Fees</span>
                    </motion.button>
                  </div>
                </div>

                <div className="flex space-x-2 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setWithdrawAmount((platformFees * 0.25).toFixed(2))}
                    className="px-4 py-2 bg-gray-800/50 text-gray-300 text-sm rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                  >
                    25%
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setWithdrawAmount((platformFees * 0.5).toFixed(2))}
                    className="px-4 py-2 bg-gray-800/50 text-gray-300 text-sm rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                  >
                    50%
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setWithdrawAmount((platformFees * 0.75).toFixed(2))}
                    className="px-4 py-2 bg-gray-800/50 text-gray-300 text-sm rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                  >
                    75%
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setWithdrawAmount(platformFees.toFixed(2))}
                    className="px-4 py-2 bg-gray-800/50 text-gray-300 text-sm rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                  >
                    All
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWithdrawAll}
                  disabled={loadingStates.withdrawing || platformFees <= 0}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
                >
                  {loadingStates.withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Withdraw All Fees</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Platform Settings */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50 shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <span>Platform Settings</span>
                </h3>
                <div className="space-y-4">
                  {/* Platform Fee Setting */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Platform Fee (SUI)
                      </label>
                      {!editingPlatformFee && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleEditPlatformFee}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit platform fee"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {editingPlatformFee ? (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex space-x-2"
                        >
                          <input
                            type="number"
                            value={newPlatformFee}
                            onChange={(e) => setNewPlatformFee(e.target.value)}
                            min="0"
                            step="0.01"
                            className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            placeholder="0.00"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleUpdatePlatformFee}
                            disabled={loadingStates.updatingPlatformFee}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {loadingStates.updatingPlatformFee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancelEditPlatformFee}
                            disabled={loadingStates.updatingPlatformFee}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.input
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          type="text"
                          value={`${currentPlatformFee.toFixed(4)} SUI`}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-800/30 border border-gray-700/30 rounded-lg text-gray-400"
                        />
                      )}
                    </AnimatePresence>
                    <p className="text-xs text-gray-500 mt-1">Fee for creating developer cards</p>
                  </div>

                  {/* Admin Address Setting */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Admin Address
                      </label>
                      {!editingAdmin && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleEditAdmin}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Transfer admin privileges"
                        >
                          <UserPlus className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {editingAdmin ? (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-2"
                        >
                          <input
                            type="text"
                            value={newAdminAddress}
                            onChange={(e) => setNewAdminAddress(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-mono text-xs"
                            placeholder="0x..."
                          />
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleTransferAdmin}
                              disabled={loadingStates.transferringAdmin || !newAdminAddress.trim()}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                            >
                              {loadingStates.transferringAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                              <span>Transfer Admin</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleCancelEditAdmin}
                              disabled={loadingStates.transferringAdmin}
                              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3"
                          >
                            <p className="text-xs text-yellow-300">
                              ⚠️ <strong>Warning:</strong> Transferring admin privileges is irreversible. You will lose all admin access immediately.
                            </p>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.input
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          type="text"
                          value={currentAccount.address}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-800/30 border border-gray-700/30 rounded-lg text-gray-400 font-mono text-xs"
                        />
                      )}
                    </AnimatePresence>
                    <p className="text-xs text-gray-500 mt-1">Current admin with full platform privileges</p>
                  </div>
                </div>
              </motion.div>

              {/* System Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50 shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-green-500/30 transition-all"
                  >
                    <span className="text-sm text-gray-400">Platform Status</span>
                    <span className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Online</span>
                    </span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-green-500/30 transition-all"
                  >
                    <span className="text-sm text-gray-400">Admin Verification</span>
                    <span className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Verified</span>
                    </span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-blue-500/30 transition-all"
                  >
                    <span className="text-sm text-gray-400">Network</span>
                    <span className="flex items-center space-x-1 text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Sui Testnet</span>
                    </span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-purple-500/30 transition-all"
                  >
                    <span className="text-sm text-gray-400">Additional Stats</span>
                    <span className="flex items-center space-x-1">
                      {loadingStates.additionalStats ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-yellow-400">Loading...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm font-medium text-green-400">Loaded</span>
                        </>
                      )}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 bg-red-500/20 border border-red-500/30 rounded-2xl p-4"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></div>
                  <p className="text-red-300 font-medium">Error: {error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;