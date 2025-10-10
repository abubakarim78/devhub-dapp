import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Edit3, Eye, Mail, ExternalLink, ToggleLeft, ToggleRight, Plus, User, Loader2, RefreshCw, AlertCircle, Shield, CheckCircle, Trash2, Power, PowerOff, Share2, Activity, X, Star, Code2, Calendar, Clock } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData, updateDescriptionTransaction, setWorkAvailabilityTransaction, activateCardTransaction, deactivateCardTransaction, deleteCardTransaction, editDevCardTransaction } from '../lib/suiClient';
import { getCardAnalytics, incrementShare, recordToggle } from '../lib/analytics';
import StarBackground from '@/components/common/StarBackground';
import { motion } from 'framer-motion';

// Toast Component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl ${type === 'success'
          ? 'bg-green-500/20 border border-green-500/40'
          : 'bg-red-500/20 border border-red-500/40'
        }`}>
        {type === 'success' ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-400" />
        )}
        <span className={`font-medium ${type === 'success' ? 'text-green-100' : 'text-red-100'
          }`}>
          {message}
        </span>
        <button
          onClick={onClose}
          className={`ml-2 ${type === 'success' ? 'text-green-300 hover:text-green-100' : 'text-red-300 hover:text-red-100'
            }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Skeleton components
const StatCardSkeleton: React.FC = () => (
  <div className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl animate-pulse">
    <div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
    <div className="h-4 bg-gray-700 rounded w-24"></div>
  </div>
);

const CardSkeleton: React.FC = () => (
  <div className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl animate-pulse">
    <div className="flex items-start space-x-4 mb-6">
      <div className="w-20 h-20 bg-gray-700 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-700 rounded w-1/2 mb-1"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

const DashboardSkeletonLoader: React.FC = () => (
  <div className="bg-black min-h-screen pt-32 pb-16 relative">
    <StarBackground />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="flex-1">
          <div className="h-12 bg-gray-700 rounded w-80 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-700 rounded w-96 animate-pulse"></div>
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <CardSkeleton />
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

// Edit Card Modal Component
interface EditCardModalProps {
  card: DevCardData;
  onClose: () => void;
  onSave: (cardData: any) => void;
  isEditing: boolean;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ card, onClose, onSave, isEditing }) => {
  const [formData, setFormData] = useState({
    name: card.name,
    description: card.description,
    title: card.title,
    imageUrl: card.imageUrl,
    yearsOfExperience: card.yearsOfExperience,
    technologies: card.technologies,
    portfolio: card.portfolio,
    contact: card.contact,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Edit DevCard</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Technologies
              </label>
              <input
                type="text"
                value={formData.technologies}
                onChange={(e) => handleChange('technologies', e.target.value)}
                placeholder="e.g., React, TypeScript, Node.js"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) => handleChange('portfolio', e.target.value)}
                placeholder="https://your-portfolio.com"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                placeholder="Email, Twitter, LinkedIn, etc."
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditing}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/25"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Card'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { getUserCards, error, updateCardInCache, removeCardFromCache, clearCache, setError } = useContract();

  const [loadingStates, setLoadingStates] = useState({
    initialLoad: true,
    basicData: false,
    refreshing: false,
    userCards: false,
  });

  const [editingDescription, setEditingDescription] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [userCards, setUserCards] = useState<DevCardData[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const userAddress = useMemo(() => currentAccount?.address || '', [currentAccount]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const closeToast = () => {
    setToast(null);
  };

  const updateLoadingState = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (!currentAccount) {
      setUserCards([]);
      updateLoadingState('initialLoad', true);
      setFetchError(null);
      return;
    }

    const newAddress = currentAccount.address;
    if (userAddress && userAddress !== newAddress) {
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

    if (forceRefresh) {
      updateLoadingState('refreshing', true);
    } else if (loadingStates.initialLoad) {
      updateLoadingState('basicData', true);
    } else {
      updateLoadingState('userCards', true);
    }

    setFetchError(null);

    try {
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

      const cards = await getUserCards(userAddress, forceRefresh);

      if (JSON.stringify(cards) !== JSON.stringify(cachedCards)) {
        setUserCards(cards);
      }

    } catch (error) {
      console.error('Error fetching user cards:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch cards');
      setUserCards([]);
    } finally {
      updateLoadingState('initialLoad', false);
      updateLoadingState('basicData', false);
      updateLoadingState('userCards', false);
      updateLoadingState('refreshing', false);
    }
  }, [userAddress, getUserCards, loadingStates.initialLoad, updateLoadingState]);

  useEffect(() => {
    if (userAddress) {
      fetchUserCards(false);
    }
  }, [userAddress, fetchUserCards]);

  const handleRefresh = useCallback(() => {
    setError(null);
    setFetchError(null);
    clearCache();
    fetchUserCards(true);
  }, [clearCache, fetchUserCards, setError]);

  const toggleWorkStatus = async (cardId: number, currentStatus: boolean) => {
    if (!currentAccount) return;

    setUpdating(cardId);
    try {
      const tx = setWorkAvailabilityTransaction(!currentStatus);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            const updatedCards = userCards.map(card =>
              card.id === cardId
                ? { ...card, openToWork: !currentStatus }
                : card
            );
            setUserCards(updatedCards);

            const updatedCard = updatedCards.find(card => card.id === cardId);
            if (updatedCard) {
              updateCardInCache(cardId, updatedCard);
              recordToggle(cardId, 'openToWork');
            }

            showToast('Work status updated successfully!', 'success');
            setUpdating(null);
          },
          onError: (error) => {
            console.error('Error updating work status:', error);
            setUpdating(null);
            showToast('Failed to update work status', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error in toggleWorkStatus:', error);
      setUpdating(null);
    }
  };

  const toggleCardActivation = async (cardId: number, currentlyActive: boolean) => {
    if (!currentAccount) return;

    setUpdating(cardId);
    try {
      const tx = currentlyActive ? deactivateCardTransaction() : activateCardTransaction();

      signAndExecute(
        { transaction: tx },
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

            const updatedCard = updatedCards.find(card => card.id === cardId);
            if (updatedCard) {
              updateCardInCache(cardId, updatedCard);
              recordToggle(cardId, 'isActive');
            }

            showToast(`Card ${currentlyActive ? 'deactivated' : 'activated'} successfully!`, 'success');
            setUpdating(null);
          },
          onError: (error) => {
            console.error('Error toggling card activation:', error);
            setUpdating(null);
            showToast('Failed to toggle card activation', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error in toggleCardActivation:', error);
      setUpdating(null);
    }
  };

  const updateDescription = async (cardId: number) => {
    if (!currentAccount || !newDescription.trim()) return;

    setUpdating(cardId);
    try {
      const tx = updateDescriptionTransaction(newDescription);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            const updatedCards = userCards.map(card =>
              card.id === cardId
                ? { ...card, description: newDescription }
                : card
            );
            setUserCards(updatedCards);

            const updatedCard = updatedCards.find(card => card.id === cardId);
            if (updatedCard) {
              updateCardInCache(cardId, updatedCard);
            }

            setEditingDescription(null);
            setNewDescription('');
            showToast('Description updated successfully!', 'success');
            setUpdating(null);
          },
          onError: (error) => {
            console.error('Error updating description:', error);
            setUpdating(null);
            showToast('Failed to update description', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error in updateDescription:', error);
      setUpdating(null);
    }
  };

  const deleteCard = async (cardId: number) => {
    if (!currentAccount) return;

    const confirmed = window.confirm('Are you sure you want to delete this card? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingCard(cardId);
    try {
      const tx = deleteCardTransaction();

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            const filteredCards = userCards.filter(card => card.id !== cardId);
            setUserCards(filteredCards);
            removeCardFromCache(cardId, userAddress);
            showToast('Card deleted successfully!', 'success');
            setDeletingCard(null);
          },
          onError: (error) => {
            console.error('Error deleting card:', error);
            setDeletingCard(null);
            showToast('Failed to delete card', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error in deleteCard:', error);
      setDeletingCard(null);
    }
  };

  const handleEditCard = async (cardData: any) => {
    if (!currentAccount || !primaryCard) return;

    setEditingCard(primaryCard.id);
    try {
      const tx = editDevCardTransaction(cardData);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            const updatedCard = { ...primaryCard, ...cardData };
            setUserCards([updatedCard]);
            updateCardInCache(primaryCard.id, updatedCard);
            setEditingCard(null);
            setShowEditModal(false);
            showToast('DevCard updated successfully!', 'success');
          },
          onError: (error) => {
            console.error('Error editing card:', error);
            setEditingCard(null);
            showToast('Failed to update card', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error in handleEditCard:', error);
      setEditingCard(null);
      showToast('Failed to update card', 'error');
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

  const primaryCard: DevCardData | null = userCards.length > 0 ? userCards[0] : null;
  const analytics = useMemo(() => {
    if (!primaryCard) return null;
    return getCardAnalytics(primaryCard.id);
  }, [primaryCard]);

  // User not connected state
  if (!currentAccount) {
    return (
      <div className="bg-black min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30"
          >
            <User className="h-16 w-16 text-blue-400" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8 text-lg">You need to connect your Sui wallet to access your dashboard.</p>
          <div className="bg-blue-500/10 backdrop-blur-sm p-6 rounded-xl border border-blue-500/30 max-w-md mx-auto">
            <p className="text-blue-300">
              Connect your wallet to view and manage your developer card.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingStates.initialLoad || loadingStates.basicData) {
    return <DashboardSkeletonLoader />;
  }

  if (error || fetchError) {
    const displayError = fetchError || error;
    return (
      <div className="bg-black min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center max-w-lg mx-auto relative z-10 px-4">
          <div className="w-32 h-32 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <AlertCircle className="h-16 w-16 text-red-400" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Unable to Load Card</h2>
          <p className="text-gray-400 mb-8 text-lg">{displayError}</p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={loadingStates.refreshing}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
            >
              {loadingStates.refreshing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </button>
            <Link
              to="/create"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 transition-all shadow-lg shadow-green-500/25"
            >
              Create New Card
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const technologies = primaryCard ? primaryCard.technologies.split(', ') : [];

  return (
    <div className="bg-black min-h-screen text-white relative">
      <StarBackground />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-12"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Your Dashboard
              </h1>
              <p className="text-xl text-gray-400 mb-4">
                Manage your developer card and track its performance.
              </p>
              <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50 inline-flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-400" />
                <p className="text-sm text-gray-300">
                  Connected: <span className="font-mono text-xs text-blue-400">{userAddress.slice(0, 8)}...{userAddress.slice(-6)}</span>
                </p>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-6 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={loadingStates.refreshing}
                className="p-4 bg-gray-900/70 backdrop-blur-xl text-gray-300 rounded-xl hover:bg-gray-800/70 transition-all disabled:opacity-50 border border-gray-700/50 shadow-lg"
                title="Refresh data"
              >
                <RefreshCw className={`h-6 w-6 ${loadingStates.refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                to="/create"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-6 w-6" />
                <span>Create New Card</span>
              </Link>
            </div>
          </motion.div>

          {/* Analytics Stats */}
          {primaryCard && analytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid md:grid-cols-4 gap-6 mb-12"
            >
              <div className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-blue-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                    <Eye className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-4xl font-bold text-blue-400">{analytics.views}</div>
                </div>
                <div className="text-gray-300 font-medium">Profile Views</div>
                <div className="text-xs text-gray-500 mt-2">Last viewed {formatRelative(analytics.lastViewedAt)}</div>
              </div>

              <div className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-purple-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                    <Share2 className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-4xl font-bold text-purple-400">{analytics.shares}</div>
                </div>
                <div className="text-gray-300 font-medium">Shares</div>
                <div className="text-xs text-gray-500 mt-2">Link copied or shared</div>
              </div>

              <div className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-green-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                    <Activity className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="text-4xl font-bold text-green-400">{analytics.toggles.isActive}</div>
                </div>
                <div className="text-gray-300 font-medium">Activation Changes</div>
                <div className="text-xs text-gray-500 mt-2">Times toggled</div>
              </div>

              <div className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:border-orange-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                    <Activity className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="text-4xl font-bold text-orange-400">{analytics.toggles.openToWork}</div>
                </div>
                <div className="text-gray-300 font-medium">Availability Changes</div>
                <div className="text-xs text-gray-500 mt-2">Times toggled</div>
              </div>
            </motion.div>
          )}

          {/* Card Content */}
          {loadingStates.userCards ? (
            <div className="space-y-6">
              <CardSkeleton />
            </div>
          ) : !primaryCard ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-32 h-32 bg-gray-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-700/50">
                <Plus className="h-16 w-16 text-gray-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">No Developer Card Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
                Create your developer card to start showcasing your skills and connecting with opportunities.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Link
                  to="/create"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-6 w-6" />
                  <span>Create Your Card</span>
                </Link>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-800/50 backdrop-blur-xl text-gray-300 font-semibold rounded-xl hover:bg-gray-700/50 transition-all border border-gray-700/50"
                >
                  <RefreshCw className="h-6 w-6" />
                  <span>Check Again</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Your Developer Card</h2>
                {loadingStates.refreshing && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </div>
                )}
              </div>

              {/* Main Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`bg-gray-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl ${!primaryCard.isActive ? 'opacity-75 border-red-500/30' : ''
                  }`}
              >
                {/* Card Header */}
                <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                  <img
                    src={primaryCard.imageUrl}
                    alt={primaryCard.name}
                    className="w-40 h-40 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-2xl shadow-blue-500/20"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryCard.name)}&size=160&background=random`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {primaryCard.name}
                        </h1>
                        <p className="text-2xl text-blue-400 font-semibold mb-4">{primaryCard.title}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                      <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/30">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <span>{primaryCard.yearsOfExperience} years experience</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/30">
                        <Calendar className="h-5 w-5 text-purple-400" />
                        <span>Card #{primaryCard.id}</span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-full font-semibold border-2 ${primaryCard.isActive
                        ? primaryCard.openToWork
                          ? 'bg-green-500/20 text-green-400 border-green-500/40'
                          : 'bg-gray-700/50 text-gray-400 border-gray-600/40'
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${primaryCard.isActive
                          ? primaryCard.openToWork ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                          : 'bg-red-400 animate-pulse'
                        }`}></div>
                      <span>
                        {!primaryCard.isActive
                          ? 'Card Inactive'
                          : primaryCard.openToWork
                            ? 'Available for work'
                            : 'Currently unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col items-center gap-3">
                    <button
                      onClick={() => toggleCardActivation(primaryCard.id, primaryCard.isActive)}
                      disabled={updating === primaryCard.id}
                      className={`p-3 rounded-xl transition-all ${primaryCard.isActive
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                        } disabled:opacity-50`}
                      title={primaryCard.isActive ? 'Card is active' : 'Card is inactive'}
                    >
                      {updating === primaryCard.id ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : primaryCard.isActive ? (
                        <Power className="h-6 w-6" />
                      ) : (
                        <PowerOff className="h-6 w-6" />
                      )}
                    </button>

                    {primaryCard.isActive && (
                      <button
                        onClick={() => toggleWorkStatus(primaryCard.id, primaryCard.openToWork)}
                        disabled={updating === primaryCard.id}
                        className={`p-3 rounded-xl transition-all border ${primaryCard.openToWork
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30'
                            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700/70 border-gray-600/30'
                          } disabled:opacity-50`}
                        title={primaryCard.openToWork ? 'Available for work' : 'Not available for work'}
                      >
                        {updating === primaryCard.id ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : primaryCard.openToWork ? (
                          <ToggleRight className="h-7 w-7" />
                        ) : (
                          <ToggleLeft className="h-7 w-7" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setShowEditModal(true)}
                      className="p-3 rounded-xl transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                      title="Edit card"
                    >
                      <Edit3 className="h-6 w-6" />
                    </button>

                    <button
                      onClick={() => deleteCard(primaryCard.id)}
                      disabled={deletingCard === primaryCard.id}
                      className="p-3 rounded-xl transition-all bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 border border-red-500/30"
                      title="Delete card"
                    >
                      {deletingCard === primaryCard.id ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Trash2 className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {(primaryCard.description || editingDescription === primaryCard.id) && (
                  <div className="pt-6 border-t border-gray-700/50 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span>About</span>
                      </h3>
                      {editingDescription !== primaryCard.id && primaryCard.isActive && (
                        <button
                          onClick={() => startEditingDescription(primaryCard)}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    {editingDescription === primaryCard.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                          rows={4}
                          placeholder="Enter description..."
                        />
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateDescription(primaryCard.id)}
                            disabled={updating === primaryCard.id || !newDescription.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-blue-500/25"
                          >
                            {updating === primaryCard.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span>Save</span>
                            )}
                          </button>
                          <button
                            onClick={cancelEditingDescription}
                            className="px-6 py-2.5 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700/70 font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300 leading-relaxed text-lg">
                        {primaryCard.description || 'No description provided'}
                      </p>
                    )}
                  </div>
                )}

                {/* Technologies */}
                {technologies.length > 0 && (
                  <div className="pt-6 border-t border-gray-700/50 mb-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                      <Code2 className="h-6 w-6 text-blue-400" />
                      <span>Technologies & Skills</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {technologies.map((tech, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="flex items-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 hover:border-blue-400/50 transition-all group cursor-pointer"
                        >
                          <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:scale-125 transition-transform"></div>
                          <span className="text-blue-300 font-medium group-hover:text-blue-200 transition-colors">{tech}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="pt-6 border-t border-gray-700/50 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <a
                      href={`mailto:${primaryCard.contact}`}
                      className="flex items-center space-x-4 p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all group border border-blue-500/30 hover:border-blue-400/50 transform hover:scale-[1.02]"
                    >
                      <div className="p-3 bg-blue-600 text-white rounded-xl group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white mb-1">Send Email</div>
                        <div className="text-sm text-blue-300 truncate">{primaryCard.contact}</div>
                      </div>
                    </a>
                    {primaryCard.portfolio && (
                      <a
                        href={primaryCard.portfolio.startsWith('http') ? primaryCard.portfolio : `https://${primaryCard.portfolio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-4 p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-all group border border-gray-600/30 hover:border-gray-500/50 transform hover:scale-[1.02]"
                      >
                        <div className="p-3 bg-gray-600 text-white rounded-xl group-hover:bg-gray-500 transition-colors">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white mb-1">View Portfolio</div>
                          <div className="text-sm text-gray-400">External link</div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-700/50">
                  <Link
                    to={`/card/${primaryCard.id}`}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-blue-400 hover:text-blue-300 transition-all rounded-xl border border-gray-700/30 hover:border-gray-600/50 font-semibold"
                  >
                    <Eye className="h-5 w-5" />
                    <span>View Public Card</span>
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/card/${primaryCard.id}`);
                      incrementShare(primaryCard.id);
                      showToast('Link copied to clipboard!', 'success');
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/25"
                  >
                    <Share2 className="h-5 w-5" />
                    <span>Share Card</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Card Modal */}
      {showEditModal && primaryCard && (
        <EditCardModal
          card={primaryCard}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditCard}
          isEditing={editingCard === primaryCard.id}
        />
      )}
    </div>
  );
};

export default Dashboard;