import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Edit3, Eye, Mail, ExternalLink, ToggleLeft, ToggleRight, Plus,
Trash2, User } from 'lucide-react';

// Updated DevCard interface to match CreateCard component
interface DevCard {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
  createdAt: string;
  walletAddress: string;
  openToWork?: boolean; // Optional field for work status
  description?: string; // Optional field for description
}

const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [userCards, setUserCards] = useState<DevCard[]>([]);

  // Load cards from localStorage on component mount
  useEffect(() => {
    const loadCards = () => {
      try {
        const storedCards = localStorage.getItem('developerCards');
        if (storedCards) {
          const cards: DevCard[] = JSON.parse(storedCards);
          // Filter cards by current wallet address and add default values for missing fields
          const userSpecificCards = cards
            .filter(card => card.walletAddress === currentAccount?.address)
            .map(card => ({
              ...card,
              openToWork: card.openToWork ?? true,
              description: card.description ?? `Passionate developer with ${card.yearsOfExperience}+ years of experience building innovative solutions.`
            }));
          setUserCards(userSpecificCards);
        }
      } catch (error) {
        console.error('Error loading cards from localStorage:', error);
        setUserCards([]);
      }
    };

    if (currentAccount?.address) {
      loadCards();
    }
  }, [currentAccount?.address]);

  // Save cards to localStorage whenever userCards changes
  useEffect(() => {
    if (userCards.length > 0) {
      try {
        // Get all cards from localStorage
        const allCards = JSON.parse(localStorage.getItem('developerCards') || '[]');
        
        // Remove old cards for current user and add updated ones
        const otherUsersCards = allCards.filter((card: DevCard) => 
          card.walletAddress !== currentAccount?.address
        );
        
        const updatedAllCards = [...otherUsersCards, ...userCards];
        localStorage.setItem('developerCards', JSON.stringify(updatedAllCards));
      } catch (error) {
        console.error('Error saving cards to localStorage:', error);
      }
    }
  }, [userCards, currentAccount?.address]);

  const toggleWorkStatus = (cardId: string) => {
    setUserCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, openToWork: !card.openToWork }
        : card
    ));
  };

  const updateDescription = (cardId: string) => {
    setUserCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, description: newDescription }
        : card
    ));
    setEditingDescription(null);
    setNewDescription('');
  };

  const startEditingDescription = (card: DevCard) => {
    setEditingDescription(card.id);
    setNewDescription(card.description || '');
  };

  const deleteCard = (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      setUserCards(prev => prev.filter(card => card.id !== cardId));
      
      // Also remove from localStorage
      try {
        const allCards = JSON.parse(localStorage.getItem('developerCards') || '[]');
        const updatedCards = allCards.filter((card: DevCard) => card.id !== cardId);
        localStorage.setItem('developerCards', JSON.stringify(updatedCards));
      } catch (error) {
        console.error('Error removing card from localStorage:', error);
      }
    }
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

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
             Dashboard
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
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {userCards.reduce((total, card) => {
                // Generate a pseudo-random view count based on card creation time
                const daysSinceCreation = Math.floor((Date.now() - new Date(card.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return total + Math.max(1, Math.floor(daysSinceCreation * 2.5 + Math.random() * 10));
              }, 0)}
            </div>
            <div className="text-gray-600">Profile Views</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {Math.floor(userCards.length * 1.8 + Math.random() * 5)}
            </div>
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
            <h2 className="text-2xl font-bold text-gray-900">My Dev Cards</h2>
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
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-xl">{card.name}</h3>
                      <p className="text-blue-600 font-medium text-lg">{card.title}</p>
                      <p className="text-gray-500 text-sm mt-1">{card.yearsOfExperience} years experience</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleWorkStatus(card.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          card.openToWork
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={card.openToWork ? 'Available for work' : 'Not available'}
                      >
                        {card.openToWork ? (
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
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save
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
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Creation Date */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(card.createdAt).toLocaleDateString()}
                    </p>
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
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete Card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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