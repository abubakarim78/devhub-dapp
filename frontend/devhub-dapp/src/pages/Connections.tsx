import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users, 
  UserPlus, 
  X,
  Link as LinkIcon,
  Loader2,
  Copy,
  CheckCircle
} from 'lucide-react';
import Layout from '@/components/common/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { 
  sendConnectionRequestTransaction,
  acceptConnectionRequestTransaction,
  declineConnectionRequestTransaction,
  getConnectionRequests,
  getConnectionStoreId,
  createConnectionStoreTransaction,
  storeConnectionStoreId,
  PACKAGE_ID
} from '@/lib/suiClient';
import { WalrusService } from '@/services/walrus';

interface Developer {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  followers: string;
  description: string;
  status: 'connected' | 'suggested';
  skillsTags: string[];
  cardId?: number;
}

interface ConnectionRequest {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  message: string;
  status?: string;
  cardId?: number;
  recipient?: string;
}

interface Suggestion {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  skillsTags: string[];
  cardId?: number;
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
  const navigate = useNavigate();
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
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Normalize Sui addresses to 32-byte hex (lowercase) for reliable comparisons/keys
  const normalizeAddr = useCallback((addr: string | undefined | null): string => {
    if (!addr) return '';
    let s = addr.toLowerCase();
    // Remove 0x prefix if present
    if (s.startsWith('0x')) {
      s = s.slice(2);
    }
    // Pad/trim to exactly 64 hex characters
    if (s.length < 64) {
      s = s.padStart(64, '0');
    } else if (s.length > 64) {
      s = s.slice(-64);
    }
    return `0x${s}`;
  }, []);
  // Build an avatar URL from card data if available
  const getAvatarUrlForCard = useCallback((card: any): string => {
    if (!card) return '';
    if (card.avatarWalrusBlobId) {
      try {
        return WalrusService.getBlobUrl(card.avatarWalrusBlobId);
      } catch {
        // ignore
      }
    }
    return typeof card.imageUrl === 'string' && card.imageUrl ? card.imageUrl : '';
  }, []);
  const buildAvatarFor = useCallback((displayName: string, addr: string, card?: any): string => {
    const url = getAvatarUrlForCard(card);
    if (url) return url;
    const nameForAvatar = displayName || `${addr.slice(0, 8)}...`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=random&color=fff&size=48`;
  }, [getAvatarUrlForCard]);

  // Format technologies string with ellipsis if more than 4 items
  const formatTechnologies = useCallback((technologies: string): string => {
    if (!technologies) return '';
    const techArray = technologies.split(',').map(t => t.trim()).filter(Boolean);
    if (techArray.length > 4) {
      return techArray.slice(0, 4).join(', ') + ` +${techArray.length - 4} more`;
    }
    return technologies;
  }, []);

  const [processing, setProcessing] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [allCards, setAllCards] = useState<any[]>([]);

  const loadConnections = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // Query ConnectionAccepted events to get connections (event-based approach)
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::connections::ConnectionAccepted`
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
      const cards = await getAllCards();
      setAllCards(cards);
      
      // Query connections directly instead of using state dependency
      // to avoid infinite loop
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::connections::ConnectionAccepted`
        },
        limit: 100
      });
      const connectedUsers = new Set<string>();
      for (const event of events.data) {
        if (event.parsedJson) {
          const { user1, user2 } = event.parsedJson as any;
          if (user1 === currentAccount.address || user2 === currentAccount.address) {
            const connectedUser = user1 === currentAccount.address ? user2 : user1;
            connectedUsers.add(normalizeAddr(connectedUser));
          }
        }
      }
      
      // Get pending requests to filter them out (requests received by current user)
      const pendingRequests = await getConnectionRequests(currentAccount.address);
      const usersWithPendingRequests = new Set(pendingRequests.map(r => normalizeAddr(r.from)));
      
      // Get sent requests to filter them out (requests sent by current user)
      const sentRequestsState = await new Promise<ConnectionRequest[]>((resolve) => {
        // We'll get this from the sentRequests state which is loaded in a separate useEffect
        // For now, query it directly here
        const checkSentRequests = async () => {
          try {
            const sentEvents = await client.queryEvents({
              query: {
                MoveEventType: `${PACKAGE_ID}::connections::ConnectionRequestSent`
              },
              limit: 100,
              order: 'descending'
            });

            const acceptedEvents = await client.queryEvents({
              query: {
                MoveEventType: `${PACKAGE_ID}::connections::ConnectionAccepted`
              },
              limit: 100,
              order: 'descending'
            });

            const declinedEvents = await client.queryEvents({
              query: {
                MoveEventType: `${PACKAGE_ID}::connections::ConnectionDeclined`
              },
              limit: 100,
              order: 'descending'
            });

            const acceptedConnections = new Map<string, number>();
            const declinedConnections = new Map<string, number>();
            
            for (const event of acceptedEvents.data) {
              if (event.parsedJson) {
                const { user1, user2 } = event.parsedJson as any;
                if (user1 === currentAccount.address || user2 === currentAccount.address) {
                  const otherUser = user1 === currentAccount.address ? user2 : user1;
                  const normalized = normalizeAddr(otherUser);
                  const timestamp = typeof event.timestampMs === 'number' ? event.timestampMs : parseInt(String(event.timestampMs || 0));
                  const existingTimestamp = acceptedConnections.get(normalized) || 0;
                  if (timestamp > existingTimestamp) {
                    acceptedConnections.set(normalized, timestamp);
                  }
                }
              }
            }
            
            for (const event of declinedEvents.data) {
              if (event.parsedJson) {
                const { from: _from, to } = event.parsedJson as any;
                const normalized = normalizeAddr(to);
                const timestamp = typeof event.timestampMs === 'number' ? event.timestampMs : parseInt(String(event.timestampMs || 0));
                const existingTimestamp = declinedConnections.get(normalized) || 0;
                if (timestamp > existingTimestamp) {
                  declinedConnections.set(normalized, timestamp);
                }
              }
            }
            
            const sent: ConnectionRequest[] = [];
            for (const event of sentEvents.data) {
              if (event.parsedJson) {
                const { from, to } = event.parsedJson as any;
                if (normalizeAddr(from) === normalizeAddr(currentAccount.address)) {
                  const toNormalized = normalizeAddr(to);
                  const acceptedTimestamp = acceptedConnections.get(toNormalized) || 0;
                  const declinedTimestamp = declinedConnections.get(toNormalized) || 0;
                  const sentTimestamp = typeof event.timestampMs === 'number' ? event.timestampMs : parseInt(String(event.timestampMs || 0));
                  const isMostRecent = sentTimestamp > acceptedTimestamp && sentTimestamp > declinedTimestamp;
                  if (isMostRecent || (acceptedTimestamp === 0 && declinedTimestamp === 0)) {
                    sent.push({ id: `sent-${to}`, recipient: to } as ConnectionRequest);
                  }
                }
              }
            }
            resolve(sent);
          } catch (error) {
            console.error('Error getting sent requests:', error);
            resolve([]);
          }
        };
        checkSentRequests();
      });
      
      const usersWithSentRequests = new Set(sentRequestsState.map(r => normalizeAddr(r.recipient)));
      
      const userSuggestions: Suggestion[] = cards
        .filter(card => {
          const cardOwnerNormalized = normalizeAddr(card.owner);
          const currentUserNormalized = normalizeAddr(currentAccount.address);
          return (
            cardOwnerNormalized !== currentUserNormalized &&
            !connectedUsers.has(cardOwnerNormalized) &&
            !usersWithPendingRequests.has(cardOwnerNormalized) &&
            !usersWithSentRequests.has(cardOwnerNormalized)
          );
        })
        .slice(0, 10)
        .map(card => ({
          id: normalizeAddr(card.owner),
          name: card.name || `${card.owner.slice(0, 8)}...`,
          avatar: buildAvatarFor(card.name || '', normalizeAddr(card.owner), card),
          skills: card.technologies || 'Developer',
          skillsTags: card.niche ? [card.niche] : [],
          cardId: typeof card.id === 'number' ? card.id : undefined,
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
    }
  }, [currentAccount?.address, loadConnections]);

  // Load suggestions
  useEffect(() => {
    if (currentAccount?.address) {
      loadSuggestions();
    }
  }, [currentAccount?.address, loadSuggestions]);

  // Convert connections to developers for display using real card data when available
  const developers: Developer[] = connections.map((conn) => {
    const addr = normalizeAddr(conn.user);
    const card = allCards.find(c => normalizeAddr(c.owner) === addr);
    const avatarUrl = buildAvatarFor(card?.name || '', addr, card);
    return {
      id: addr,
      name: card?.name || `${addr.slice(0, 8)}...`,
      avatar: avatarUrl,
      skills: card?.technologies || '',
      followers: '',
      description: card?.niche || '',
      status: 'connected' as const,
      skillsTags: card?.niche ? [card.niche] : [],
      cardId: typeof card?.id === 'number' ? card.id : undefined,
    };
  });

  // Load connection requests from blockchain
  useEffect(() => {
    const loadRequests = async () => {
      if (!currentAccount?.address) return;
      
      try {
        console.log('Loading connection requests for user:', currentAccount.address);
        const reqs = await getConnectionRequests(currentAccount.address);
        console.log('Raw connection requests:', reqs);
        
        const allCards = await getAllCards();
        
        const displayRequests: any[] = [];
        for (const req of reqs) {
          console.log('Processing request:', req);
          const senderCard = allCards.find(card => normalizeAddr(card.owner) === normalizeAddr(req.from));
          displayRequests.push({
            id: req.id,
            name: senderCard?.name || `${req.from.slice(0, 8)}...`,
            avatar: buildAvatarFor(senderCard?.name || '', normalizeAddr(req.from), senderCard),
            skills: senderCard?.technologies || 'Developer',
            message: req.introMessage || 'Want to connect with you',
            cardId: typeof senderCard?.id === 'number' ? senderCard.id : undefined,
          });
        }
        
        console.log('Display requests:', displayRequests);
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
        const sentEvents = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::connections::ConnectionRequestSent`
          },
          limit: 100,
          order: 'descending'
        });

        // Query ConnectionAccepted events to filter out accepted requests
        const acceptedEvents = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::connections::ConnectionAccepted`
          },
          limit: 100,
          order: 'descending'
        });

        // Query ConnectionDeclined events to filter out declined requests
        const declinedEvents = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::connections::ConnectionDeclined`
          },
          limit: 100,
          order: 'descending'
        });

        const allCards = await getAllCards();
        
        // Create sets to track the most recent status for each recipient
        // Key: normalized recipient address, Value: most recent timestamp for that status
        const acceptedConnections = new Map<string, number>();
        const declinedConnections = new Map<string, number>();
        
        for (const event of acceptedEvents.data) {
          if (event.parsedJson) {
            const { user1, user2 } = event.parsedJson as any;
            if (user1 === currentAccount.address || user2 === currentAccount.address) {
              const otherUser = user1 === currentAccount.address ? user2 : user1;
              const normalized = normalizeAddr(otherUser);
              const timestamp = typeof event.timestampMs === 'number' ? event.timestampMs : parseInt(String(event.timestampMs || 0));
              const existingTimestamp = acceptedConnections.get(normalized) || 0;
              if (timestamp > existingTimestamp) {
                acceptedConnections.set(normalized, timestamp);
              }
            }
          }
        }
        
        for (const event of declinedEvents.data) {
          if (event.parsedJson) {
            const { from: _from, to } = event.parsedJson as any;
            const normalized = normalizeAddr(to);
            const timestamp = typeof event.timestampMs === 'number' ? event.timestampMs : parseInt(String(event.timestampMs || 0));
            const existingTimestamp = declinedConnections.get(normalized) || 0;
            if (timestamp > existingTimestamp) {
              declinedConnections.set(normalized, timestamp);
            }
          }
        }
        
        const sentRequestEvents: any[] = [];
        
        for (const event of sentEvents.data) {
          if (event.parsedJson) {
            const { from, to } = event.parsedJson as any;
            // Only show events where current user sent the request
            if (normalizeAddr(from) === normalizeAddr(currentAccount.address)) {
              const toNormalized = normalizeAddr(to);
              const recipientCard = allCards.find(card => normalizeAddr(card.owner) === toNormalized);
              
              // Get the most recent timestamps for accepted/declined
              const acceptedTimestamp = acceptedConnections.get(toNormalized) || 0;
              const declinedTimestamp = declinedConnections.get(toNormalized) || 0;
              const sentTimestamp = typeof event.timestampMs === 'number' ? event.timestampMs : parseInt(String(event.timestampMs || 0));
              
              // Only show if the sent event is the most recent action for this recipient
              // OR if there's no prior accepted/declined event
              const isMostRecent = sentTimestamp > acceptedTimestamp && sentTimestamp > declinedTimestamp;
              
              if (isMostRecent || (acceptedTimestamp === 0 && declinedTimestamp === 0)) {
                sentRequestEvents.push({
                  id: `sent-${to}`, // Use recipient address as ID
                  recipient: to,
                  name: recipientCard?.name || `${to.slice(0, 8)}...`,
                  avatar: buildAvatarFor(recipientCard?.name || '', normalizeAddr(to), recipientCard),
                  skills: recipientCard?.technologies || 'Developer',
                  timestamp: event.timestampMs,
                  status: 'Pending Response',
                  cardId: typeof recipientCard?.id === 'number' ? recipientCard.id : undefined,
                });
              }
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

  // Generate invite link
  const handleGenerateInviteLink = useCallback(() => {
    if (!currentAccount?.address) return;
    
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/browse?invite=${currentAccount.address}`;
    setInviteLink(link);
    setShowInviteModal(true);
    
    // Auto-copy to clipboard
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  }, [currentAccount?.address]);

  // Copy link to clipboard
  const handleCopyLink = useCallback(() => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  }, [inviteLink]);

  const handleAcceptRequest = useCallback(async (id: string) => {
    if (!currentAccount?.address) return;
    
    setProcessing(id);
    try {
      console.log('Accepting connection request with ID:', id);
      
      // Find the connection store ID dynamically
      let connStoreId = await getConnectionStoreId();
      
      // If ConnectionStore doesn't exist, create it first
      if (!connStoreId) {
        console.log('ConnectionStore not found, creating it...');
        const createTx = createConnectionStoreTransaction();
        
        const createResult: any = await signAndExecute({
          transaction: createTx,
        });
        
        console.log('ConnectionStore creation result:', createResult);
        
        // Check if the transaction was successful
        if (!createResult) {
          throw new Error('Transaction execution failed - no result returned');
        }
        
        // Extract the ConnectionStore ID from the transaction result
        if ((createResult as any)?.effects?.created) {
          const createdObjects = (createResult as any).effects.created;
          console.log('Created objects:', createdObjects);
          
          // Find the ConnectionStore object ID
          for (const created of createdObjects) {
            if (created.reference?.objectId) {
              // Check if this is a ConnectionStore by querying its type
              try {
                const objectDetails = await client.getObject({
                  id: created.reference.objectId,
                  options: {
                    showType: true,
                    showContent: false,
                  },
                });
                
                if (objectDetails.data?.type?.includes('ConnectionStore')) {
                  connStoreId = created.reference.objectId;
                  console.log('Found ConnectionStore ID from creation result:', connStoreId);
                  // Store the ID for future use
                  storeConnectionStoreId(connStoreId!);
                  break;
                }
              } catch (objError) {
                console.log('Error checking object type:', objError);
              }
            }
          }
        }
        
        if (!connStoreId) {
          // Wait a moment for the transaction to be processed and try to get from events
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to get ConnectionStore ID from events
          try {
            const events = await client.queryEvents({
              query: {
                MoveEventType: `${PACKAGE_ID}::connections::ConnectionStoreCreated`
              },
              limit: 1,
              order: 'descending'
            });
            
            console.log('ConnectionStoreCreated events:', events);
            
            if (events.data && events.data.length > 0) {
              const eventData = events.data[0].parsedJson as any;
              if (eventData && eventData.store_id) {
                connStoreId = eventData.store_id;
                console.log('Found ConnectionStore ID from events:', connStoreId);
                storeConnectionStoreId(connStoreId!);
              }
            }
          } catch (eventError) {
            console.log('Error querying ConnectionStoreCreated events:', eventError);
          }
          
          // Fallback to the old method
          if (!connStoreId) {
            connStoreId = await getConnectionStoreId();
            if (connStoreId) {
              // Store the ID for future use
              storeConnectionStoreId(connStoreId!);
            }
          }
        }
        
        if (!connStoreId) {
          throw new Error('Failed to create or find ConnectionStore');
        }
      }
      
      console.log('Connection store ID:', connStoreId);

      // Find the full connection request object by ID
      const connectionRequest = connectionRequests.find(req => req.id === id);
      if (!connectionRequest) {
        throw new Error('Connection request not found');
      }

      const tx = acceptConnectionRequestTransaction(connStoreId, connectionRequest);
      
      console.log('Transaction created, executing...');
      
      const result: any = await signAndExecute({
        transaction: tx,
      });
      
      console.log('Transaction executed successfully:', result);

      // Reload data - reset connection requests to empty array since we'll reload them via useEffect
      setConnectionRequests([]);
      loadConnections();
      
    } catch (error) {
      console.error('Error accepting request:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        connectionRequestId: id,
        currentAccount: currentAccount?.address
      });
      
      // Show user-friendly error message
      alert(`Failed to accept connection request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  }, [currentAccount?.address, loadConnections, signAndExecute, connectionRequests]);

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


  const handleStartChat = useCallback(async (participant: string) => {
    console.log('🔵 handleStartChat called in Connections page for:', participant);
    
    if (!currentAccount?.address) {
      console.log('❌ No current account in Connections');
      return;
    }
    
    setProcessing(participant);
    try {
      console.log('📤 Navigating to Messages page with ?to=', participant);
      // Navigate to messages and let the Messages page create/select the conversation
      navigate(`/dashboard-messages?to=${participant}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  }, [currentAccount?.address, navigate]);

  const handleViewProfile = useCallback((dev: Developer) => {
    if (dev.cardId !== undefined) {
      navigate(`/card/${dev.cardId}`);
    } else {
      navigate(`/browse?owner=${dev.id}`);
    }
  }, [navigate]);


  // Use developers list directly
  const allDevelopers = developers;

  const filteredDevelopers = allDevelopers.filter(dev => {
    // Apply search filter
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.skills.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply active filter
    switch (activeFilter) {
      case 'requests':
        return dev.status === 'suggested';
      case 'blocked':
        return false; // No blocked users implemented yet
      case 'all':
      default:
        return true;
    }
  });

  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.skills.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.skillsTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // User not connected state
  if (!currentAccount) {
    return (
      <Layout>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
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
      </Layout>
    );
  }

  return (
    <>
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
                        onClick={handleGenerateInviteLink}
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
                        onClick={() => navigate('/browse')}
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
                          {['All', 'Requests', 'Blocked'].map((filter, index) => (
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
                              key={dev.id || `dev-${index}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                                    {typeof dev.avatar === 'string' && (dev.avatar.startsWith('http://') || dev.avatar.startsWith('https://')) ? (
                                      <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{dev.avatar}</span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">{dev.name}</h4>
                                    <p className="text-sm text-muted-foreground">{formatTechnologies(dev.skills)}</p>
                                    {dev.description && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                          {dev.description}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStartChat(dev.id)}
                                    disabled={processing === dev.id}
                                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Message
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleViewProfile(dev)}
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
                              key={request.id || `req-${index}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                  {typeof request.avatar === 'string' && (request.avatar.startsWith('http://') || request.avatar.startsWith('https://')) ? (
                                    <img src={request.avatar} alt={request.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{request.avatar}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{request.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{formatTechnologies(request.skills)}</p>
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
                              key={sentReq.id || `sent-${index}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.68 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                  {typeof sentReq.avatar === 'string' && (sentReq.avatar.startsWith('http://') || sentReq.avatar.startsWith('https://')) ? (
                                    <img src={sentReq.avatar} alt={sentReq.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{sentReq.avatar}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{sentReq.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{formatTechnologies(sentReq.skills)}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30 text-sm">
                                      {sentReq.status || 'Pending Response'}
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
                              key={suggestion.id || `sug-${index}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border hover:bg-accent/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                  {typeof suggestion.avatar === 'string' && (suggestion.avatar.startsWith('http://') || suggestion.avatar.startsWith('https://')) ? (
                                    <img src={suggestion.avatar} alt={suggestion.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{suggestion.avatar}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{suggestion.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{formatTechnologies(suggestion.skills)}</p>
                                  
                                  {/* Professional Niche Tags */}
                                  {suggestion.skillsTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {suggestion.skillsTags.map((tag, tagIndex) => (
                                        <motion.span
                                          key={tag || `tag-${tagIndex}`}
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ duration: 0.2, delay: 0.9 + tagIndex * 0.05 }}
                                          className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium"
                                        >
                                          {tag}
                                        </motion.span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2">
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

      {/* Invite Modal */}
      {showInviteModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <LinkIcon className="h-6 w-6 text-primary" />
                  Invite via Link
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-muted-foreground mb-4">
                Share this link to allow others to send you a connection request
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-accent/20 rounded-lg border border-border">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-transparent text-foreground text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                  >
                    {linkCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-primary" />
                    )}
                  </motion.button>
                </div>

                <div className="flex flex-col gap-2">
                  {linkCopied && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-500 text-center"
                    >
                      Link copied to clipboard!
                    </motion.p>
                  )}
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default Connections;
