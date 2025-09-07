import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Shield, DollarSign, Users, TrendingUp, UserCheck, Settings, Loader2, RefreshCw, Edit, Save, X, UserPlus } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { withdrawFeesTransaction, withdrawAllFeesTransaction, setPlatformFeeTransaction, transferAdminTransaction } from '../lib/suiClient';

interface AdminPanelProps {
  isAdmin: boolean;
}

// Skeleton components for better loading UX
const StatCardSkeleton: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-200 rounded-xl w-12 h-12"></div>
      <div className="text-right">
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const AdminSkeletonLoader: React.FC = () => (
  <div className="min-h-screen pt-8 pb-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gray-200 rounded-xl animate-pulse w-14 h-14"></div>
          <div>
            <div className="h-12 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-80 animate-pulse"></div>
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Fee Management Skeleton */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="bg-gray-100 rounded-xl p-6 mb-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ }) => {
  const currentAccount = useCurrentAccount();   // Get current account    
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

  
  // Loading states - more granular for better UX
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

  // Optimized admin verification - runs immediately
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
        // Start loading basic data immediately after admin verification
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

  // Fetch basic data (essential info) first
  const fetchBasicData = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentAccount || adminVerified === false) return;
    
    updateLoadingState('basicData', true);
    
    try {
      console.log('🔄 Fetching basic admin data...');
      
      // Fetch essential data in parallel - these are fast queries
      const [cardCount, feeBalance, currentFee] = await Promise.all([
        getCardCount(forceRefresh),
        getPlatformFeeBalance(forceRefresh),
        getPlatformFee(),
      ]);
      
      console.log('📊 Basic data fetched:', { cardCount, feeBalance, currentFee });
      
      setTotalCards(cardCount);
      setPlatformFees(feeBalance / 1_000_000_000);
      setCurrentPlatformFee(currentFee / 1_000_000_000);
      
      // Start loading additional stats in background
      fetchAdditionalStats(forceRefresh);
      
    } catch (error) {
      console.error('❌ Error fetching basic data:', error);
      setError('Failed to load basic admin data');
    } finally {
      updateLoadingState('basicData', false);
    }
  }, [currentAccount, adminVerified, getCardCount, getPlatformFeeBalance, getPlatformFee, getCacheStats, updateLoadingState]);

  // Fetch additional stats (slower queries) in background
  const fetchAdditionalStats = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentAccount || adminVerified === false) return;
    
    updateLoadingState('additionalStats', true);
    
    try {
      console.log('🔄 Fetching additional stats...');
      
      // These are slower queries - fetch them after basic data is shown
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
      // Don't show error for additional stats - they're not critical
    } finally {
      updateLoadingState('additionalStats', false);
    }
  }, [currentAccount, adminVerified, getAllActiveCards, getCardsOpenToWork, updateLoadingState]);

  // Verify admin access on mount and when account changes
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

  // Admin transfer functions
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

  // Withdrawal functions
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

  // Early returns for various states
  if (!currentAccount) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">You need to connect your wallet to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Show skeleton loader during admin verification
  if (loadingStates.adminVerification) {
    return <AdminSkeletonLoader />;
  }

  // Enhanced access denied state
  if (adminVerified === false) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-16 w-16 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You are not authorized to access the admin panel.</p>
          <p className="text-sm text-gray-500 mb-6">Only the contract publisher or transferred admins can access this area.</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={verifyAdminAccess}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Verification</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton loader while basic data is loading
  if (loadingStates.basicData) {
    return <AdminSkeletonLoader />;
  }

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl">
                  <Shield className="h-8 w-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Admin Panel</h1>
                </div>
              <p className="text-xl text-gray-600 mt-1">Platform management and analytics dashboard</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Admin Verified</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loadingStates.refreshing}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loadingStates.refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span>Refresh</span>
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{platformFees.toFixed(2)} SUI</div>
                <div className="text-sm text-gray-600">Platform Fees</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{totalCards.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Cards</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                {loadingStates.additionalStats ? (
                  <div className="text-right">
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="text-sm text-gray-600">Active Cards</div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{activeCards.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Active Cards</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                {loadingStates.additionalStats ? (
                  <div className="text-right">
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="text-sm text-gray-600">Open to Work</div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{openToWorkCards.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Open to Work</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fee Management */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Platform Fee Management</span>
              </h3>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Available Balance</h4>
                    <p className="text-sm text-gray-600">Total accumulated platform fees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{platformFees.toFixed(2)} SUI</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount (SUI)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={platformFees}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleWithdraw}
                    disabled={loadingStates.withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loadingStates.withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Withdraw Fees</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setWithdrawAmount((platformFees * 0.25).toFixed(2))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  25%
                </button>
                <button
                  onClick={() => setWithdrawAmount((platformFees * 0.5).toFixed(2))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => setWithdrawAmount((platformFees * 0.75).toFixed(2))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  75%
                </button>
                <button
                  onClick={() => setWithdrawAmount(platformFees.toFixed(2))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  All
                </button>
              </div>

              <button
                onClick={handleWithdrawAll}
                disabled={loadingStates.withdrawing || platformFees <= 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loadingStates.withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Withdraw All Fees</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Platform Settings */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>Platform Settings</span>
              </h3>
              <div className="space-y-4">
                {/* Platform Fee Setting */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Platform Fee (SUI)
                    </label>
                    {!editingPlatformFee && (
                      <button
                        onClick={handleEditPlatformFee}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Edit platform fee"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {editingPlatformFee ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={newPlatformFee}
                        onChange={(e) => setNewPlatformFee(e.target.value)}
                        min="0"
                        step="0.01"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                        placeholder="0.00"
                      />
                      <button
                        onClick={handleUpdatePlatformFee}
                        disabled={loadingStates.updatingPlatformFee}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {loadingStates.updatingPlatformFee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={handleCancelEditPlatformFee}
                        disabled={loadingStates.updatingPlatformFee}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={`${currentPlatformFee.toFixed(4)} SUI`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Fee for creating developer cards</p>
                </div>

                {/* Admin Address Setting */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Address
                    </label>
                    {!editingAdmin && (
                      <button
                        onClick={handleEditAdmin}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Transfer admin privileges"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {editingAdmin ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newAdminAddress}
                        onChange={(e) => setNewAdminAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 font-mono text-xs"
                        placeholder="0x..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleTransferAdmin}
                          disabled={loadingStates.transferringAdmin || !newAdminAddress.trim()}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                        >
                          {loadingStates.transferringAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                          <span>Transfer Admin</span>
                        </button>
                        <button
                          onClick={handleCancelEditAdmin}
                          disabled={loadingStates.transferringAdmin}
                          className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-700">
                          ⚠️ <strong>Warning:</strong> Transferring admin privileges is irreversible. You will lose all admin access immediately.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={currentAccount.address}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-xs"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Current admin with full platform privileges</p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Status</span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Admin Verification</span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Verified</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network</span>
                  <span className="flex items-center space-x-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Sui Testnet</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Additional Stats</span>
                  <span className="flex items-center space-x-1">
                    {loadingStates.additionalStats ? (
                      <>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-yellow-600">Loading...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Loaded</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default AdminPanel;