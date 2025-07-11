import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Edit3, Eye, Mail, ExternalLink, ToggleLeft, ToggleRight, Plus, User, Loader2, RefreshCw, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import { updateDescriptionTransaction, toggleWorkStatusTransaction } from '../lib/suiClient';

const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { getUserCards, getAllCards, loading, error, updateCardInCache, clearCache, setError } = useContract();
  const [editingDescription, setEditingDescription] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [userCards, setUserCards] = useState<DevCardData[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const userAddress = useMemo(() => currentAccount?.address || '', [currentAccount]);

  // Reset state when account changes
  useEffect(() => {
    if (!currentAccount) {
      setUserCards([]);
      setInitialLoad(true);
      setFetchError(null);
      return;
    }
    
    const newAddress = currentAccount.address;
    if (userAddress && userAddress !== newAddress) {
      console.log(`Account changed from ${userAddress} to ${newAddress}`);
      setUserCards([]);
      setInitialLoad(true);
      setFetchError(null);
      clearCache();
    }
  }, [currentAccount, userAddress, clearCache]);

  // Fetch user cards with improved error handling
  const fetchUserCards = useCallback(async (showRefreshLoader = false) => {
    if (!userAddress) {
      setUserCards([]);
      setInitialLoad(false);
      return;
    }

    if (showRefreshLoader) setRefreshing(true);
    setFetchError(null);

    try {
      console.log(`Fetching cards for user: ${userAddress}`);
      
      // First try to get user-specific cards
      let cards = await getUserCards(userAddress);
      
      // If no cards found or empty result, try alternative approach
      if (!cards || cards.length === 0) {
        console.log('No cards found with getUserCards, trying getAllCards approach...');
        const allCards = await getAllCards();
        cards = allCards.filter(card => card.owner === userAddress);
        console.log(`Found ${cards.length} cards for user from getAllCards`);
      }

      // Validate cards belong to current user
      const validCards = cards.filter(card => card.owner === userAddress);
      console.log(`Final validated cards count: ${validCards.length}`);

      setUserCards(validCards);
      setInitialLoad(false);
      
    } catch (error) {
      console.error('Error fetching user cards:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch cards');
      setUserCards([]);
      setInitialLoad(false);
    } finally {
      if (showRefreshLoader) setRefreshing(false);
    }
  }, [userAddress, getUserCards, getAllCards]);

  // Initial load effect
  useEffect(() => {
    if (userAddress) {
      fetchUserCards(false);
    }
  }, [userAddress, fetchUserCards]);

  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    setError(null);
    setFetchError(null);
    clearCache();
    fetchUserCards(true);
  }, [clearCache, fetchUserCards, setError]);

  const toggleWorkStatus = async (cardId: number, currentStatus: boolean) => {
    if (!currentAccount) return;

    setUpdating(cardId);
    try {
      const tx = toggleWorkStatusTransaction(cardId, !currentStatus);
      
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
            }
            
            setUpdating(null);
            console.log(`Work status updated for card ${cardId}: ${!currentStatus}`);
          },
          onError: (error) => {
            console.error('Error updating work status:', error);
            setUpdating(null);
            alert('Failed to update work status. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('Error in toggleWorkStatus:', error);
      setUpdating(null);
    }
  };

  const updateDescription = async (cardId: number) => {
    if (!currentAccount || !newDescription.trim()) return;

    setUpdating(cardId);
    try {
      const tx = updateDescriptionTransaction(cardId, newDescription);
      
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
            console.log(`Description updated for card ${cardId}`);
          },
          onError: (error) => {
            console.error('Error updating description:', error);
            setUpdating(null);
            alert('Failed to update description. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('Error in updateDescription:', error);
      setUpdating(null);
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

  // Memoize stats to prevent unnecessary recalculations
  const stats = useMemo(() => ({
    totalCards: userCards.length,
    availableCards: userCards.filter(card => card.openToWork).length,
    profileViews: '-', // Placeholder for future implementation
    inquiries: '-', // Placeholder for future implementation
  }), [userCards]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

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
              Connect your wallet to view and manage your developer cards.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading only on initial load
  if (initialLoad && loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your developer cards...</p>
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">
              Connected as: <span className="font-mono text-xs">{userAddress}</span>
            </p>
          </div>
        </div>
      </div>
    );
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Cards</h2>
          <p className="text-gray-600 mb-6">{displayError}</p>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
            <div className="text-sm text-red-800 space-y-2">
              <p>Connected wallet: <span className="font-mono">{userAddress}</span></p>
              <p>This could be due to:</p>
              <ul className="list-disc list-inside text-left space-y-1">
                <li>Network connectivity issues</li>
                <li>Blockchain node problems</li>
                <li>Contract configuration issues</li>
                <li>No cards created yet</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {refreshing ? (
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
              Manage your developer cards and track your profile performance.
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
              disabled={refreshing}
              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
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

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalCards}</div>
            <div className="text-gray-600">Total Cards</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.availableCards}</div>
            <div className="text-gray-600">Available</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.profileViews}</div>
            <div className="text-gray-600">Profile Views</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.inquiries}</div>
            <div className="text-gray-600">Inquiries</div>
          </div>
        </div>

        {/* Cards Content */}
        {loading && !initialLoad ? (
          <LoadingSkeleton />
        ) : userCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Developer Cards Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first developer card to start showcasing your skills and connecting with opportunities.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-8">
              <p className="text-sm text-blue-800">
                Cards created with this wallet ({userAddress.slice(0, 6)}...{userAddress.slice(-4)}) will appear here.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Card</span>
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
              <h2 className="text-2xl font-bold text-gray-900">Your Developer Cards</h2>
              <div className="flex items-center space-x-4">
                {refreshing && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  {userCards.length} card{userCards.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              {userCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="flex items-start space-x-4 mb-6">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-20 h-20 rounded-xl object-cover ring-4 ring-white/50"
                      onError={(e) => {
                        // Fallback for broken images
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.name)}&size=80&background=random`;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-xl">{card.name}</h3>
                      <p className="text-blue-600 font-medium text-lg">{card.title}</p>
                      <p className="text-gray-500 text-sm mt-1">{card.yearsOfExperience} years experience</p>
                      <p className="text-gray-400 text-xs mt-1">Card ID: {card.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleWorkStatus(card.id, card.openToWork)}
                        disabled={updating === card.id}
                        className={`p-2 rounded-lg transition-colors ${
                          card.openToWork 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title={card.openToWork ? 'Available for work' : 'Not available'}
                      >
                        {updating === card.id ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : card.openToWork ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      card.openToWork 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {card.openToWork ? '🟢 Available for work' : '⚫ Not available'}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Description</h4>
                      {editingDescription !== card.id && (
                        <button
                          onClick={() => startEditingDescription(card)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {editingDescription === card.id ? (
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
                            onClick={() => updateDescription(card.id)}
                            disabled={updating === card.id || !newDescription.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {updating === card.id ? (
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
                        {card.description || 'No description provided'}
                      </p>
                    )}
                  </div>

                  {/* Technologies */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {card.technologies.split(',').map((tech: string, index: number) => (
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
                        <span>{card.contact}</span>
                      </div>
                      {card.portfolio && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <ExternalLink className="h-4 w-4" />
                          <a
                            href={card.portfolio.startsWith('http') ? card.portfolio : `https://${card.portfolio}`}
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
                      to={`/card/${card.id}`}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">View Public Card</span>
                    </Link>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/card/${card.id}`);
                          // You could add a toast notification here
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;