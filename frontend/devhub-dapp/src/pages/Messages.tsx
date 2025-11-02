import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { 
  Search, 
  Mail, 
  MessageSquare, 
  Send, 
  Paperclip, 
  MoreHorizontal,
  CheckCircle,
  Loader2,
  Download,
  FileText,
  Smile
} from 'lucide-react';
import Layout from '@/components/common/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { sendEncryptedMessageTransaction, startConversationTransaction } from '@/lib/suiClient';
import EmojiPicker, { Theme } from 'emoji-picker-react';

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
  rawTimestamp?: number; // Raw timestamp for sorting
  isOutgoing: boolean;
}

interface ConversationData {
  id: string;
  participant1: string;
  participant2: string;
  participantName: string; // Always required
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  lastSeen?: number; // Unix timestamp for last seen
}

const Messages: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [searchParams] = useSearchParams();
  const { id: routeConversationId } = useParams();
  const navigate = useNavigate();
  const normalizeAddress = useCallback((addr?: string): string => {
    if (!addr) return '';
    let a = addr.trim().toLowerCase();
    if (!a.startsWith('0x')) a = `0x${a}`;
    return a;
  }, []);
  const { 
    useMessages, 
    useConversations, 
    getAllActiveCards, 
    getAllCards,
    uploadToWalrus
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
  const [addressToDeveloperMap, setAddressToDeveloperMap] = useState<Record<string, { name: string; title: string; imageUrl: string }>>({});
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const processedConversationRef = useRef<Set<string>>(new Set());

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Function to handle emoji selection
  const handleEmojiSelect = useCallback((emojiObject: { emoji: string }) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Toast component
  const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border ${
        type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-100' : 'bg-red-500/20 border-red-500/40 text-red-100'
      }`}>
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className={type === 'success' ? 'text-green-300 hover:text-green-100' : 'text-red-300 hover:text-red-100'}>
          ×
        </button>
      </div>
    </div>
  );

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

  // Load developer information for all addresses
  const loadDeveloperInfo = useCallback(async () => {
    try {
      const activeCards = await getAllActiveCards();
      console.log('Loading developer info from cards:', activeCards);
      const developerMap: Record<string, { name: string; title: string; imageUrl: string }> = {};
      
      activeCards.forEach((card: any) => {
        if (card.owner && card.name) {
          developerMap[card.owner] = {
            name: card.name,
            title: card.niche || 'Developer',
            imageUrl: card.imageUrl || '/api/placeholder/40/40'
          };
        }
      });
      
      setAddressToDeveloperMap(developerMap);
      console.log('Loaded developer info for addresses:', Object.keys(developerMap));
      console.log('Developer map:', developerMap);
    } catch (error) {
      console.error('Error loading developer info:', error);
    }
  }, [getAllActiveCards]);

  // Get user name for a given address
  const getUserName = useCallback((address: string) => {
    // First check if it's the current user
    if (address === currentAccount?.address) {
      return 'You';
    }
    
    // Check developer map first (most reliable source)
    const developerInfo = addressToDeveloperMap[address];
    if (developerInfo && developerInfo.name) {
      return developerInfo.name;
    }
    
    // Check address to name map
    const nameFromMap = addressToNameMap[address];
    if (nameFromMap) {
      return nameFromMap;
    }
    
    // Fallback to address
    return `Developer ${address.slice(0, 8)}...`;
  }, [currentAccount?.address, addressToDeveloperMap, addressToNameMap]);

  // Get user avatar for a given address
  const getUserAvatar = useCallback((address: string) => {
    // Check developer map first (most reliable source)
    const developerInfo = addressToDeveloperMap[address];
    if (developerInfo && developerInfo.imageUrl) {
      return developerInfo.imageUrl;
    }
    
    // Fallback to generated avatar
    const name = getUserName(address);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=40`;
  }, [addressToDeveloperMap, getUserName]);

  // Function to update conversation names when address mapping changes
  const updateConversationNames = useCallback((nameMap: Record<string, string>) => {
    console.log('Updating conversation names with mapping:', nameMap);
    setConversations(prev => {
      return prev.map(conv => {
        const otherParticipant = conv.participant1 === currentAccount?.address ? conv.participant2 : conv.participant1;
        
        // Use developer card data first, then fallback to name map
        const developerInfo = addressToDeveloperMap[otherParticipant];
        const participantName = developerInfo?.name || nameMap[otherParticipant] || `Developer ${otherParticipant.slice(0, 8)}...`;
        
        console.log(`Updating conversation ${conv.id}: ${otherParticipant} -> ${participantName}`);
        
        return {
          ...conv,
          participantName: participantName
        };
      });
    });
  }, [currentAccount?.address, addressToDeveloperMap]);

  // Clear processed conversations ref on component mount
  useEffect(() => {
    processedConversationRef.current.clear();
  }, []);

  // Load conversations on component mount
  useEffect(() => {
    if (currentAccount?.address) {
      // Load address to name mapping and developer info first, then load conversations
      Promise.all([
        loadAddressToNameMap(),
        loadDeveloperInfo()
      ]).then(([nameMap]) => {
        loadConversations();
        // Also update conversations with the loaded names
        setTimeout(() => updateConversationNames(nameMap), 100);
      });
    }
  }, [currentAccount?.address]); // Only depend on currentAccount to avoid infinite loops

  // Note: Removed periodic refresh to prevent automatic chat window refresh
  // Names will only update when the component mounts or when explicitly refreshed

  // Update conversation names when address mapping changes (without infinite loop)
  useEffect(() => {
    if (conversations.length > 0 && (Object.keys(addressToNameMap).length > 0 || Object.keys(addressToDeveloperMap).length > 0)) {
      console.log('Updating conversation names with mapping');
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          const otherParticipant = conv.participant1 === currentAccount?.address ? conv.participant2 : conv.participant1;
          
          // Prioritize developer map, then name map, then fallback
          const developerInfo = addressToDeveloperMap[otherParticipant];
          const participantName = developerInfo?.name 
            || addressToNameMap[otherParticipant] 
            || `Developer ${otherParticipant.slice(0, 8)}...`;
          
          // Only update if the name has actually changed
          if (conv.participantName !== participantName) {
            console.log(`Updating conversation ${conv.id}: ${otherParticipant} -> ${participantName}`);
            return {
              ...conv,
              participantName: participantName
            };
          }
          return conv;
        });
        
        // Only update state if there were actual changes
        const hasChanges = updatedConversations.some((conv, index) => conv.participantName !== prev[index].participantName);
        return hasChanges ? updatedConversations : prev;
      });
    }
  }, [addressToNameMap, addressToDeveloperMap, currentAccount?.address]);

  // Update conversation names when conversations are first loaded
  useEffect(() => {
    if (conversations.length > 0 && Object.keys(addressToNameMap).length > 0 && Object.keys(addressToDeveloperMap).length > 0) {
      // Check if any conversations need name updates (use Developer name as fallback)
      const needsUpdate = conversations.some(conv => conv.participantName.startsWith('Developer '));
      
      if (needsUpdate) {
        console.log('Updating conversation names for newly loaded conversations');
        setConversations(prev => {
          return prev.map(conv => {
            const otherParticipant = conv.participant1 === currentAccount?.address ? conv.participant2 : conv.participant1;
            
            // Prioritize developer map, then name map, then fallback
            const developerInfo = addressToDeveloperMap[otherParticipant];
            const participantName = developerInfo?.name 
              || addressToNameMap[otherParticipant] 
              || `Developer ${otherParticipant.slice(0, 8)}...`;
            
            return {
              ...conv,
              participantName: participantName
            };
          });
        });
      }
    }
  }, [conversations.length, addressToNameMap, addressToDeveloperMap, currentAccount?.address]);

  // Handle deep-link from Connections: /dashboard-messages?to=<address>
  useEffect(() => {
    const to = searchParams.get('to');
    if (!to || !currentAccount?.address) return;
    
    console.log('🔥 useEffect triggered for ?to= deep link:', to);
    
    // Create a unique key for this conversation attempt
    const conversationKey = `${currentAccount.address}-${to}`;
    
    // Check if we've already processed this conversation
    if (processedConversationRef.current.has(conversationKey)) {
      console.log('🚫 Conversation already processed, skipping...', conversationKey);
      return;
    }
    
    console.log('✅ Processing new conversation request:', conversationKey);
    
    // Mark as processed
    processedConversationRef.current.add(conversationKey);
    
    // Try to find or create conversation, then select it
    (async () => {
      try {
        const existing = await useConversations(currentAccount.address, true);
        const me = normalizeAddress(currentAccount.address);
        const target = normalizeAddress(to);
        const existingConv = existing.find(conv =>
          (normalizeAddress(conv.participant1) === me && normalizeAddress(conv.participant2) === target) ||
          (normalizeAddress(conv.participant2) === me && normalizeAddress(conv.participant1) === target)
        );
        if (existingConv) {
          console.log('📋 Found existing conversation:', existingConv.id);
          setSelectedMessage(existingConv.id);
          await loadMessages(existingConv.id, true);
          return;
        }
        console.log('🚀 No existing conversation found, calling handleStartConversation...');
        await handleStartConversation(target);
      } catch (e) {
        console.error('Failed to open or create conversation from link:', e);
        // Remove from processed set on error so it can be retried
        processedConversationRef.current.delete(conversationKey);
      }
    })();
    // Only run on mount or when ?to changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('to'), currentAccount?.address]);

  // Handle deep-link by conversation id: /dashboard-messages/:id
  useEffect(() => {
    if (routeConversationId) {
      setSelectedMessage(routeConversationId);
      loadMessages(routeConversationId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeConversationId]);

  // Keep URL in sync when selecting a conversation in UI
  useEffect(() => {
    if (selectedMessage) {
      navigate(`/dashboard-messages/${selectedMessage}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessage]);

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
      
      let contractConversations: any[] = [];
      try {
        contractConversations = await useConversations(currentAccount.address);
        console.log('Loaded legacy conversations:', contractConversations);
      } catch (error) {
        console.warn('Failed to load conversations from contract:', error);
        // If the function doesn't exist or fails, create mock conversations for testing
        contractConversations = [];
        console.log('Using empty conversations list as fallback');
      }
      
      const uiConversations: ConversationData[] = await Promise.all(contractConversations.map(async (conv) => {
        const otherParticipant = conv.participant1 === currentAccount.address ? conv.participant2 : conv.participant1;
        
        // Try to get name from developer map (most reliable source)
        const developerInfo = addressToDeveloperMap[otherParticipant];
        let participantName: string;
        
        if (developerInfo && developerInfo.name) {
          participantName = developerInfo.name;
        } else if (addressToNameMap[otherParticipant]) {
          participantName = addressToNameMap[otherParticipant];
        } else {
          // If no name is found, try to get it from available developers
          const availableDev = availableDevelopers.find(dev => dev.owner === otherParticipant);
          if (availableDev) {
            participantName = availableDev.name;
          } else {
            // Always use a fallback name, never undefined
            participantName = `Developer ${otherParticipant.slice(0, 8)}...`;
          }
        }
        
        // Load messages for this conversation to calculate unread count
        let unreadCount = 0;
        let lastMessage = 'Start a conversation...';
        let lastMessageTime = 'Just now';
        
        try {
          const messages = await useMessages(conv.id, [conv.participant1, conv.participant2]);
          
          if (messages && messages.length > 0) {
            // Get the last message
            const lastMsg = messages[messages.length - 1];
            lastMessage = lastMsg.content || 'Start a conversation...';
            
            // Calculate timestamp for last message
            try {
              const timestamp = typeof lastMsg.timestamp === 'string' 
                ? parseInt(lastMsg.timestamp) 
                : lastMsg.timestamp;
              const timestampMs = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
              lastMessageTime = formatRelativeTime(timestampMs);
            } catch (e) {
              lastMessageTime = 'Unknown time';
            }
            
            // Count unread messages (messages from other participant after last seen)
            const lastSeenKey = `lastSeen-${conv.id}`;
            const lastSeen = localStorage.getItem(lastSeenKey);
            const lastSeenTime = lastSeen ? parseInt(lastSeen) : 0;
            
            unreadCount = messages.filter(msg => {
              // Count unread messages from other participant
              if (msg.sender === currentAccount.address) return false;
              
              // Parse message timestamp
              try {
                const msgTimestamp = typeof msg.timestamp === 'string' 
                  ? parseInt(msg.timestamp) 
                  : msg.timestamp;
                const msgTimestampMs = msgTimestamp < 1000000000000 ? msgTimestamp * 1000 : msgTimestamp;
                return msgTimestampMs > lastSeenTime;
              } catch (e) {
                return false;
              }
            }).length;
          }
        } catch (error) {
          console.warn('Error loading messages for unread count:', error);
        }
        
        return {
          id: conv.id,
          participant1: conv.participant1,
          participant2: conv.participant2,
          participantName: participantName,
          messages: [],
          lastMessage: lastMessage,
          lastMessageTime: lastMessageTime,
          unreadCount: unreadCount,
          lastSeen: Date.now()
        };
      }));
      
      setConversations(uiConversations);
      
      const hasToParam = Boolean(searchParams.get('to'));
      if (uiConversations.length > 0 && !selectedMessage && !hasToParam) {
        setSelectedMessage(uiConversations[0].id);
        console.log('Auto-selected first conversation:', uiConversations[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, useConversations, addressToNameMap, searchParams]);


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
    
    // Clear localStorage cache only if force refresh is requested
    if (forceRefresh) {
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
        let timestamp: number = Date.now(); // Default to current time
        try {
          
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
          sender: msg.sender, // Keep the full address for developer card lookup
          message: messageContent,
          timestamp: timestampStr,
          rawTimestamp: timestamp, // Store raw timestamp for sorting
          isOutgoing: msg.sender === currentAccount.address
        };
      });
      
      console.log('UI messages:', uiMessages);
      
      // If this is a force refresh (after sending a message), merge with existing messages
      if (forceRefresh) {
        setCurrentMessages(prev => {
          // Keep optimistic messages that haven't been confirmed yet
          const optimisticMessages = prev.filter(msg => 
            msg.id.toString().startsWith('temp_') || 
            msg.timestamp === 'now' ||
            msg.sender === currentAccount.address
          );
          // Combine optimistic messages with new blockchain messages
          const allMessages = [...optimisticMessages, ...uiMessages];
          // Remove duplicates and sort by timestamp
          const uniqueMessages = allMessages.filter((msg, index, arr) => 
            arr.findIndex(m => m.id === msg.id) === index
          ).sort((a, b) => {
            // Use rawTimestamp if available, otherwise parse timestamp
            const timeA = a.rawTimestamp || (a.timestamp === 'now' ? Date.now() : (typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp));
            const timeB = b.rawTimestamp || (b.timestamp === 'now' ? Date.now() : (typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp));
            return timeA - timeB;
          });
          return uniqueMessages;
        });
      } else {
        setCurrentMessages(uiMessages);
      }

      // Update last seen timestamp when messages are loaded
      if (uiMessages.length > 0) {
        const lastMessage = uiMessages[uiMessages.length - 1];
        if (lastMessage && !lastMessage.isOutgoing) {
          // If the last message is from the other participant, update their last seen
          // Use the actual message timestamp from the blockchain
          const lastMessageTimestamp = contractMessages[contractMessages.length - 1]?.timestamp;
          if (lastMessageTimestamp) {
            // Convert timestamp to milliseconds if it's in seconds
            const timestamp = typeof lastMessageTimestamp === 'string' 
              ? (parseInt(lastMessageTimestamp) < 1000000000000 ? parseInt(lastMessageTimestamp) * 1000 : parseInt(lastMessageTimestamp))
              : (lastMessageTimestamp < 1000000000000 ? lastMessageTimestamp * 1000 : lastMessageTimestamp);
            
            updateLastSeen(conversationId, timestamp);
            console.log('Updated last seen from message timestamp:', timestamp, new Date(timestamp));
          }
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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileUpload(true);
    }
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !currentAccount?.address || !selectedMessage) return;

    setUploading(true);
    try {
      // Upload to Walrus using the useContract hook
      if (!uploadToWalrus) {
        throw new Error('File upload function not available');
      }
      
      const fileBlob = await uploadToWalrus(selectedFile);
      
      console.log('File uploaded successfully:', fileBlob);
      
      // Get the Walrus URL for the blob
      const blobUrl = fileBlob.blob.walrusUrl || fileBlob.originalUrl || '';
      
      // Send message with file attachment
      const messageWithFile = `📎 ${selectedFile.name}\n${blobUrl}`;
      
      // Do not append optimistically; wait for on-chain confirmation
      
      // Get the current conversation
      const currentConversation = conversations.find(conv => conv.id === selectedMessage);
      if (!currentConversation) {
        console.error('Conversation not found');
        return;
      }

      const participants = [currentConversation.participant1, currentConversation.participant2];
      
      // Send the message transaction
      const tx = await sendEncryptedMessageTransaction(
        selectedMessage,
        messageWithFile,
        participants
      );

      const digest = await new Promise<string>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as any },
          {
            onSuccess: async (res: any) => {
              try {
                await suiClient.waitForTransaction({ digest: res.digest });
                resolve(res.digest);
              } catch (e) {
                reject(e);
              }
            },
            onError: reject,
          },
        );
      });

      console.log('File message sent successfully:', digest);

      setShowFileUpload(false);
      setSelectedFile(null);
      await loadMessages(selectedMessage, true);
      setToast({ message: 'File sent successfully', type: 'success' });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      // No optimistic UI to rollback
      setToast({ message: 'Failed to send file', type: 'error' });
    } finally {
      setUploading(false);
    }
  }, [selectedFile, currentAccount?.address, selectedMessage, conversations, loadMessages, uploadToWalrus, sendEncryptedMessageTransaction, signAndExecute, suiClient]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedMessage || sending || !currentAccount?.address) return;
    
    setSending(true);
    const messageContent = newMessage; // Store the message content before clearing
    setNewMessage(''); // Clear input immediately for better UX
    
    // Do not append optimistically; wait for on-chain confirmation
    
    try {
      
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
          const createdDigest = await new Promise<string>((resolve, reject) => {
            signAndExecute(
              { transaction: createTx as any },
              {
                onSuccess: async (res: any) => {
                  try {
                    await suiClient.waitForTransaction({ digest: res.digest });
                    resolve(res.digest);
                  } catch (e) {
                    reject(e);
                  }
                },
                onError: reject,
              },
            );
          });

          console.log('Conversation created successfully:', createdDigest);
          
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
          const sentDigest = await new Promise<string>((resolve, reject) => {
            signAndExecute(
              { transaction: messageTx as any },
              {
                onSuccess: async (res: any) => {
                  try {
                    await suiClient.waitForTransaction({ digest: res.digest });
                    resolve(res.digest);
                  } catch (e) {
                    reject(e);
                  }
                },
                onError: reject,
              },
            );
          });

          console.log('Message sent successfully:', sentDigest);

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

          await loadMessages(newConversationId, true);
          setToast({ message: 'Message sent', type: 'success' });
          
        } catch (error) {
          console.error('Error creating conversation and sending message:', error);
          setToast({ message: 'Failed to send message', type: 'error' });
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
        const digest = await new Promise<string>((resolve, reject) => {
          signAndExecute(
            { transaction: tx as any },
            {
              onSuccess: async (res: any) => {
                try {
                  await suiClient.waitForTransaction({ digest: res.digest });
                  resolve(res.digest);
                } catch (e) {
                  reject(e);
                }
              },
              onError: reject,
            },
          );
        });

        console.log('Message sent successfully:', digest);

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

        await loadMessages(selectedMessage, true);
        setToast({ message: 'Message sent', type: 'success' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setToast({ message: 'Failed to send message', type: 'error' });
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedMessage, sending, currentAccount?.address, loadMessages, conversations]);

  const handleStartConversation = useCallback(async (participant2: string) => {
    console.log('🎯 handleStartConversation called for:', participant2);
    
    if (!currentAccount?.address) {
      console.log('❌ No current account, aborting');
      return;
    }
    
    // Prevent multiple simultaneous conversation creation attempts
    if (isCreatingConversation) {
      console.log('⚠️ Conversation creation already in progress, skipping...');
      return;
    }
    
    console.log('✅ Starting conversation creation process...');
    
    try {
      setIsCreatingConversation(true);
      
      // First, check if a conversation already exists with this participant
      const existing = await useConversations(currentAccount.address, true);
      const existingConv = existing.find(conv => 
        (conv.participant1 === currentAccount.address && conv.participant2 === participant2) ||
        (conv.participant2 === currentAccount.address && conv.participant1 === participant2)
      );
      if (existingConv) {
        console.log('📋 Existing conversation found, selecting it:', existingConv.id);
        setSelectedMessage(existingConv.id);
        await loadMessages(existingConv.id);
        setIsCreatingConversation(false);
        return;
      }

      // For now, skip the new SDK and go directly to legacy conversation creation
      // since the SDK has compatibility issues
      console.log('🚀 Using legacy conversation creation due to SDK compatibility issues');
      const tx = startConversationTransaction(participant2);
      console.log('📝 Transaction created, executing signAndExecute...');
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
              } finally {
                setIsCreatingConversation(false);
              }
            }, 2000); // Wait 2 seconds for indexing
          },
          onError: (error) => {
            console.error('Error starting conversation:', error);
            setIsCreatingConversation(false);
          }
        }
      );
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsCreatingConversation(false);
    }
  }, [currentAccount?.address, loadConversations, useConversations, loadMessages, isCreatingConversation]);

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
          title: card.niche,
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


  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by participant address
    const addressMatch = conv.participant2.toLowerCase().includes(query);
    
    // Search by participant name from developer map
    const developerInfo = addressToDeveloperMap[conv.participant2];
    const nameMatch = developerInfo?.name?.toLowerCase().includes(query) || false;
    
    // Search by developer niche
    const titleMatch = developerInfo?.title?.toLowerCase().includes(query) || false;
    
    // Search by last message content
    const messageMatch = conv.lastMessage?.toLowerCase().includes(query) || false;
    
    // Search by participant name from conversation data
    const participantNameMatch = conv.participantName.toLowerCase().includes(query);
    
    // Debug logging
    if (query && (nameMatch || titleMatch)) {
      console.log(`Search match found for "${query}":`, {
        participant: conv.participant2,
        developerInfo,
        nameMatch,
        titleMatch
      });
    }
    
    return addressMatch || nameMatch || titleMatch || messageMatch || participantNameMatch;
  });

  const filteredDevelopers = availableDevelopers.filter(dev => 
    dev.name.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    dev.title.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    dev.technologies.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    dev.owner.toLowerCase().includes(developerSearchQuery.toLowerCase())
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
      </Layout>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
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
                          boxShadow: "0 5px 15px rgba(34, 197, 94, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowDeveloperSelector(true);
                          loadAvailableDevelopers();
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
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
                      <div className="space-y-3 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
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
                              onClick={async () => {
                                // Mark as read by updating unread count to 0 and updating last seen
                                setConversations(prev => prev.map(conv => 
                                  conv.id === conversation.id 
                                    ? { ...conv, unreadCount: 0, lastSeen: Date.now() }
                                    : conv
                                ));
                                
                                // Update last seen in localStorage
                                localStorage.setItem(`lastSeen-${conversation.id}`, Date.now().toString());
                                
                                setSelectedMessage(conversation.id);
                                // Force refresh messages when switching conversations
                                await loadMessages(conversation.id, true);
                              }}
                              className={`p-4 rounded-xl cursor-pointer transition-all ${
                                selectedMessage === conversation.id
                                  ? 'bg-purple-500/20 border border-purple-500/30' 
                                  : 'bg-accent/20 hover:bg-accent/30 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={(() => {
                                    const otherParticipant = conversation.participant1 === currentAccount?.address 
                                      ? conversation.participant2 
                                      : conversation.participant1;
                                    return getUserAvatar(otherParticipant);
                                  })()}
                                  alt={conversation.participantName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-border"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participantName)}&background=random&color=fff&size=40`;
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {conversation.participantName}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                      {conversation.lastSeen ? formatRelativeTime(conversation.lastSeen) : conversation.lastMessageTime}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{conversation.lastMessage}</p>
                                  {conversation.unreadCount > 0 && (
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                        <span className="text-xs text-primary font-medium">{conversation.unreadCount} unread</span>
                                      </div>
                                      {/* Badge for unread count */}
                                      <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                      </div>
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
                            <img
                              src={(() => {
                                if (!selectedMessage) return 'https://ui-avatars.com/api/?name=??&background=random&color=fff&size=48';
                                const conversation = conversations.find(conv => conv.id === selectedMessage);
                                if (conversation) {
                                  const otherParticipant = conversation.participant1 === currentAccount?.address 
                                    ? conversation.participant2 
                                    : conversation.participant1;
                                  return getUserAvatar(otherParticipant);
                                }
                                return getUserAvatar(selectedMessage);
                              })()}
                              alt="Chat participant"
                              className="w-12 h-12 rounded-full object-cover border-2 border-border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://ui-avatars.com/api/?name=??&background=random&color=fff&size=48';
                              }}
                            />
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {(() => {
                                  if (!selectedMessage) return 'Select a conversation';
                                  const conversation = conversations.find(conv => conv.id === selectedMessage);
                                  if (conversation) {
                                    // participantName is always required now
                                    return conversation.participantName;
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
                              onClick={async () => {
                                if (!selectedMessage) return;
                                console.log('🔄 Refreshing messages for conversation:', selectedMessage);
                                
                                // Clear localStorage cache to force fresh data
                                try {
                                  localStorage.removeItem(`messages-${selectedMessage}`);
                                  console.log('✅ Cleared localStorage cache');
                                } catch (error) {
                                  console.warn('Failed to clear localStorage cache:', error);
                                }
                                
                                // Force refresh messages from blockchain
                                try {
                                  await loadMessages(selectedMessage, true);
                                  console.log('✅ Messages refreshed successfully');
                                } catch (error) {
                                  console.error('❌ Failed to refresh messages:', error);
                                }
                              }}
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
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 scrollbar-hide">
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
                          (() => {
                            // Group messages by date and sender
                            const groupedMessages = currentMessages.reduce((groups, message, index) => {
                              const prevMessage = index > 0 ? currentMessages[index - 1] : null;
                              
                              // Parse message date - use rawTimestamp if available
                              let messageDate: string;
                              try {
                                if (message.rawTimestamp) {
                                  messageDate = new Date(message.rawTimestamp).toDateString();
                                } else if (message.timestamp === 'now') {
                                  messageDate = new Date().toDateString();
                                } else if (typeof message.timestamp === 'string') {
                                  // Try to parse relative time strings like "2h ago"
                                  if (message.timestamp.includes('ago')) {
                                    messageDate = new Date().toDateString(); // Use current date for relative times
                                  } else {
                                    messageDate = new Date(message.timestamp).toDateString();
                                  }
                                } else {
                                  messageDate = new Date().toDateString();
                                }
                              } catch (error) {
                                console.warn('Error parsing message date:', message.timestamp, error);
                                messageDate = new Date().toDateString();
                              }
                              
                              const prevDate = prevMessage ? (() => {
                                try {
                                  if (prevMessage.rawTimestamp) {
                                    return new Date(prevMessage.rawTimestamp).toDateString();
                                  } else if (prevMessage.timestamp === 'now') {
                                    return new Date().toDateString();
                                  } else if (typeof prevMessage.timestamp === 'string') {
                                    if (prevMessage.timestamp.includes('ago')) {
                                      return new Date().toDateString();
                                    } else {
                                      return new Date(prevMessage.timestamp).toDateString();
                                    }
                                  } else {
                                    return new Date().toDateString();
                                  }
                                } catch (error) {
                                  return new Date().toDateString();
                                }
                              })() : null;
                              
                              // Add date header if needed
                              if (messageDate !== prevDate) {
                                groups.push({
                                  type: 'date',
                                  date: messageDate,
                                  key: `date-${messageDate}-${index}`
                                });
                              }
                              
                              // Add message
                              groups.push({
                                type: 'message',
                                message,
                                index,
                                key: message.id
                              });
                              
                              return groups;
                            }, [] as any[]);
                            
                            return groupedMessages.map((item) => {
                              if (item.type === 'date') {
                                return (
                                  <div key={item.key} className="flex justify-center my-6">
                                    <div className="bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                                      <span className="text-sm text-muted-foreground font-medium">
                                        {new Date(item.date).toLocaleDateString('en-US', { 
                                          weekday: 'long', 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              
                              const { message: msg, index } = item;
                              const prevMsg = index > 0 ? currentMessages[index - 1] : null;
                              const isFirstInGroup = !prevMsg || prevMsg.isOutgoing !== msg.isOutgoing;
                              
                              // Get sender name and avatar using developer card data
                              const senderName = getUserName(msg.sender);
                              const senderAvatar = getUserAvatar(msg.sender);
                              
                              // Debug logging
                              console.log(`Message ${index}: sender=${msg.sender}, senderName=${senderName}, senderAvatar=${senderAvatar}`);
                              console.log('Developer map for this address:', addressToDeveloperMap[msg.sender]);
                              
                              return (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                                className={`flex items-start gap-3 ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                {/* Avatar - show for first message in group for all users */}
                                {isFirstInGroup && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={senderAvatar}
                                      alt={senderName}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-border"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random&color=fff&size=40`;
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {/* Message content */}
                                <div className={`flex flex-col max-w-xs lg:max-w-md ${!isFirstInGroup ? 'ml-13' : ''}`}>
                                  {/* Sender name and timestamp - show for first message in group for all users */}
                                  {isFirstInGroup && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-foreground text-sm">
                                        {senderName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {msg.timestamp}
                                      </span>
                                    </div>
                                  )}
                                  {/* Message bubble */}
                                  <div className={`px-4 py-3 rounded-2xl ${
                                    msg.isOutgoing
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-purple-500/20 text-foreground border border-purple-500/30'
                                  }`}>
                                  {/* Check if message contains a file attachment */}
                                  {msg.message.startsWith('📎') ? (
                                    (() => {
                                      const lines = msg.message.split('\n');
                                      const fileName = lines[0].replace('📎 ', '').trim();
                                      const url = lines.find((line: string) => line.startsWith('http'));
                                      
                                      if (!url) {
                                        return <p className="text-sm">{msg.message}</p>;
                                      }

                                      // Determine file type
                                      const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
                                      const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
                                      const isMedia = isImage || isVideo;
                                      
                                      // Get file extension for icon
                                      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                                      
                                      return (
                                        <div className={`backdrop-blur-sm rounded-xl p-4 ${
                                          msg.isOutgoing 
                                            ? 'bg-white/10 border border-white/20' 
                                            : 'bg-purple-500/10 border border-purple-500/20'
                                        }`}>
                                          {/* Media Preview Section */}
                                          {isMedia && (
                                            <div className="relative">
                                              {isVideo ? (
                                                <video 
                                                  src={url} 
                                                  controls
                                                  className="w-full h-auto max-h-64 object-cover rounded-lg"
                                                  onError={(e) => {
                                                    const container = e.currentTarget.parentElement?.parentElement;
                                                    if (container) {
                                                      container.innerHTML = `
                                                        <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                                                          <div class="flex items-center gap-3">
                                                            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                                                              <FileText class="h-6 w-6 text-white" />
                                                            </div>
                                                            <div class="flex-1 min-w-0">
                                                              <p class="text-sm font-medium text-white truncate">${fileName}</p>
                                                              <p class="text-xs text-white/60">Video file</p>
                                                            </div>
                                                            <a href="${url}" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                                                              <Download class="h-5 w-5 text-white" />
                                                            </a>
                                                          </div>
                                                        </div>
                                                      `;
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                <div className="relative group">
                                                  <img 
                                                    src={url} 
                                                    alt="Attached image"
                                                    className="w-full h-auto max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(url, '_blank')}
                                                    onError={(e) => {
                                                      const container = e.currentTarget.parentElement?.parentElement;
                                                      if (container) {
                                                        container.innerHTML = `
                                                          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                                                            <div class="flex items-center gap-3">
                                                              <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                                                <FileText class="h-6 w-6 text-white" />
                                                              </div>
                                                              <div class="flex-1 min-w-0">
                                                                <p class="text-sm font-medium text-white truncate">${fileName}</p>
                                                                <p class="text-xs text-white/60">Image file</p>
                                                              </div>
                                                              <a href="${url}" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                                                                <Download class="h-5 w-5 text-white" />
                                                              </a>
                                                            </div>
                                                          </div>
                                                        `;
                                                      }
                                                    }}
                                                  />
                                                  
                                                  {/* Download button - always visible */}
                                                  <div className="absolute top-2 right-2">
                                                    <a 
                                                      href={url} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer" 
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="w-10 h-10 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-black/90 hover:scale-105 transition-all duration-200 shadow-lg"
                                                      title="Download image"
                                                    >
                                                      <Download className="h-5 w-5 text-white" />
                                                    </a>
                                                  </div>
                                                  
                                                  {/* Image info overlay - always visible */}
                                                  <div className="absolute bottom-2 left-2">
                                                    <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1">
                                                      <p className="text-xs text-white font-medium truncate max-w-48" title={fileName}>
                                                        {fileName}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* File Info Section - only show for non-image files */}
                                          {!isImage && (
                                            <div className="p-4">
                                              <div className="flex items-center gap-3">
                                                {/* File Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                  isVideo ? 'bg-gradient-to-br from-purple-500 to-blue-500' :
                                                  fileExt === 'pdf' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                                                  fileExt === 'doc' || fileExt === 'docx' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                                  fileExt === 'txt' ? 'bg-gradient-to-br from-gray-500 to-slate-500' :
                                                  fileExt === 'zip' || fileExt === 'rar' ? 'bg-gradient-to-br from-orange-500 to-yellow-500' :
                                                  'bg-gradient-to-br from-indigo-500 to-purple-500'
                                                }`}>
                                                  <FileText className="h-6 w-6 text-white" />
                                                </div>
                                                
                                                {/* File Details */}
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-semibold text-white truncate" title={fileName}>
                                                    {fileName}
                                                  </p>
                                                  <p className="text-xs text-white/60 capitalize">
                                                    {isVideo ? 'Video file' : 
                                                     fileExt ? `${fileExt.toUpperCase()} file` : 'File'}
                                                  </p>
                                                </div>
                                                
                                                {/* Download Button */}
                                                <a 
                                                  href={url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  onClick={(e) => e.stopPropagation()}
                                                  className={`w-12 h-12 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-lg ${
                                                    isVideo ? 'bg-gradient-to-br from-purple-500 to-blue-500' :
                                                    fileExt === 'pdf' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                                                    fileExt === 'doc' || fileExt === 'docx' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                                    fileExt === 'txt' ? 'bg-gradient-to-br from-gray-500 to-slate-500' :
                                                    fileExt === 'zip' || fileExt === 'rar' ? 'bg-gradient-to-br from-orange-500 to-yellow-500' :
                                                    'bg-gradient-to-br from-indigo-500 to-purple-500'
                                                  }`}
                                                  title="Download file"
                                                >
                                                  <Download className="h-5 w-5 text-white" />
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <p className="text-sm">{msg.message}</p>
                                  )}
                                  
                                  {/* Timestamp */}
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs opacity-70">{msg.timestamp}</span>
                                    {msg.isOutgoing && (
                                      <CheckCircle className="h-3 w-3 opacity-70" />
                                    )}
                                  </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          });
                        })()
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-6 border-t border-border">
                        {selectedMessage ? (
                          <>
                            {/* Hidden file input */}
                            <input
                              type="file"
                              id="file-upload"
                              className="hidden"
                              onChange={handleFileSelect}
                              accept="image/*,video/*,application/pdf,text/*"
                            />
                            
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
                                  disabled={sending || uploading}
                                  className="w-full px-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground disabled:opacity-50"
                                />
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={uploading}
                                className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                                title="Attach file"
                              >
                                {uploading ? (
                                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                ) : (
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                )}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Add emoji"
                              >
                                <Smile className="h-4 w-4 text-muted-foreground" />
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
                            
                            {/* Emoji Picker */}
                            <AnimatePresence>
                              {showEmojiPicker && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="emoji-picker-container absolute bottom-20 left-0 right-0 z-50"
                                >
                                  <EmojiPicker
                                    onEmojiClick={handleEmojiSelect}
                                    theme={Theme.DARK}
                                    searchDisabled={false}
                                    skinTonesDisabled={false}
                                    height={350}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
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
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">
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


      {/* File Upload Modal */}
      {showFileUpload && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-border"
          >
            <h3 className="text-xl font-semibold mb-4">Upload File</h3>
            <p className="text-muted-foreground mb-4">
              File: <span className="font-medium">{selectedFile.name}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowFileUpload(false);
                  setSelectedFile(null);
                }}
                className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload & Send'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Messages;
