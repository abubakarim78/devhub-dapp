import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { 
  Search, 
  Filter, 
  Mail, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Link as LinkIcon,
  MoreHorizontal,
  Briefcase,
  CheckCircle,
  Loader2
} from 'lucide-react';
import StarBackground from '@/components/common/StarBackground';
import DashboardSidebar from '@/components/DashboardSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { sendEncryptedMessageTransaction, startConversationTransaction } from '@/lib/suiClient';

// Utility function to format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};


interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isOutgoing: boolean;
}

interface ConversationData {
  id: string;
  participant1: string;
  participant2: string;
  participantName?: string;
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  lastSeen?: number; // Unix timestamp for last seen
}

const Messages: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { 
    useMessages, 
    useConversations, 
    getAllActiveCards, 
    getAllCards
  } = useContract();
  
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeveloperSelector, setShowDeveloperSelector] = useState(false);
  const [availableDevelopers, setAvailableDevelopers] = useState<any[]>([]);
  const [loadingDevelopers, setLoadingDevelopers] = useState(false);
  const [developerSearchQuery, setDeveloperSearchQuery] = useState('');
  const [addressToNameMap, setAddressToNameMap] = useState<Record<string, string>>({});

  // Function to update last seen timestamp for a conversation
  const updateLastSeen = useCallback((conversationId: string, timestamp: number = Date.now()) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastSeen: timestamp
          };
        }
        return conv;
      });
    });
  }, []);

  // Load address to name mapping
  const loadAddressToNameMap = useCallback(async () => {
    try {
      const allCards = await getAllCards();
      const nameMap: Record<string, string> = {};
      
      allCards.forEach((card: any) => {
        if (card.owner && card.name) {
          nameMap[card.owner] = card.name;
        }
      });
      
      setAddressToNameMap(nameMap);
      console.log('Loaded address to name mapping:', nameMap);
      return nameMap;
    } catch (error) {
      console.error('Error loading address to name map:', error);
      return {};
    }
  }, [getAllCards]);

  // Function to update conversation names when address mapping changes
  const updateConversationNames = useCallback((nameMap: Record<string, string>) => {
    setConversations(prev => {
      return prev.map(conv => {
        const otherParticipant = conv.participant1 === currentAccount?.address ? conv.participant2 : conv.participant1;
        const participantName = nameMap[otherParticipant] || `Developer ${otherParticipant.slice(0, 8)}...`;
        
        return {
          ...conv,
          participantName: participantName
        };
      });
    });
  }, [currentAccount?.address]);

  // Load conversations on component mount
  useEffect(() => {
    if (currentAccount?.address) {
      // Load address to name mapping first, then load conversations
      loadAddressToNameMap().then((nameMap) => {
        loadConversations();
        // Also update conversations with the loaded names
        setTimeout(() => updateConversationNames(nameMap), 100);
      });
    }
  }, [currentAccount?.address]);

  // Note: Removed periodic refresh to prevent automatic chat window refresh
  // Names will only update when the component mounts or when explicitly refreshed

  // Load messages when a conversation is selected (consolidated)
  useEffect(() => {
    console.log('Selected message changed:', selectedMessage);
    if (selectedMessage) {
      // loadMessages already handles cache restoration internally
      loadMessages(selectedMessage, false);
    }
  }, [selectedMessage]);

  const loadConversations = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // For now, skip the new SDK and go directly to legacy conversations
      // since the SDK has compatibility issues
      console.log('Using legacy conversation loading due to SDK compatibility issues');
      
      let contractConversations = [];
      try {
        contractConversations = await useConversations(currentAccount.address);
        console.log('Loaded legacy conversations:', contractConversations);
      } catch (error) {
        console.warn('Failed to load conversations from contract:', error);
        // If the function doesn't exist or fails, create mock conversations for testing
        contractConversations = [];
        console.log('Using empty conversations list as fallback');
      }
      
      const uiConversations: ConversationData[] = contractConversations.map(conv => {
        const otherParticipant = conv.participant1 === currentAccount.address ? conv.participant2 : conv.participant1;
        
        // Try to get name from current mapping, or use a more descriptive fallback
        let participantName = addressToNameMap[otherParticipant];
        if (!participantName) {
          // If no name is found, try to get it from available developers
          const availableDev = availableDevelopers.find(dev => dev.owner === otherParticipant);
          if (availableDev) {
            participantName = availableDev.name;
          } else {
            // Use a more descriptive fallback
            participantName = `Developer ${otherParticipant.slice(0, 8)}...`;
          }
        }
        
        // Calculate last seen timestamp (simulate based on last activity)
        // In a real implementation, this would come from the blockchain data
        const lastSeen = Date.now() - Math.random() * 24 * 60 * 60 * 1000; // Random time within last 24 hours
        
        return {
          id: conv.id,
          participant1: conv.participant1,
          participant2: conv.participant2,
          participantName: participantName,
          messages: [],
          lastMessage: 'Start a conversation...',
          lastMessageTime: 'Just now',
          unreadCount: 0,
          lastSeen: lastSeen
        };
      });
      
      setConversations(uiConversations);
      
      if (uiConversations.length > 0 && !selectedMessage) {
        setSelectedMessage(uiConversations[0].id);
        console.log('Auto-selected first conversation:', uiConversations[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, useConversations, addressToNameMap, selectedMessage]);


  const loadMessages = useCallback(async (conversationId: string, forceRefresh: boolean = false) => {
    if (!conversationId || !currentAccount?.address) return;
    
    // Only load from localStorage if conversations are already loaded (to ensure participants are available)
    if (!forceRefresh && conversations.length > 0) {
      try {
        const cachedMessages = localStorage.getItem(`messages-${conversationId}`);
        if (cachedMessages) {
          const parsedMessages = JSON.parse(cachedMessages);
          setCurrentMessages(parsedMessages);
          console.log('Loaded cached messages from localStorage:', parsedMessages.length);
        }
      } catch (error) {
        console.warn('Failed to load messages from localStorage:', error);
      }
    }
    
    // Clear current messages only if force refresh is requested
    if (forceRefresh) {
      setCurrentMessages([]);
      try {
        localStorage.removeItem(`messages-${conversationId}`);
        console.log('Cleared localStorage cache for conversation:', conversationId);
      } catch (error) {
        console.warn('Failed to clear localStorage cache:', error);
      }
    }
    
    try {
      console.log('Loading messages for conversation:', conversationId);
      
      // For now, skip the new SDK and go directly to legacy messages
      // since the SDK has compatibility issues
      console.log('Using legacy message loading due to SDK compatibility issues');
      
      const currentConversation = conversations.find(conv => conv.id === conversationId);
      const participants = currentConversation ? [currentConversation.participant1, currentConversation.participant2] : undefined;
      
      console.log('Current conversation found:', !!currentConversation);
      console.log('Conversations list:', conversations);
      console.log('Conversation ID to find:', conversationId);
      console.log('Loading messages with participants:', participants);
      console.log('Participant1:', currentConversation?.participant1);
      console.log('Participant2:', currentConversation?.participant2);
      
      // Get real messages from the contract with decryption
      let contractMessages: any[] = [];
      try {
        contractMessages = await useMessages(conversationId, participants);
        console.log('Contract messages:', contractMessages);
        console.log('Contract messages count:', contractMessages.length);
      } catch (error) {
        console.warn('Failed to load messages from contract:', error);
        // If the function fails, use empty messages list
        contractMessages = [];
        console.log('Using empty messages list as fallback');
      }
      
      // Convert contract messages to UI format with better error handling
      const uiMessages: ChatMessage[] = contractMessages.map((msg, index) => {
        // Parse timestamp properly - handle both string and number formats
        let timestampStr = 'Unknown time';
        try {
          let timestamp: number;
          
          // Handle different timestamp formats
          if (typeof msg.timestamp === 'string') {
            // Try to parse as number first
            const parsed = parseFloat(msg.timestamp);
            if (!isNaN(parsed)) {
              timestamp = parsed;
            } else {
              // Try to parse as date string
              const date = new Date(msg.timestamp);
              timestamp = date.getTime();
            }
          } else if (typeof msg.timestamp === 'number') {
            timestamp = msg.timestamp;
          } else {
            console.warn('Invalid timestamp format:', msg.timestamp);
            timestamp = Date.now(); // Use current time as fallback
          }
          
          // Validate timestamp
          if (timestamp && !isNaN(timestamp) && timestamp > 0) {
            // If timestamp is in seconds (less than year 2001), convert to milliseconds
            if (timestamp < 1000000000000) {
              timestamp = timestamp * 1000;
            }
            
            const date = new Date(timestamp);
            // Validate the date is reasonable (not in the future, not too old)
            const now = Date.now();
            const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
            
            if (date.getTime() <= now && date.getTime() >= oneYearAgo) {
              timestampStr = formatRelativeTime(timestamp);
            } else {
              console.warn('Timestamp out of reasonable range:', timestamp, date);
              timestampStr = 'Unknown time';
            }
          }
        } catch (error) {
          console.error('Error parsing timestamp:', msg.timestamp, error);
          timestampStr = 'Unknown time';
        }

        // Handle message content with better fallback
        let messageContent = msg.content;
        if (!messageContent || messageContent === '[Message content not available]') {
          messageContent = 'Message content unavailable';
        }

        return {
          id: `${conversationId}-${index}-${msg.timestamp}`,
          sender: msg.sender === currentAccount.address ? 'You' : msg.sender.slice(0, 8) + '...',
          message: messageContent,
          timestamp: timestampStr,
          isOutgoing: msg.sender === currentAccount.address
        };
      });
      
      console.log('UI messages:', uiMessages);
      setCurrentMessages(uiMessages);

      // Update last seen timestamp when messages are loaded
      if (uiMessages.length > 0) {
        const lastMessage = uiMessages[uiMessages.length - 1];
        if (lastMessage && !lastMessage.isOutgoing) {
          // If the last message is from the other participant, update their last seen
          updateLastSeen(conversationId, Date.now());
        }
      }
      
      // Store messages in localStorage for persistence
      try {
        localStorage.setItem(`messages-${conversationId}`, JSON.stringify(uiMessages));
        console.log('Messages stored in localStorage for persistence');
      } catch (storageError) {
        console.warn('Failed to store messages in localStorage:', storageError);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // Try to load from localStorage as fallback only if blockchain fetch fails
      try {
        const storedMessages = localStorage.getItem(`messages-${conversationId}`);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setCurrentMessages(parsedMessages);
          console.log('Loaded messages from localStorage fallback');
        } else {
          // If no cached messages and blockchain fetch failed, show empty state
          setCurrentMessages([]);
        }
      } catch (storageError) {
        console.error('Failed to load messages from localStorage:', storageError);
        setCurrentMessages([]);
      }
    }
  }, [currentAccount?.address, useMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedMessage || sending || !currentAccount?.address) return;
    
    setSending(true);
    const messageContent = newMessage; // Store the message content before clearing
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      // Create the message object for optimistic UI
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: 'You',
        message: messageContent,
        timestamp: 'now',
        isOutgoing: true
      };
      
      // Add to current messages immediately for optimistic UI
      setCurrentMessages(prev => [...prev, message]);
      
      console.log('Sending message with content:', messageContent);
      
      // For now, skip the new SDK and go directly to legacy messaging
      // since the SDK has compatibility issues
      console.log('Skipping new SDK due to compatibility issues, using legacy messaging');
      
      // Check if this is a mock conversation (not a real Sui object)
      const currentConversation = conversations.find(conv => conv.id === selectedMessage);
      
      if (!currentConversation) {
        console.error('Conversation not found');
        return;
      }

      // Check if this is a mock conversation that needs to be created first
      const isMockConversation = !selectedMessage.startsWith('0x') || selectedMessage.length !== 66;
      
      if (isMockConversation) {
        console.log('This is a mock conversation, creating real conversation first...');
        
        // Create a real conversation first
        const participants = [currentConversation.participant1, currentConversation.participant2];
        
        try {
          // Create the conversation transaction
          const createTx = startConversationTransaction(participants[1]); // participant2

          // Execute the conversation creation transaction
          const createResult = await signAndExecute({
            transaction: createTx,
          });

          console.log('Conversation created successfully:', createResult);
          
          // For now, we'll use a mock conversation ID since we can't extract it from the result
          // In a real implementation, you would need to parse the transaction result
          const newConversationId = `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`;
          
          console.log('New conversation ID:', newConversationId);
          
          // Update the conversation ID in our local state
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.id === selectedMessage) {
                return {
                  ...conv,
                  id: newConversationId
                };
              }
              return conv;
            });
          });

          // Update the selected message to use the new ID
          setSelectedMessage(newConversationId);
          
          // Now send the message to the newly created conversation
          const messageTx = await sendEncryptedMessageTransaction(
            newConversationId,
            messageContent,
            participants
          );

          // Execute the message transaction
          const messageResult = await signAndExecute({
            transaction: messageTx,
          });

          console.log('Message sent successfully:', messageResult);

          // Update the conversation list to show the new message
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.id === newConversationId) {
                return {
                  ...conv,
                  lastMessage: messageContent,
                  lastMessageTime: 'Just now',
                  lastSeen: Date.now()
                };
              }
              return conv;
            });
          });

          // Update last seen timestamp
          updateLastSeen(newConversationId);

          // Reload messages to get the latest state
          await loadMessages(newConversationId);
          
        } catch (error) {
          console.error('Error creating conversation and sending message:', error);
          // Remove the optimistic message on error
          setCurrentMessages(prev => prev.slice(0, -1));
        }
      } else {
        // This is a real conversation, send message directly
        console.log('Sending message to existing conversation');
        const participants = [currentConversation.participant1, currentConversation.participant2];

        if (participants.length === 0) {
          console.error('No participants found for conversation');
          return;
        }

        // Create the transaction using the legacy function
        const tx = await sendEncryptedMessageTransaction(
          selectedMessage,
          messageContent,
          participants
        );

        // Execute the transaction
        const result = await signAndExecute({
          transaction: tx,
        });

        console.log('Message sent successfully:', result);

        // Update the conversation list to show the new message
        setConversations(prev => {
          return prev.map(conv => {
            if (conv.id === selectedMessage) {
              return {
                ...conv,
                lastMessage: messageContent,
                lastMessageTime: 'Just now',
                lastSeen: Date.now()
              };
            }
            return conv;
          });
        });

        // Update last seen timestamp
        updateLastSeen(selectedMessage);

        // Reload messages to get the latest state
        await loadMessages(selectedMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      setCurrentMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedMessage, sending, currentAccount?.address, loadMessages, conversations]);

  const handleStartConversation = useCallback(async (participant2: string) => {
    if (!currentAccount?.address) return;
    
    try {
      // For now, skip the new SDK and go directly to legacy conversation creation
      // since the SDK has compatibility issues
      console.log('Using legacy conversation creation due to SDK compatibility issues');
      const tx = startConversationTransaction(participant2);
      signAndExecute(
        { transaction: tx as any },
        {
          onSuccess: async (result) => {
            console.log('Conversation started successfully:', result);
            
            // Reload conversations to show the new one
            await loadConversations();
            
            // Find and select the new conversation
            // We need to wait a bit for the conversation to be indexed
            setTimeout(async () => {
              try {
                const updatedConversations = await useConversations(currentAccount.address);
                console.log('Updated conversations:', updatedConversations);
                
                const newConversation = updatedConversations.find(conv => 
                  (conv.participant1 === currentAccount.address && conv.participant2 === participant2) ||
                  (conv.participant2 === currentAccount.address && conv.participant1 === participant2)
                );
                
                console.log('Found new conversation:', newConversation);
                
                if (newConversation) {
                  setSelectedMessage(newConversation.id);
                  console.log('Selected conversation ID:', newConversation.id);
                  // Load messages for the new conversation
                  await loadMessages(newConversation.id);
                } else {
                  console.log('No new conversation found, trying to select first available conversation');
                  // If no specific conversation found, select the first one
                  if (updatedConversations.length > 0) {
                    setSelectedMessage(updatedConversations[0].id);
                    await loadMessages(updatedConversations[0].id);
                  } else {
                    // For debugging: let's try to extract the conversation ID from the transaction result
                    console.log('No conversations found, but conversation was created successfully');
                    console.log('Transaction result:', result);
                    // We could potentially extract the conversation ID from the transaction result
                    // and manually set it here for testing
                  }
                }
              } catch (error) {
                console.error('Error selecting new conversation:', error);
              }
            }, 2000); // Wait 2 seconds for indexing
          },
          onError: (error) => {
            console.error('Error starting conversation:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [currentAccount?.address, loadConversations, useConversations, loadMessages]);

  const loadAvailableDevelopers = useCallback(async () => {
    setLoadingDevelopers(true);
    try {
      // Get all active developers
      const activeCards = await getAllActiveCards();
      
      // Filter out current user and format for display
      const developers = activeCards
        .filter(card => card.owner !== currentAccount?.address)
        .map(card => ({
          id: card.id,
          name: card.name,
          title: card.title,
          owner: card.owner,
          imageUrl: card.imageUrl,
          technologies: card.technologies,
          openToWork: card.openToWork,
          isActive: card.isActive
        }));
      
      setAvailableDevelopers(developers);
      
      // Update conversation names with the new developer data
      const nameMap: Record<string, string> = {};
      developers.forEach(dev => {
        if (dev.owner && dev.name) {
          nameMap[dev.owner] = dev.name;
        }
      });
      
      // Update conversations with new names
      updateConversationNames(nameMap);
      
    } catch (error) {
      console.error('Error loading available developers:', error);
    } finally {
      setLoadingDevelopers(false);
    }
  }, [getAllActiveCards, currentAccount?.address, updateConversationNames]);

  const filteredConversations = conversations.filter(conv => 
    conv.participant2.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDevelopers = availableDevelopers.filter(dev => 
    dev.name.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    dev.title.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    dev.technologies.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    dev.owner.toLowerCase().includes(developerSearchQuery.toLowerCase())
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
            <MessageSquare className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access your messages.</p>
          <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-xl border border-primary/30 max-w-md mx-auto">
            <p className="text-primary">
              Connect your wallet to view and manage your messages.
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
                  key="messages-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Messages Header */}
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
                      <div className="text-sm text-muted-foreground mb-2">Developer / Messages</div>
                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                        Messages
                      </h1>
                      <p className="text-xl text-muted-foreground">
                        Chat with employers, collaborators, and other builders on DevHub. Real-time messaging powered by Sui blockchain.
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
                        <Filter className="h-4 w-4" />
                        Preferences
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
                        onClick={() => {
                          setShowDeveloperSelector(true);
                          loadAvailableDevelopers();
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        + New Message
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Messages Layout */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-18rem)]"
                  >
                    {/* Left Panel - Messages List */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl flex flex-col overflow-hidden"
                    >
                      {/* Header Row - Inbox, Search */}
                      <div className="flex items-center gap-3 mb-6">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 text-sm"
                        >
                          <Mail className="h-4 w-4" />
                          Inbox
                        </motion.button>
                        
                        {/* Search Bar */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background/70 backdrop-blur-xl border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                          />
                        </div>
                      </div>

                      {/* Messages List */}
                      <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : filteredConversations.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No conversations found</p>
                          </div>
                        ) : (
                          filteredConversations.map((conversation, index) => (
                            <motion.div
                              key={conversation.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              onClick={() => {
                                setSelectedMessage(conversation.id);
                                // Force refresh messages when switching conversations
                                loadMessages(conversation.id, true);
                              }}
                              className={`p-4 rounded-xl cursor-pointer transition-all ${
                                selectedMessage === conversation.id
                                  ? 'bg-purple-500/20 border border-purple-500/30' 
                                  : 'bg-accent/20 hover:bg-accent/30 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {(conversation.participantName || conversation.participant2).slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {conversation.participantName || `Developer ${conversation.participant2.slice(0, 8)}...`}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                      {conversation.lastSeen ? formatRelativeTime(conversation.lastSeen) : conversation.lastMessageTime}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{conversation.lastMessage}</p>
                                  {conversation.unreadCount > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      <span className="text-xs text-primary font-medium">{conversation.unreadCount} unread</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>

                    {/* Right Panel - Chat Window */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="lg:col-span-2 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
                    >
                      {/* Chat Header */}
                      <div className="p-6 border-b border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {(() => {
                                if (!selectedMessage) return '??';
                                const conversation = conversations.find(conv => conv.id === selectedMessage);
                                if (conversation) {
                                  const otherParticipant = conversation.participant1 === currentAccount?.address 
                                    ? conversation.participant2 
                                    : conversation.participant1;
                                  return otherParticipant.slice(0, 2).toUpperCase();
                                }
                                return selectedMessage.slice(0, 2).toUpperCase();
                              })()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {(() => {
                                  if (!selectedMessage) return 'Select a conversation';
                                  const conversation = conversations.find(conv => conv.id === selectedMessage);
                                  if (conversation) {
                                    // Use participantName if available, otherwise fallback to address
                                    return conversation.participantName || `Developer ${conversation.participant2.slice(0, 8)}...`;
                                  }
                                  return `Developer ${selectedMessage.slice(0, 8)}...`;
                                })()}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  if (!selectedMessage) return 'Last seen unknown';
                                  const conversation = conversations.find(conv => conv.id === selectedMessage);
                                  if (conversation?.lastSeen) {
                                    return `Last seen ${formatRelativeTime(conversation.lastSeen)}`;
                                  }
                                  return 'Last seen unknown';
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => loadMessages(selectedMessage, true)}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                              title="Refresh messages"
                            >
                              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0">
                        {!selectedMessage ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">Select a conversation to start messaging</p>
                            </div>
                          </div>
                        ) : currentMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No messages yet</p>
                            </div>
                          </div>
                        ) : (
                          currentMessages.map((msg, index) => {
                            const prevMsg = index > 0 ? currentMessages[index - 1] : null;
                            const nextMsg = index < currentMessages.length - 1 ? currentMessages[index + 1] : null;
                            const isFirstInGroup = !prevMsg || prevMsg.isOutgoing !== msg.isOutgoing;
                            const isLastInGroup = !nextMsg || nextMsg.isOutgoing !== msg.isOutgoing;
                            
                            return (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                                className={`flex ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] p-4 rounded-2xl ${
                                    msg.isOutgoing
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-purple-500/20 text-foreground border border-purple-500/30'
                                  } ${
                                    !isFirstInGroup ? (msg.isOutgoing ? 'rounded-tr-md' : 'rounded-tl-md') : ''
                                  } ${
                                    !isLastInGroup ? (msg.isOutgoing ? 'rounded-br-md' : 'rounded-bl-md') : ''
                                  }`}
                                >
                                  <p className="text-sm">{msg.message}</p>
                                  {isLastInGroup && (
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs opacity-70">{msg.timestamp}</span>
                                      {msg.isOutgoing && (
                                        <CheckCircle className="h-3 w-3 opacity-70" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-6 border-t border-border">
                        {selectedMessage ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Write a message to ${(() => {
                                  const conversation = conversations.find(conv => conv.id === selectedMessage);
                                  if (conversation) {
                                    const otherParticipant = conversation.participant1 === currentAccount?.address 
                                      ? conversation.participant2 
                                      : conversation.participant1;
                                    return `${otherParticipant.slice(0, 8)}...`;
                                  }
                                  return 'this developer';
                                })()}...`}
                                disabled={sending}
                                className="w-full px-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground disabled:opacity-50"
                              />
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || sending}
                              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </motion.button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">Select a conversation to start messaging</p>
                          </div>
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

      {/* Developer Selector Modal */}
      {showDeveloperSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full mx-4 border border-border max-h-[80vh] overflow-hidden flex flex-col"
          >
            <h3 className="text-xl font-semibold mb-4">Start New Conversation</h3>
            <p className="text-muted-foreground mb-4">
              Select a developer to start a conversation with:
            </p>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search developers..."
                value={developerSearchQuery}
                onChange={(e) => setDeveloperSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
            
            {loadingDevelopers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading developers...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {filteredDevelopers.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {developerSearchQuery ? 'No developers found matching your search' : 'No active developers found'}
                    </p>
                  </div>
                ) : (
                  filteredDevelopers.map((developer) => (
                    <motion.div
                      key={developer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleStartConversation(developer.owner);
                        setShowDeveloperSelector(false);
                        setDeveloperSearchQuery('');
                      }}
                      className="p-4 bg-background/50 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={developer.imageUrl}
                          alt={developer.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground truncate">
                              {developer.name}
                            </h4>
                            {developer.openToWork && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                                Available
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-primary truncate">{developer.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {developer.technologies}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">
                            {developer.owner.slice(0, 8)}...
                          </span>
                          <MessageSquare className="h-4 w-4 text-primary mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
            
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowDeveloperSelector(false);
                  setDeveloperSearchQuery('');
                }}
                className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Messages;
