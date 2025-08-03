import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Shield, DollarSign, Users, TrendingUp, UserCheck, Settings, Loader2, RefreshCw } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { withdrawFeesTransaction, withdrawAllFeesTransaction } from '../lib/suiClient';

interface AdminPanelProps {
  isAdmin: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ }) => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { 
    getCardCount, 
    getPlatformFeeBalance, 
    isAdmin: checkIsAdmin,
    getAllActiveCards,
    getCardsOpenToWork,
    clearCache,
    getCacheStats
  } = useContract();
  
  const [platformFees, setPlatformFees] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [activeCards, setActiveCards] = useState(0);
  const [openToWorkCards, setOpenToWorkCards] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const fetchAdminData = async (forceRefresh: boolean = false) => {
    if (!currentAccount) return;
    
    const loadingState = forceRefresh ? setRefreshing : setLoading;
    loadingState(true);
    
    try {
      console.log('🔄 Fetching admin data...', { forceRefresh });
      
      const [cardCount, feeBalance, adminStatus] = await Promise.all([
        getCardCount(forceRefresh),
        getPlatformFeeBalance(forceRefresh),
        checkIsAdmin(currentAccount.address, forceRefresh),
      ]);
      
      console.log('📊 Admin data fetched:', { cardCount, feeBalance, adminStatus });
      
      setTotalCards(cardCount);
      setPlatformFees(feeBalance / 1_000_000_000); // Convert from MIST to SUI
      setIsAdminUser(adminStatus);
      
      // Fetch additional stats if user is admin
      if (adminStatus) {
        try {
          const [activeCardsData, openToWorkCardsData] = await Promise.all([
            getAllActiveCards(forceRefresh),
            getCardsOpenToWork(forceRefresh),
          ]);
          
          setActiveCards(activeCardsData.length);
          setOpenToWorkCards(openToWorkCardsData.length);
          
          console.log('📈 Additional stats:', { 
            activeCards: activeCardsData.length, 
            openToWork: openToWorkCardsData.length 
          });
        } catch (error) {
          console.warn('⚠️ Error fetching additional stats:', error);
        }
      }
      
      // Update cache stats
      setCacheStats(getCacheStats());
      
    } catch (error) {
      console.error('❌ Error fetching admin data:', error);
    } finally {
      loadingState(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentAccount]);

  const handleRefresh = () => {
    fetchAdminData(true);
  };

  const handleClearCache = () => {
    clearCache();
    setCacheStats(getCacheStats());
    fetchAdminData(true);
  };

  const handleWithdraw = async () => {
    if (!currentAccount) return;
    
    const amount = parseFloat(withdrawAmount);
    const amountInMist = Math.floor(amount * 1_000_000_000); // Convert SUI to MIST and ensure integer
    
    if (amount <= 0 || amount > platformFees) {
      alert('Invalid withdrawal amount');
      return;
    }

    setWithdrawing(true);
    try {
      console.log('💰 Withdrawing fees:', { amount, amountInMist });
      const tx = withdrawFeesTransaction(currentAccount.address, amountInMist);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            console.log('✅ Withdrawal successful');
            setPlatformFees(prev => prev - amount);
            setWithdrawAmount('');
            setWithdrawing(false);
            alert(`Successfully withdrew ${amount} SUI`);
            // Refresh data after successful withdrawal
            fetchAdminData(true);
          },
          onError: (error: Error) => {
            console.error('❌ Error withdrawing fees:', error.message);
            setWithdrawing(false);
            alert('Failed to withdraw fees. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in withdrawal process:', error);
      setWithdrawing(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!currentAccount || platformFees <= 0) return;

    setWithdrawing(true);
    try {
      console.log('💰 Withdrawing all fees:', { platformFees });
      const tx = withdrawAllFeesTransaction();
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            const withdrawnAmount = platformFees;
            console.log('✅ Withdraw all successful');
            setPlatformFees(0);
            setWithdrawAmount('');
            setWithdrawing(false);
            alert(`Successfully withdrew all ${withdrawnAmount.toFixed(2)} SUI`);
            // Refresh data after successful withdrawal
            fetchAdminData(true);
          },
          onError: (error) => {
            console.error('❌ Error withdrawing all fees:', error);
            setWithdrawing(false);
            alert('Failed to withdraw fees. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in withdrawal process:', error);
      setWithdrawing(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Admin Panel</h2>
          <p className="text-gray-600">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have admin privileges to access this panel.</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
          >
            {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xl text-gray-600">Platform management and analytics dashboard</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
                <div className="text-2xl font-bold text-gray-900">{activeCards.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Active Cards</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{openToWorkCards.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Open to Work</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fee Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* Withdraw Fees */}
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
                    <div className="text-sm text-green-700">~${(platformFees * 2.3).toFixed(2)} USD</div>
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
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
                disabled={withdrawing || platformFees <= 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee (SUI)
                  </label>
                  <input
                    type="number"
                    value="0.1"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fee for creating developer cards</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Address
                  </label>
                  <input
                    type="text"
                    value={currentAccount.address}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-xs"
                  />
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
                  <span className="text-sm text-gray-600">Blockchain Connection</span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Connected</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network</span>
                  <span className="flex items-center space-x-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Sui Testnet</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Statistics */}
            {cacheStats && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cache Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cached Cards</span>
                    <span className="font-medium">{cacheStats.validCards}/{cacheStats.totalCards}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">User Caches</span>
                    <span className="font-medium">{cacheStats.validUserCaches}/{cacheStats.totalUserCaches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Card Count Cache</span>
                    <span className={`font-medium ${cacheStats.cardCountValid ? 'text-green-600' : 'text-red-600'}`}>
                      {cacheStats.cardCountValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;