import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Edit3, Eye, Mail, ExternalLink, ToggleLeft, ToggleRight, Plus, User, Loader2, RefreshCw, AlertCircle, Shield, CheckCircle, Trash2, Power, PowerOff, Share2, Activity } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData, updateDescriptionTransaction, setWorkAvailabilityTransaction, activateCardTransaction, deactivateCardTransaction, deleteCardTransaction } from '../lib/suiClient';
import { getCardAnalytics, incrementShare, recordToggle } from '../lib/analytics';

// Skeleton components for better loading UX
const StatCardSkeleton: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-24"></div>
  </div>
);

const CardSkeleton: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
    <div className="flex items-start space-x-4 mb-6">
      <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="flex space-x-2">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div className="mb-4">
      <div className="flex space-x-2">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      <div className="h-6 bg-gray-200 rounded-full w-12"></div>
    </div>
  </div>
);

const DashboardSkeletonLoader: React.FC = () => (
  <div className="min-h-screen pt-8 pb-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="flex-1">
          <div className="h-12 bg-gray-200 rounded w-80 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-96 mb-2 animate-pulse"></div>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-6 md:mt-0">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-40 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  </div>
);

const formatRelative = (ts: number | null) => {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { getUserCards, error, updateCardInCache, removeCardFromCache, clearCache, setError } = useContract();
  
  // Enhanced loading states - more granular for better UX
  const [loadingStates, setLoadingStates] = useState({
    initialLoad: true,
    basicData: false,
    refreshing: false,
    userCards: false,
  });

  // State variables
  const [editingDescription, setEditingDescription] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [userCards, setUserCards] = useState<DevCardData[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<number | null>(null);

  const userAddress = useMemo(() => currentAccount?.address || '', [currentAccount]);

  // Update loading state helper
  const updateLoadingState = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset state when account changes
  useEffect(() => {
    if (!currentAccount) {
      setUserCards([]);
      updateLoadingState('initialLoad', true);
      setFetchError(null);
      return;
    }
    
    const newAddress = currentAccount.address;
    if (userAddress && userAddress !== newAddress) {
      console.log(`Account changed from ${userAddress} to ${newAddress}`);
      setUserCards([]);
      updateLoadingState('initialLoad', true);
      setFetchError(null);
      clearCache();
    }
  }, [currentAccount, userAddress, clearCache, updateLoadingState]);

 const fetchUserCards = useCallback(async (forceRefresh: boolean = false) => {
  if (!userAddress) {
    setUserCards([]);
    updateLoadingState('initialLoad', false);
    updateLoadingState('userCards', false);
    return;
  }

  // OPTIMIZATION: Set more granular loading states
  if (forceRefresh) {
    updateLoadingState('refreshing', true);
  } else if (loadingStates.initialLoad) {
    updateLoadingState('basicData', true);
  } else {
    updateLoadingState('userCards', true);
  }
  
  setFetchError(null);

  try {
    console.log(`🔄 Fetching cards for user: ${userAddress}`);
    
    // Start with cached data immediately if available
    let cachedCards: DevCardData[] = [];
    try {
      cachedCards = await getUserCards(userAddress, false);
      if (cachedCards.length > 0 && !forceRefresh) {
        setUserCards(cachedCards);
        updateLoadingState('initialLoad', false);
        updateLoadingState('basicData', false);
      }
    } catch (cacheError) {
      console.warn('Cache retrieval failed, will fetch fresh:', cacheError);
    }
    
    // Fetch fresh data
    const cards = await getUserCards(userAddress, forceRefresh);
    
    // Update if changed
    if (JSON.stringify(cards) !== JSON.stringify(cachedCards)) {
      setUserCards(cards);
    }
    
  } catch (error) {
    console.error('❌ Error fetching user cards:', error);
    setFetchError(error instanceof Error ? error.message : 'Failed to fetch cards');
    setUserCards([]);
  } finally {
    updateLoadingState('initialLoad', false);
    updateLoadingState('basicData', false);
    updateLoadingState('userCards', false);
    updateLoadingState('refreshing', false);
  }
}, [userAddress, getUserCards, loadingStates.initialLoad, updateLoadingState]);

  // Initial load effect
  useEffect(() => {
    if (userAddress) {
      fetchUserCards(false);
    }
  }, [userAddress, fetchUserCards]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setError(null);
    setFetchError(null);
    clearCache();
    fetchUserCards(true);
  }, [clearCache, fetchUserCards, setError]);

  // Updated work availability toggle using the new contract function
  const toggleWorkStatus = async (cardId: number, currentStatus: boolean) => {
    if (!currentAccount) return;

    setUpdating(cardId);
    try {
      const tx = setWorkAvailabilityTransaction(!currentStatus);
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            const updatedCards = userCards.map(card => 
              card.id === cardId 
                ? { ...card, openToWork: !currentStatus }
                : card
            );
            setUserCards(updatedCards);
            
            // Update cache
            const updatedCard = updatedCards.find(card => card.id === cardId);
            if (updatedCard) {
              updateCardInCache(cardId, updatedCard);
              recordToggle(cardId, 'openToWork');
            }
            
            setUpdating(null);
          },
          onError: (error) => {
            console.error('❌ Error updating work status:', error);
            setUpdating(null);
            alert('Failed to update work status. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in toggleWorkStatus:', error);
      setUpdating(null);
    }
  };

  // Updated card activation/deactivation
  const toggleCardActivation = async (cardId: number, currentlyActive: boolean) => {
    if (!currentAccount) return;

    setUpdating(cardId);
    try {
      const tx = currentlyActive ? deactivateCardTransaction() : activateCardTransaction();
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            const updatedCards = userCards.map(card => 
              card.id === cardId 
                ? { 
                    ...card, 
                    isActive: !currentlyActive,
                    openToWork: currentlyActive ? false : card.openToWork
                  }
                : card
            );
            setUserCards(updatedCards);
            
            // Update cache
            const updatedCard = updatedCards.find(card => card.id === cardId);
            if (updatedCard) {
              updateCardInCache(cardId, updatedCard);
              recordToggle(cardId, 'isActive');
            }
            
            setUpdating(null);
          },
          onError: (error) => {
            console.error('❌ Error toggling card activation:', error);
            setUpdating(null);
            alert(`Failed to ${currentlyActive ? 'deactivate' : 'activate'} card. Please try again.`);
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in toggleCardActivation:', error);
      setUpdating(null);
    }
  };

  // Updated description update function
  const updateDescription = async (cardId: number) => {
    if (!currentAccount || !newDescription.trim()) return;

    setUpdating(cardId);
    try {
      const tx = updateDescriptionTransaction(newDescription);
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            const updatedCards = userCards.map(card => 
              card.id === cardId 
                ? { ...card, description: newDescription }
                : card
            );
            setUserCards(updatedCards);
            
            // Update cache
            const updatedCard = updatedCards.find(card => card.id === cardId);
            if (updatedCard) {
              updateCardInCache(cardId, updatedCard);
            }
            
            setEditingDescription(null);
            setNewDescription('');
            setUpdating(null);
          },
          onError: (error) => {
            console.error('❌ Error updating description:', error);
            setUpdating(null);
            alert('Failed to update description. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in updateDescription:', error);
      setUpdating(null);
    }
  };

  // New delete card function
  const deleteCard = async (cardId: number) => {
    if (!currentAccount) return;

    const confirmed = window.confirm('Are you sure you want to delete this card? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingCard(cardId);
    try {
      const tx = deleteCardTransaction();
      
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            // Remove card from local state
            const filteredCards = userCards.filter(card => card.id !== cardId);
            setUserCards(filteredCards);
            
            // Update cache
            removeCardFromCache(cardId, userAddress);
            
            setDeletingCard(null);
          },
          onError: (error) => {
            console.error('❌ Error deleting card:', error);
            setDeletingCard(null);
            alert('Failed to delete card. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('❌ Error in deleteCard:', error);
      setDeletingCard(null);
    }
  };

  const startEditingDescription = (card: DevCardData) => {
    setEditingDescription(card.id);
    setNewDescription(card.description || '');
  };

  const cancelEditingDescription = () => {
    setEditingDescription(null);
    setNewDescription('');
  };

  // Analytics for the first card (single-card dashboard)
  const primaryCard: DevCardData | null = userCards.length > 0 ? userCards[0] : null;
  const analytics = useMemo(() => {
    if (!primaryCard) return null;
    return getCardAnalytics(primaryCard.id);
  }, [primaryCard]);

  // User not connected state
  if (!currentAccount) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">You need to connect your Sui wallet to access your dashboard.</p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Connect your wallet to view and manage your developer card.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton loader during initial load or basic data loading
  if (loadingStates.initialLoad || loadingStates.basicData) {
    return <DashboardSkeletonLoader />;
  }

  // Show error state
  if (error || fetchError) {
    const displayError = fetchError || error;
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Card</h2>
          <p className="text-gray-600 mb-6">{displayError}</p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={loadingStates.refreshing}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loadingStates.refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </button>
            <Link
              to="/create"
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Create New Card
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Manage your developer card and track its performance.
            </p>
            <div className="mt-2 bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <p className="text-sm text-gray-600">
                  Connected: <span className="font-mono text-xs">{userAddress}</span>
                </p>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-6 md:mt-0">
            <button
              onClick={handleRefresh}
              disabled={loadingStates.refreshing}
              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${loadingStates.refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Card</span>
            </Link>
          </div>
        </div>

        {/* Analytics Stats (single card) */}
        {primaryCard && analytics && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-100 rounded-xl"><Eye className="h-5 w-5 text-blue-600" /></div>
                <div className="text-3xl font-bold text-blue-600">{analytics.views}</div>
              </div>
              <div className="mt-3 text-gray-600">Profile Views</div>
              <div className="text-xs text-gray-500 mt-1">Last viewed {formatRelative(analytics.lastViewedAt)}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 rounded-xl"><Share2 className="h-5 w-5 text-purple-600" /></div>
                <div className="text-3xl font-bold text-purple-600">{analytics.shares}</div>
              </div>
              <div className="mt-3 text-gray-600">Shares</div>
              <div className="text-xs text-gray-500 mt-1">Copied link or shared externally</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-100 rounded-xl"><Activity className="h-5 w-5 text-green-600" /></div>
                <div className="text-3xl font-bold text-green-600">{analytics.toggles.isActive}</div>
              </div>
              <div className="mt-3 text-gray-600">Activation Changes</div>
              <div className="text-xs text-gray-500 mt-1">Number of times toggled</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-100 rounded-xl"><Activity className="h-5 w-5 text-orange-600" /></div>
                <div className="text-3xl font-bold text-orange-600">{analytics.toggles.openToWork}</div>
              </div>
              <div className="mt-3 text-gray-600">Availability Changes</div>
              <div className="text-xs text-gray-500 mt-1">Number of times toggled</div>
            </div>
          </div>
        )}

        {/* Card Content */}
        {loadingStates.userCards ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading card...</span>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : !primaryCard ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Developer Card Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your developer card to start showcasing your skills and connecting with opportunities.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your Card</span>
              </Link>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Check Again</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Developer Card</h2>
              <div className="flex items-center space-x-4">
                {loadingStates.refreshing && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  Card ID: {primaryCard.id}
                </span>
              </div>
            </div>
            <div className="w-full">
              {/* Card */}
              <div
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  !primaryCard.isActive ? 'opacity-75 border-red-200' : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start space-x-4 mb-6">
                  <img
                    src={primaryCard.imageUrl}
                    alt={primaryCard.name}
                    className="w-20 h-20 rounded-xl object-cover ring-4 ring-white/50"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryCard.name)}&size=80&background=random`;
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-xl">{primaryCard.name}</h3>
                    <p className="text-blue-600 font-medium text-lg">{primaryCard.title}</p>
                    <p className="text-gray-500 text-sm mt-1">{primaryCard.yearsOfExperience} years experience</p>
                    <p className="text-gray-400 text-xs mt-1">Card ID: {primaryCard.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Card Active/Inactive Toggle */}
                    <button
                      onClick={() => toggleCardActivation(primaryCard.id, primaryCard.isActive)}
                      disabled={updating === primaryCard.id}
                      className={`p-2 rounded-lg transition-colors ${
                        primaryCard.isActive 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      } disabled:opacity-50`}
                      title={primaryCard.isActive ? 'Card is active' : 'Card is inactive'}
                    >
                      {updating === primaryCard.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : primaryCard.isActive ? (
                        <Power className="h-5 w-5" />
                      ) : (
                        <PowerOff className="h-5 w-5" />
                      )}
                    </button>
                    
                    {/* Work Availability Toggle (only if card is active) */}
                    {primaryCard.isActive && (
                      <button
                        onClick={() => toggleWorkStatus(primaryCard.id, primaryCard.openToWork)}
                        disabled={updating === primaryCard.id}
                        className={`p-2 rounded-lg transition-colors ${
                          primaryCard.openToWork 
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title={primaryCard.openToWork ? 'Available for work' : 'Not available for work'}
                      >
                        {updating === primaryCard.id ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : primaryCard.openToWork ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteCard(primaryCard.id)}
                      disabled={deletingCard === primaryCard.id}
                      className="p-2 rounded-lg transition-colors bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                      title="Delete card"
                    >
                      {deletingCard === primaryCard.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mb-4 flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    primaryCard.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {primaryCard.isActive ? 'Active' : '❌ Inactive'}
                  </span>
                  {primaryCard.isActive && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      primaryCard.openToWork 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {primaryCard.openToWork ? '🟢 Available for work' : '⚫ Not available'}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Description</h4>
                    {editingDescription !== primaryCard.id && primaryCard.isActive && (
                      <button
                        onClick={() => startEditingDescription(primaryCard)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {editingDescription === primaryCard.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter description..."
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateDescription(primaryCard.id)}
                          disabled={updating === primaryCard.id || !newDescription.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {updating === primaryCard.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>Save</span>
                          )}
                        </button>
                        <button
                          onClick={cancelEditingDescription}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      {primaryCard.description || 'No description provided'}
                    </p>
                  )}
                </div>

                {/* Technologies */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {primaryCard.technologies.split(',').map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{primaryCard.contact}</span>
                    </div>
                    {primaryCard.portfolio && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                        <a
                          href={primaryCard.portfolio.startsWith('http') ? primaryCard.portfolio : `https://${primaryCard.portfolio}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/card/${primaryCard.id}`}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">View Public Card</span>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/card/${primaryCard.id}`);
                        incrementShare(primaryCard.id);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm inline-flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;