import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { 
  User, 
  Search, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Eye, 
  Check, 
  X,
  Filter,
  SortAsc,
  Link as LinkIcon,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Code,
  Shield,
  Zap,
  Loader2
} from 'lucide-react';
import StarBackground from '@/components/common/StarBackground';
import DashboardSidebar from '@/components/DashboardSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { 
  sendConnectionRequestTransaction,
  acceptConnectionRequestTransaction,
  declineConnectionRequestTransaction,
  getConnectionRequests,
  getConnectionStoreId,
  getConnections
} from '@/lib/suiClient';

interface Developer {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  followers: string;
  description: string;
  status: 'following' | 'connected' | 'suggested';
  skillsTags: string[];
}

interface ConnectionRequest {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  message: string;
}

interface Suggestion {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  skillsTags: string[];
}

interface ConnectionData {
  user: string;
  status: string;
  notificationsEnabled: boolean;
  profileShared: boolean;
  messagesAllowed: boolean;
}

// ConnectionRequest type from blockchain matches the suiClient interface

const Connections: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const { getAllCards } = useContract();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('any');
  const [sortBy, setSortBy] = useState('recently-active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // Query ConnectionAccepted events to get connections (event-based approach)
      const events = await client.queryEvents({
        query: {
          MoveEventType: '0x1c9f232f66800bf35b6add40a2047fca8fe6f6d23c19e418a75aed661a3173a3::devhub::ConnectionAccepted'
        },
        limit: 100
      });

      const userConnections: ConnectionData[] = [];
      for (const event of events.data) {
        if (event.parsedJson) {
          const { user1, user2 } = event.parsedJson as any;
          if (user1 === currentAccount.address || user2 === currentAccount.address) {
            const connectedUser = user1 === currentAccount.address ? user2 : user1;
            userConnections.push({
              user: connectedUser,
              status: 'connected',
              notificationsEnabled: true,
              profileShared: true,
              messagesAllowed: true
            });
          }
        }
      }
      setConnections(userConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, client]);

  const loadSuggestions = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    try {
      // Load suggestions from real developer cards
      const allCards = await getAllCards();
      
      // Query connections directly instead of using state dependency
      // to avoid infinite loop
      const events = await client.queryEvents({
        query: {
          MoveEventType: '0x1c9f232f66800bf35b6add40a2047fca8fe6f6d23c19e418a75aed661a3173a3::devhub::ConnectionAccepted'
        },
        limit: 100
      });
      
      const connectedUsers = new Set<string>();
      for (const event of events.data) {
        if (event.parsedJson) {
          const { user1, user2 } = event.parsedJson as any;
          if (user1 === currentAccount.address || user2 === currentAccount.address) {
            const connectedUser = user1 === currentAccount.address ? user2 : user1;
            connectedUsers.add(connectedUser.toLowerCase());
          }
        }
      }
      
      // Get pending requests to filter them out
      const pendingRequests = await getConnectionRequests(currentAccount.address);
      const usersWithPendingRequests = new Set(pendingRequests.map(r => r.from.toLowerCase()));
      
      const userSuggestions: Suggestion[] = allCards
        .filter(card => {
          const cardOwnerLower = card.owner.toLowerCase();
          return (
            cardOwnerLower !== currentAccount.address.toLowerCase() &&
            !connectedUsers.has(cardOwnerLower) &&
            !usersWithPendingRequests.has(cardOwnerLower)
          );
        })
        .slice(0, 10)
        .map(card => ({
          id: card.owner,
          name: card.name || `${card.owner.slice(0, 8)}...`,
          avatar: card.name?.charAt(0).toUpperCase() || 'D',
          skills: card.technologies || 'Developer',
          skillsTags: card.niche ? [card.niche] : []
        }));
      
      setSuggestions(userSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [currentAccount?.address, getAllCards, client]);

  // Load connections on component mount
  useEffect(() => {
    if (currentAccount?.address) {
      loadConnections();
      loadSuggestions();
    }
  }, [currentAccount?.address, loadConnections, loadSuggestions]);

  // Convert connections to developers for display
  const developers: Developer[] = connections.map((conn, index) => ({
    id: conn.user,
    name: `${conn.user.slice(0, 8)}...`,
    avatar: conn.user.slice(0, 2).toUpperCase(),
    skills: 'Move • Developer',
    followers: '1k',
    description: 'Sui Developer',
    status: 'connected' as const,
    skillsTags: ['Move', 'Sui', 'Developer']
  }));

  // Load connection requests from blockchain
  useEffect(() => {
    const loadRequests = async () => {
      if (!currentAccount?.address) return;
      
      try {
        const reqs = await getConnectionRequests(currentAccount.address);
        const allCards = await getAllCards();
        
        const displayRequests: any[] = [];
        for (const req of reqs) {
          const senderCard = allCards.find(card => card.owner.toLowerCase() === req.from.toLowerCase());
          displayRequests.push({
            id: req.id,
            name: senderCard?.name || `${req.from.slice(0, 8)}...`,
            avatar: senderCard?.name?.charAt(0).toUpperCase() || 'U',
            skills: senderCard?.technologies || 'Developer',
            message: req.introMessage || 'Want to connect with you'
          });
        }
        
        setConnectionRequests(displayRequests);
      } catch (error) {
        console.error('Error loading connection requests:', error);
      }
    };
    
    loadRequests();
  }, [currentAccount?.address, getAllCards]);

  // Load sent connection requests (requests pending approval from others)
  useEffect(() => {
    const loadSentRequests = async () => {
      if (!currentAccount?.address) return;
      
      try {
        // Query ConnectionRequestSent events to find requests sent by current user
        const events = await client.queryEvents({
          query: {
            MoveEventType: '0x1c9f232f66800bf35b6add40a2047fca8fe6f6d23c19e418a75aed661a3173a3::devhub::ConnectionRequestSent'
          },
          limit: 100,
          order: 'descending'
        });

        const allCards = await getAllCards();
        const sentRequestEvents: any[] = [];
        
        for (const event of events.data) {
          if (event.parsedJson) {
            const { from, to } = event.parsedJson as any;
            // Only show events where current user sent the request
            if (from.toLowerCase() === currentAccount.address.toLowerCase()) {
              // Check if still pending (filter out accepted/declined later)
              const recipientCard = allCards.find(card => card.owner.toLowerCase() === to.toLowerCase());
              sentRequestEvents.push({
                id: `sent-${to}`, // Use recipient address as ID
                recipient: to,
                name: recipientCard?.name || `${to.slice(0, 8)}...`,
                avatar: recipientCard?.name?.charAt(0).toUpperCase() || 'U',
                skills: recipientCard?.technologies || 'Developer',
                timestamp: event.timestampMs
              });
            }
          }
        }
        
        setSentRequests(sentRequestEvents);
      } catch (error) {
        console.error('Error loading sent requests:', error);
      }
    };
    
    loadSentRequests();
  }, [currentAccount?.address, client, getAllCards]);
  
  // Use loaded connection requests instead of mock data
  const requests = connectionRequests.map(req => ({
    id: req.id,
    name: req.name,
    avatar: req.avatar,
    skills: req.skills,
    message: req.message
  }));

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleAcceptRequest = useCallback(async (id: string) => {
    if (!currentAccount?.address) return;
    
    setProcessing(id);
    try {
      // Find the connection store ID dynamically
      const connStoreId = await getConnectionStoreId();
      if (!connStoreId) {
        throw new Error('Connection store not found');
      }

      const tx = acceptConnectionRequestTransaction(connStoreId, id);
      
      await signAndExecute({
        transaction: tx,
      });

      // Reload data - reset connection requests to empty array since we'll reload them via useEffect
      setConnectionRequests([]);
      loadConnections();
      
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessing(null);
    }
  }, [currentAccount?.address]);

  const handleDeclineRequest = useCallback(async (id: string) => {
    if (!currentAccount?.address) return;
    
    setProcessing(id);
    try {
      const tx = declineConnectionRequestTransaction(id);
      
      await signAndExecute({
        transaction: tx,
      });

      // Reload requests - reset to empty array since we'll reload them via useEffect
      setConnectionRequests([]);
      
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setProcessing(null);
    }
  }, [currentAccount?.address]);

  const handleConnect = useCallback(async (id: string) => {
    if (!currentAccount?.address) return;
    
    setProcessing(id);
    try {
      const tx = sendConnectionRequestTransaction(
        id,
        'I\'d like to connect with you',
        'DevHub',
        true
      );
      
      await signAndExecute({
        transaction: tx,
      });

      // Remove from suggestions and reload
      setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
      // Reload suggestions to get fresh filtered list
      setTimeout(() => loadSuggestions(), 1000);
      
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setProcessing(null);
    }
  }, [currentAccount?.address, loadSuggestions]);

  const handleFollow = useCallback(async (id: string) => {
    if (!currentAccount?.address) return;
    
    setProcessing(id);
    try {
      // TODO: Implement actual follow functionality
      // This might involve updating user preferences or following status
      console.log('Following:', id);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error following:', error);
    } finally {
      setProcessing(null);
    }
  }, [currentAccount?.address]);

  const handleSendConnectionRequest = useCallback(async (to: string, introMessage: string, sharedContext: string) => {
    if (!currentAccount?.address) return;
    
    try {
      // TODO: Implement actual connection request sending
      // This would involve calling sendConnectionRequestTransaction
      console.log('Sending connection request to:', to);
      
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  }, [currentAccount?.address]);

  const filteredDevelopers = developers.filter(dev => 
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.skills.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.skills.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.skillsTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // User not connected state
  if (!currentAccount) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <Users className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access your connections.</p>
          <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-xl border border-primary/30 max-w-md mx-auto">
            <p className="text-primary">
              Connect your wallet to view and manage your connections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground />

      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DashboardSidebar />
            
            <main className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="connections-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Connections Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.7, 
                      delay: 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                        Connections
                      </h1>
                      <p className="text-xl text-muted-foreground mb-6">
                        Discover developers, manage requests, and grow your network on Sui.
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Invite via Link
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Find Developers
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Main Content Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    {/* Network Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.7, 
                        delay: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        transition: { duration: 0.3 }
                      }}
                      className="lg:col-span-2 bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl"
                    >
                      <h3 className="text-xl font-bold text-foreground mb-6">Network</h3>
                      
                      {/* Search and Filters */}
                      <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search people, skills..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                            />
                          </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-3 mb-4">
                          {['All', 'Requests', 'Following', 'Blocked'].map((filter, index) => (
                            <motion.button
                              key={filter}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleFilterChange(filter.toLowerCase())}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                activeFilter === filter.toLowerCase()
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}
                            >
                              {filter}
                            </motion.button>
                          ))}
                        </div>

                        {/* Skill and Sort Filters */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Skill:</span>
                            <select
                              value={selectedSkill}
                              onChange={(e) => setSelectedSkill(e.target.value)}
                              className="px-3 py-2 bg-background/70 border border-border rounded-lg text-foreground text-sm"
                            >
                              <option value="any">Any</option>
                              <option value="move">Move</option>
                              <option value="rust">Rust</option>
                              <option value="typescript">TypeScript</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sort:</span>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="px-3 py-2 bg-background/70 border border-border rounded-lg text-foreground text-sm"
                            >
                              <option value="recently-active">Recently active</option>
                              <option value="most-followers">Most followers</option>
                              <option value="newest">Newest</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Developer Cards */}
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : filteredDevelopers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No connections found</p>
                          </div>
                        ) : (
                          filteredDevelopers.map((dev, index) => (
                            <motion.div
                              key={dev.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {dev.avatar}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">{dev.name}</h4>
                                    <p className="text-sm text-muted-foreground">{dev.skills}</p>
                                    <p className="text-sm text-muted-foreground">{dev.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {dev.status === 'following' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 text-sm"
                                    >
                                      Following
                                    </motion.button>
                                  )}
                                  {dev.status === 'connected' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 text-sm"
                                    >
                                      Connected
                                    </motion.button>
                                  )}
                                  {dev.status === 'suggested' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 text-sm"
                                    >
                                      Suggested
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 text-sm"
                                  >
                                    Message
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 text-sm"
                                  >
                                    View Profile
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>

                    {/* Requests Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.7, 
                        delay: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        transition: { duration: 0.3 }
                      }}
                      className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl"
                    >
                      <h3 className="text-xl font-bold text-foreground mb-2">Requests</h3>
                      <p className="text-sm text-muted-foreground mb-6">Pending invitations to connect</p>
                      
                      <div className="space-y-4">
                        {requests.length === 0 ? (
                          <div className="text-center py-8">
                            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No pending requests</p>
                          </div>
                        ) : (
                          requests.map((request, index) => (
                            <motion.div
                              key={request.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {request.avatar}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{request.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{request.skills}</p>
                                  <p className="text-sm text-muted-foreground italic mb-3">{request.message}</p>
                                  <div className="flex gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDeclineRequest(request.id)}
                                      disabled={processing === request.id}
                                      className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processing === request.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        'Decline'
                                      )}
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleAcceptRequest(request.id)}
                                      disabled={processing === request.id}
                                      className="px-3 py-1 bg-primary/20 text-primary rounded-lg border border-primary/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processing === request.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        'Accept'
                                      )}
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>

                    {/* Sent Requests Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.7, 
                        delay: 0.65,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        transition: { duration: 0.3 }
                      }}
                      className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl"
                    >
                      <h3 className="text-xl font-bold text-foreground mb-2">Pending Approvals</h3>
                      <p className="text-sm text-muted-foreground mb-6">Connection requests you've sent</p>
                      
                      <div className="space-y-4">
                        {sentRequests.length === 0 ? (
                          <div className="text-center py-8">
                            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No pending approvals</p>
                          </div>
                        ) : (
                          sentRequests.map((sentReq, index) => (
                            <motion.div
                              key={sentReq.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.68 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {sentReq.avatar}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{sentReq.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{sentReq.skills}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30 text-sm">
                                      Pending Response
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>

                    {/* Suggestions Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.7, 
                        delay: 0.7,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        transition: { duration: 0.3 }
                      }}
                      className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl"
                    >
                      <h3 className="text-xl font-bold text-foreground mb-2">Suggestions</h3>
                      <p className="text-sm text-muted-foreground mb-6">People you may know</p>
                      
                      <div className="space-y-4">
                        {filteredSuggestions.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No suggestions found</p>
                          </div>
                        ) : (
                          filteredSuggestions.map((suggestion, index) => (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {suggestion.avatar}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{suggestion.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">{suggestion.skills}</p>
                                  
                                  {/* Skill Tags */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {suggestion.skillsTags.map((tag, tagIndex) => (
                                      <motion.span
                                        key={tag}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2, delay: 0.9 + tagIndex * 0.05 }}
                                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium"
                                      >
                                        {tag}
                                      </motion.span>
                                    ))}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleFollow(suggestion.id)}
                                      disabled={processing === suggestion.id}
                                      className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processing === suggestion.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        'Follow'
                                      )}
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleConnect(suggestion.id)}
                                      disabled={processing === suggestion.id}
                                      className="px-3 py-1 bg-primary/20 text-primary rounded-lg border border-primary/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processing === suggestion.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        'Connect'
                                      )}
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;
