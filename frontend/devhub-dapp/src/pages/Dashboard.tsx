import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Edit3, Eye, Mail, ExternalLink, ToggleLeft, ToggleRight, Plus, User, Loader2 } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import { updateDescriptionTransaction, toggleWorkStatusTransaction } from '../lib/suiClient';

const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { getUserCards } = useContract();
  const [editingDescription, setEditingDescription] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [userCards, setUserCards] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserCards = async () => {
      if (!currentAccount) return;
      
      setLoading(true);
      try {
        const cards = await getUserCards(currentAccount.address);
        setUserCards(cards);
      } catch (error) {
        console.error('Error fetching user cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCards();
  }, [currentAccount, getUserCards]);

  const toggleWorkStatus = async (cardId: number, currentStatus: boolean) => {
    if (!currentAccount) return;

    setUpdating(cardId);
    try {
      const tx = toggleWorkStatusTransaction(cardId, !currentStatus);
      
      signAndExecute(
        {
          transaction: tx, // tx must be a TransactionBlock instance
        },
        {
          onSuccess: () => {
            setUserCards(prev => prev.map(card => 
              card.id === cardId 
                ? { ...card, openToWork: !currentStatus }
                : card
            ));
            setUpdating(null);
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
            setUserCards(prev => prev.map(card => 
              card.id === cardId 
                ? { ...card, description: newDescription }
                : card
            ));
            setEditingDescription(null);
            setNewDescription('');
            setUpdating(null);
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

 
  if (!currentAccount) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">You need to connect your Sui wallet to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your developer cards...</p>
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
          </div>
          <Link
            to="/create"
            className="mt-6 md:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Card</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{userCards.length}</div>
            <div className="text-gray-600">Total Cards</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {userCards.filter(card => card.openToWork).length}
            </div>
            <div className="text-gray-600">Available</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">-</div>
            <div className="text-gray-600">Profile Views</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">-</div>
            <div className="text-gray-600">Inquiries</div>
          </div>
        </div>

        {/* Cards */}
        {userCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Developer Cards Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first developer card to start showcasing your skills and connecting with opportunities.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Card</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Developer Cards</h2>
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
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-xl">{card.name}</h3>
                      <p className="text-blue-600 font-medium text-lg">{card.title}</p>
                      <p className="text-gray-500 text-sm mt-1">{card.yearsOfExperience} years experience</p>
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
                      <h4 className="font-semibold text-gray-900">Description</h4>
                      {editingDescription !== card.id && (
                        <button
                          onClick={() => startEditingDescription(card)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit description"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Add a description..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateDescription(card.id)}
                            disabled={updating === card.id}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            {updating === card.id && <Loader2 className="h-4 w-4 animate-spin" />}
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingDescription(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">
                        {card.description || 'No description added yet.'}
                      </p>
                    )}
                  </div>

                  {/* Technologies */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {card.technologies.split(', ').map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`mailto:${card.contact}`}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                      <a
                        href={card.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Portfolio"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link
                        to={`/card/${card.id}`}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="View Public Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
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