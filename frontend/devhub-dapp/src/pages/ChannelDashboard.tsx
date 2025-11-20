import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { 
  Hash, 
  Users, 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  UserPlus, 
  UserMinus,
  Send,
  Paperclip,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { getChannelMembers } from '@/lib/suiClient';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface Channel {
  id: string;
  name: string;
  members: string[];
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
  unreadCount: number;
}

interface ChannelMember {
  address: string;
  name: string;
  title: string;
  imageUrl: string;
  isOnline: boolean;
}

interface ChannelMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

const ChannelDashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const { 
    getAllActiveCards,
    createChannelTransaction,
    addMemberToChannelTransaction,
    removeMemberFromChannelTransaction,
    getUserChannelMemberships,
    getChannelDetails,
    getChannelMessagesFromObject,
    sendMessageToChannelTransaction,
    uploadToWalrus
  } = useContract();

  // State management
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [availableDevelopers, setAvailableDevelopers] = useState<any[]>([]);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [addressToDeveloperMap, setAddressToDeveloperMap] = useState<Record<string, { name: string; title: string; imageUrl: string }>>({});
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Channel creation state
  const [channelName, setChannelName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [developerSearchQuery, setDeveloperSearchQuery] = useState('');

  // Toast functions
  const closeToast = () => {
    setToast(null);
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load user's channels
  const loadChannels = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // Get user's channel memberships
      const memberships = await getUserChannelMemberships(currentAccount.address);
      console.log('Channel memberships:', memberships);
      
      // Load channel details for each membership with unread counts
      const channelPromises = memberships.map(async (membership: any) => {
        console.log('Loading channel details for membership:', membership);
        const channelDetails = await getChannelDetails(membership.channelId);
        console.log('Channel details:', channelDetails);
        
        if (channelDetails) {
          // Calculate unread count for this channel
          let unreadCount = 0;
          try {
            const messages = await getChannelMessagesFromObject(membership.channelId);
            
            if (messages && messages.length > 0) {
              // Get last seen time for this channel
              const lastSeenKey = `lastSeen-channel-${membership.channelId}`;
              const lastSeen = localStorage.getItem(lastSeenKey);
              const lastSeenTime = lastSeen ? parseInt(lastSeen) : 0;
              
              // Count unread messages (messages from other participants after last seen)
              unreadCount = messages.filter((msg: any) => {
                // Skip messages from current user
                if (msg.sender === currentAccount?.address) return false;
                
                // Parse message timestamp
                const msgTimestamp = typeof msg.timestamp === 'string' 
                  ? parseInt(msg.timestamp) 
                  : msg.timestamp;
                const msgTimestampMs = msgTimestamp < 1000000000000 ? msgTimestamp * 1000 : msgTimestamp;
                
                // Check if message is after last seen
                return msgTimestampMs > lastSeenTime;
              }).length;
              
              console.log(`Channel ${channelDetails.name} has ${unreadCount} unread messages`);
            }
          } catch (error) {
            console.warn('Error calculating unread count for channel:', error);
          }
          
          return {
            id: channelDetails.id,
            name: channelDetails.name,
            members: channelDetails.members,
            createdAt: channelDetails.createdAt,
            lastActivity: channelDetails.lastActivity,
            isActive: channelDetails.isActive,
            unreadCount: unreadCount
          };
        }
        return null;
      });
      
      const channelResults = await Promise.all(channelPromises);
      const validChannels = channelResults.filter((channel: any): channel is Channel => channel !== null);
      
      setChannels(validChannels);
      
      // Auto-select first channel
      if (validChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(validChannels[0].id);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, getUserChannelMemberships, getChannelDetails]);

  // Load available developers for member management
  const loadAvailableDevelopers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const activeCards = await getAllActiveCards();
      console.log('Active cards loaded:', activeCards);
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
      
      console.log('Available developers for member management:', developers);
      setAvailableDevelopers(developers);
    } catch (error) {
      console.error('Error loading developers:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [getAllActiveCards, currentAccount?.address]);

  // Load available developers for create channel modal
  const [createChannelDevelopers, setCreateChannelDevelopers] = useState<any[]>([]);
  const [loadingCreateChannelDevelopers, setLoadingCreateChannelDevelopers] = useState(false);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // File upload state
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  // Load developer information for all addresses
  const loadDeveloperInfo = useCallback(async () => {
    try {
      console.log('Starting to load developer info...');
      const activeCards = await getAllActiveCards();
      console.log('Loading developer info from cards:', activeCards);
      console.log('Active cards length:', activeCards?.length);
      
      const developerMap: Record<string, { name: string; title: string; imageUrl: string }> = {};
      
      if (activeCards && Array.isArray(activeCards)) {
        activeCards.forEach((card: any, index: number) => {
          console.log(`Processing card ${index}:`, card);
          if (card.owner && card.name) {
            developerMap[card.owner] = {
              name: card.name,
              title: card.title || 'Developer',
              imageUrl: card.imageUrl || '/api/placeholder/40/40'
            };
            console.log(`Added developer: ${card.owner} -> ${card.name}`);
          } else {
            console.log(`Skipping card ${index} - missing owner or name:`, { owner: card.owner, name: card.name });
          }
        });
      } else {
        console.warn('Active cards is not an array or is null/undefined:', activeCards);
      }
      
      setAddressToDeveloperMap(developerMap);
      console.log('Loaded developer info for addresses:', Object.keys(developerMap));
      console.log('Final developer map:', developerMap);
    } catch (error) {
      console.error('Error loading developer info:', error);
    }
  }, [getAllActiveCards]);

  const loadCreateChannelDevelopers = useCallback(async () => {
    setLoadingCreateChannelDevelopers(true);
    try {
      const activeCards = await getAllActiveCards();
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
      
      setCreateChannelDevelopers(developers);
    } catch (error) {
      console.error('Error loading developers for create channel:', error);
    } finally {
      setLoadingCreateChannelDevelopers(false);
    }
  }, [getAllActiveCards, currentAccount?.address]);

  // Load channel members
  const loadChannelMembers = useCallback(async (channelId: string) => {
    try {
      const members = await getChannelMembers(channelId);
      console.log('Raw channel members:', members);
      console.log('Address to developer map:', addressToDeveloperMap);
      
      // Enhance members with developer card info
      const enhancedMembers = members.map((member: any) => {
        const developerInfo = addressToDeveloperMap[member.address];
        console.log(`Enhancing member ${member.address}:`, developerInfo);
        if (developerInfo) {
          return {
            ...member,
            name: developerInfo.name || member.name,
            title: developerInfo.title || member.title,
            imageUrl: developerInfo.imageUrl || member.imageUrl
          };
        }
        return member;
      });
      
      console.log('Enhanced channel members:', enhancedMembers);
      setChannelMembers(enhancedMembers);
    } catch (error) {
      console.error('Error loading channel members:', error);
    }
  }, [getChannelMembers]);

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
    
    // Check channel members
    const member = channelMembers.find(m => m.address === address);
    if (member && member.name) {
      return member.name;
    }
    
    // Check available developers (for create channel modal)
    const developer = availableDevelopers.find(dev => dev.owner === address);
    if (developer && developer.name) {
      return developer.name;
    }
    
    // Check create channel developers
    const createChannelDev = createChannelDevelopers.find(dev => dev.owner === address);
    if (createChannelDev && createChannelDev.name) {
      return createChannelDev.name;
    }
    
    // Fallback to address
    return `Developer ${address.slice(0, 8)}...`;
  }, [currentAccount?.address, addressToDeveloperMap, channelMembers, availableDevelopers, createChannelDevelopers]);

  // Get user avatar for a given address
  const getUserAvatar = useCallback((address: string) => {
    // Check developer map first (most reliable source)
    const developerInfo = addressToDeveloperMap[address];
    if (developerInfo && developerInfo.imageUrl) {
      return developerInfo.imageUrl;
    }
    
    // Check channel members
    const member = channelMembers.find(m => m.address === address);
    if (member && member.imageUrl) {
      return member.imageUrl;
    }
    
    // Check available developers
    const developer = availableDevelopers.find(dev => dev.owner === address);
    if (developer && developer.imageUrl) {
      return developer.imageUrl;
    }
    
    // Check create channel developers
    const createChannelDev = createChannelDevelopers.find(dev => dev.owner === address);
    if (createChannelDev && createChannelDev.imageUrl) {
      return createChannelDev.imageUrl;
    }
    
    // Fallback to generated avatar
    const name = getUserName(address);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=40`;
  }, [addressToDeveloperMap, channelMembers, availableDevelopers, createChannelDevelopers, getUserName]);

  // Load channel messages with force refresh support (same pattern as Messages page)
  const loadChannelMessages = useCallback(async (channelId: string, forceRefresh: boolean = false) => {
    if (!channelId || !currentAccount?.address) return;
    
    // Only load from localStorage if not force refreshing and we have existing messages
    if (!forceRefresh && channelMessages.length > 0) {
      try {
        const cachedMessages = localStorage.getItem(`channel-messages-${channelId}`);
        if (cachedMessages) {
          const parsedMessages = JSON.parse(cachedMessages);
          setChannelMessages(parsedMessages);
          console.log('Loaded cached channel messages from localStorage:', parsedMessages.length);
        }
      } catch (error) {
        console.warn('Failed to load channel messages from localStorage:', error);
      }
    }
    
    // Clear localStorage cache only if force refresh is requested
    if (forceRefresh) {
      try {
        localStorage.removeItem(`channel-messages-${channelId}`);
        console.log('Cleared localStorage cache for channel:', channelId);
      } catch (error) {
        console.warn('Failed to clear localStorage cache:', error);
      }
    }
    
    try {
      console.log('Loading messages for channel:', channelId);
      const messages = await getChannelMessagesFromObject(channelId);
      console.log('Loaded messages:', messages);
      
      // Convert to ChannelMessage format
      const uiMessages: ChannelMessage[] = messages.map((msg: any, index: number) => ({
        id: `${channelId}-${index}-${msg.timestamp}`,
        sender: msg.sender,
        content: msg.content,
        timestamp: typeof msg.timestamp === 'string' ? parseInt(msg.timestamp) : msg.timestamp,
        isRead: msg.isRead || false
      }));
      
      console.log('UI channel messages:', uiMessages);
      
      // If this is a force refresh (after sending a message), merge with existing messages
      if (forceRefresh) {
        setChannelMessages(prev => {
          // Keep optimistic messages that haven't been confirmed yet
          const optimisticMessages = prev.filter(msg => 
            msg.id.toString().startsWith('temp_') || 
            msg.sender === currentAccount?.address
          );
          // Combine optimistic messages with new blockchain messages
          const allMessages = [...optimisticMessages, ...uiMessages];
          // Remove duplicates and sort by timestamp
          const uniqueMessages = allMessages.filter((msg, index, arr) => 
            arr.findIndex(m => m.id === msg.id) === index
          ).sort((a, b) => a.timestamp - b.timestamp);
          return uniqueMessages;
        });
      } else {
        setChannelMessages(uiMessages);
      }
      
      // Store messages in localStorage for persistence
      try {
        localStorage.setItem(`channel-messages-${channelId}`, JSON.stringify(uiMessages));
        console.log('Channel messages stored in localStorage for persistence');
      } catch (storageError) {
        console.warn('Failed to store channel messages in localStorage:', storageError);
      }
      
      // Update last seen when messages are loaded (mark as read)
      localStorage.setItem(`lastSeen-channel-${channelId}`, Date.now().toString());
    } catch (error) {
      console.error('Error loading channel messages:', error);
      
      // Try to load from localStorage as fallback only if blockchain fetch fails
      try {
        const storedMessages = localStorage.getItem(`channel-messages-${channelId}`);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setChannelMessages(parsedMessages);
          console.log('Loaded channel messages from localStorage fallback');
        } else {
          // If no cached messages and blockchain fetch failed, show empty state
          setChannelMessages([]);
        }
      } catch (storageError) {
        console.error('Failed to load channel messages from localStorage:', storageError);
        setChannelMessages([]);
      }
    }
  }, [getChannelMessagesFromObject, currentAccount?.address]);

  // Create new channel
  const handleCreateChannel = useCallback(async () => {
    if (!channelName.trim() || selectedMembers.length === 0 || !currentAccount?.address) {
      console.error('Channel name and members are required');
      return;
    }
    
    setCreatingChannel(true);
    try {
      const allMembers = [currentAccount.address, ...selectedMembers];
      const tx = await createChannelTransaction(channelName, allMembers);

      // Optimistic UI: add a temporary channel and select it immediately
      const tempId = `temp_${Date.now()}`;
      const optimisticChannel: Channel = {
        id: tempId,
        name: channelName,
        members: allMembers,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        unreadCount: 0,
      };
      setChannels(prev => [optimisticChannel, ...prev]);
      setSelectedChannel(tempId);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log('Channel created:', result);

      // Success toast
      setToast({ message: 'Channel created successfully!', type: 'success' });

      // Reset form and close modal
      setChannelName('');
      setSelectedMembers([]);
      setShowCreateChannel(false);

      // Background refresh: replace optimistic with real channel and reselect
      setTimeout(async () => {
        await loadChannels();
        // Try to find the newly created channel by name and membership overlap
        setChannels(prev => {
          const found = prev.find(c => c.name === channelName);
          if (found) {
            setSelectedChannel(found.id);
          }
          return prev;
        });
      }, 1200);

    } catch (error) {
      console.error('Error creating channel:', error);
      setToast({ message: 'Failed to create channel. Please try again.', type: 'error' });
      // Roll back optimistic channel if any
      setChannels(prev => prev.filter(c => !c.id.startsWith('temp_')));
    } finally {
      setCreatingChannel(false);
    }
  }, [channelName, selectedMembers, currentAccount?.address, createChannelTransaction, signAndExecute, loadChannels]);

  // Add member to channel
  const handleAddMember = useCallback(async (memberAddress: string) => {
    if (!selectedChannel) return;
    
    try {
      const tx = await addMemberToChannelTransaction(selectedChannel, memberAddress);
      const result = await signAndExecute({
        transaction: tx,
      });
      
      console.log('Member added:', result);
      
      // Show success toast
      setToast({ message: 'Member added successfully!', type: 'success' });
      
      // Reload channel members
      await loadChannelMembers(selectedChannel);
      
    } catch (error) {
      console.error('Error adding member:', error);
      setToast({ message: 'Failed to add member. Please try again.', type: 'error' });
    }
  }, [selectedChannel, addMemberToChannelTransaction, signAndExecute, loadChannelMembers]);

  // Remove member from channel
  const handleRemoveMember = useCallback(async (memberAddress: string) => {
    if (!selectedChannel) return;
    
    try {
      const tx = await removeMemberFromChannelTransaction(selectedChannel, memberAddress);
      const result = await signAndExecute({
        transaction: tx,
      });
      
      console.log('Member removed:', result);
      
      // Show success toast
      setToast({ message: 'Member removed successfully!', type: 'success' });
      
      // Reload channel members
      await loadChannelMembers(selectedChannel);
      
    } catch (error) {
      console.error('Error removing member:', error);
      setToast({ message: 'Failed to remove member. Please try again.', type: 'error' });
    }
  }, [selectedChannel, removeMemberFromChannelTransaction, signAndExecute, loadChannelMembers]);

  // Send message
  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileUpload(true);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !currentAccount?.address || !selectedChannel) return;

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
      
      // Do not append optimistically; wait until chain confirms
      
      // Get user's channel memberships to find the MemberCap
      const memberships = await getUserChannelMemberships(currentAccount.address);
      let membership = memberships.find((m: any) => m.channelId === selectedChannel);
      
      if (!membership) {
        membership = memberships.find((m: any) => m.id === selectedChannel);
      }
      
      if (!membership || !membership.memberCapId) {
        throw new Error('MemberCap not found for this channel.');
      }

      // Create the transaction for sending message to channel
      const messageBytes = new TextEncoder().encode(messageWithFile);
      const contentHash = new TextEncoder().encode(messageWithFile);
      
      const tx = await sendMessageToChannelTransaction(
        selectedChannel,
        membership.memberCapId,
        messageBytes,
        contentHash
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

      // Clear and reload messages with force refresh
      setChannelMessages([]);
      setShowFileUpload(false);
      setSelectedFile(null);
      
      await loadChannelMessages(selectedChannel, true);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      // No optimistic UI to rollback
    } finally {
      setUploading(false);
    }
  }, [selectedFile, currentAccount?.address, selectedChannel, uploadToWalrus, getUserChannelMemberships, sendMessageToChannelTransaction, signAndExecute, loadChannelMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChannel || sending || !currentAccount?.address) return;
    
    setSending(true);
    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately for better UX
    
    // Do not append optimistically; wait for confirmation
    
    try {
      
      // Get user's channel memberships to find the MemberCap
      const memberships = await getUserChannelMemberships(currentAccount.address);
      console.log('User memberships:', memberships);
      console.log('Looking for channel:', selectedChannel);
      
      // Try to find membership by channelId first
      let membership = memberships.find((m: any) => m.channelId === selectedChannel);
      console.log('Found membership by channelId:', membership);
      
      // If not found, try to find by id (in case the channel ID format is different)
      if (!membership) {
        membership = memberships.find((m: any) => m.id === selectedChannel);
        console.log('Found membership by id:', membership);
      }
      
      if (!membership || !membership.memberCapId) {
        console.error('MemberCap not found. Available memberships:', memberships);
        console.error('Selected channel ID:', selectedChannel);
        throw new Error('MemberCap not found for this channel. Please ensure you are a member of this channel.');
      }
      
      // Create the transaction for sending message to channel
      // Properly encode the message content to handle emojis
      const messageBytes = new TextEncoder().encode(messageContent);
      const contentHash = new TextEncoder().encode(messageContent);
      
      console.log('Sending message with content:', messageContent);
      console.log('Message bytes length:', messageBytes.length);
      console.log('Message bytes:', Array.from(messageBytes));
      
      const tx = await sendMessageToChannelTransaction(
        selectedChannel,
        membership.memberCapId,
        messageBytes,
        contentHash
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
      
      console.log('Message sent to channel:', digest);
      
      // Show success toast
      setToast({ message: 'Message sent successfully!', type: 'success' });
      
      try {
        await loadChannelMessages(selectedChannel, true);
      } catch (error) {
        console.error('Error reloading messages after send:', error);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setToast({ message: 'Failed to send message. Please try again.', type: 'error' });
      
      // No optimistic UI to rollback
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedChannel, sending, currentAccount?.address, getUserChannelMemberships, sendMessageToChannelTransaction, signAndExecute, loadChannelMessages]);

  // Load channels and developer info on mount
  useEffect(() => {
    if (currentAccount?.address) {
      loadChannels();
      loadDeveloperInfo();
    }
  }, [currentAccount?.address]); // Only depend on currentAccount to prevent infinite loops

  // Load channel members and messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadChannelMembers(selectedChannel);
      // Force refresh messages when switching channels (same pattern as Messages page)
      loadChannelMessages(selectedChannel, true);
    }
  }, [selectedChannel]); // Only depend on selectedChannel

  // Reload channel members when developer map is updated
  useEffect(() => {
    if (selectedChannel && Object.keys(addressToDeveloperMap).length > 0) {
      loadChannelMembers(selectedChannel);
    }
  }, [addressToDeveloperMap, selectedChannel]); // Reload when developer map changes

  // Debug: Log channelMessages changes (removed to prevent infinite loops)
  // useEffect(() => {
  //   console.log('channelMessages updated:', channelMessages);
  // }, [channelMessages]);

  // Load available developers when member management opens
  useEffect(() => {
    if (showMemberManagement) {
      loadAvailableDevelopers();
    }
  }, [showMemberManagement]); // Only depend on showMemberManagement

  // Load available developers when create channel modal opens
  useEffect(() => {
    if (showCreateChannel) {
      loadCreateChannelDevelopers();
    }
  }, [showCreateChannel]); // Only depend on showCreateChannel

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter developers for create channel modal
  const filteredCreateChannelDevelopers = createChannelDevelopers.filter(developer =>
    developer.name.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    developer.title.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
    developer.technologies.toLowerCase().includes(developerSearchQuery.toLowerCase())
  );

  // Filter developers for member management modal
  const filteredMemberDevelopers = availableDevelopers.filter(developer =>
    developer.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    developer.title.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    developer.technologies.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
        >
          <div className={`p-4 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={closeToast}
                className="ml-auto hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Channels</h1>
                  <p className="text-muted-foreground">
                    Manage your group channels and team communication
                  </p>
                </div>
                
                <div className="flex items-center gap-3 relative z-50">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateChannel(true)}
                    className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2 relative z-50"
                  >
                    <Plus className="h-4 w-4" />
                    Create Channel
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                />
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Channels List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    Your Channels
                  </h3>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredChannels.map((channel) => (
                        <motion.div
                          key={channel.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            console.log('Selecting channel:', channel.id);
                            
                            // Mark channel as read
                            setChannels(prev => prev.map(ch => 
                              ch.id === channel.id 
                                ? { ...ch, unreadCount: 0 }
                                : ch
                            ));
                            
                            // Update last seen in localStorage
                            localStorage.setItem(`lastSeen-channel-${channel.id}`, Date.now().toString());
                            
                            setSelectedChannel(channel.id);
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${
                            selectedChannel === channel.id
                              ? 'bg-primary/20 border border-primary/30'
                              : 'bg-background/50 hover:bg-background/70 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                              <Hash className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">
                                {channel.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {channel.members.length} members
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {channel.unreadCount > 0 && (
                                <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                                  {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                                </div>
                              )}
                              {channel.isActive && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Channel Chat */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3"
              >
                {selectedChannelData ? (
                  <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border h-[600px] flex flex-col">
                    {/* Channel Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <Hash className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{selectedChannelData.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedChannelData.members.length} members
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!selectedChannel) return;
                              console.log('🔄 Refreshing messages for channel:', selectedChannel);
                              
                              // Clear localStorage cache to force fresh data
                              try {
                                localStorage.removeItem(`channel-messages-${selectedChannel}`);
                                console.log('✅ Cleared localStorage cache');
                              } catch (error) {
                                console.warn('Failed to clear localStorage cache:', error);
                              }
                              
                              // Force refresh messages from blockchain
                              try {
                                await loadChannelMessages(selectedChannel, true);
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
                          </button>
                          <button
                            onClick={() => setShowMemberManagement(true)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Manage members"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Channel settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                      {channelMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No messages yet</p>
                            <p className="text-sm text-muted-foreground/70">
                              Start the conversation!
                            </p>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          // Group messages by date and sender
                          const groupedMessages = channelMessages.reduce((groups, message, index) => {
                            const prevMessage = index > 0 ? channelMessages[index - 1] : null;
                            const messageDate = new Date(message.timestamp).toDateString();
                            const prevDate = prevMessage ? new Date(prevMessage.timestamp).toDateString() : null;
                            
                            // Add date header if needed
                            if (messageDate !== prevDate) {
                              groups.push({
                                type: 'date',
                                date: messageDate,
                                key: `date-${messageDate}`
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
                            
                            const { message, index } = item;
                            const prevMessage = index > 0 ? channelMessages[index - 1] : null;
                            const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;
                            const senderName = getUserName(message.sender);
                            const senderAvatar = getUserAvatar(message.sender);
                            
                            const isCurrentUser = message.sender === currentAccount?.address;
                            
                            return (
                              <div key={item.key} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
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
                                        {(() => {
                                          try {
                                            const date = new Date(message.timestamp);
                                            if (isNaN(date.getTime())) {
                                              return 'Invalid time';
                                            }
                                            return date.toLocaleTimeString('en-US', { 
                                              hour: '2-digit', 
                                              minute: '2-digit',
                                              hour12: false 
                                            });
                                          } catch (error) {
                                            console.warn('Error formatting timestamp:', error);
                                            return 'Invalid time';
                                          }
                                        })()}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Message bubble */}
                                  <div className={`px-4 py-3 rounded-2xl ${
                                    isCurrentUser
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-purple-500/20 text-foreground border border-purple-500/30'
                                  }`}>
                                    {/* Check if message contains a file attachment */}
                                    {message.content.startsWith('📎') ? (
                                      (() => {
                                        const lines = message.content.split('\n');
                                        const fileName = lines[0].replace('📎 ', '').trim();
                                        const url = lines.find((line: string) => line.startsWith('http'));
                                        
                                        if (!url) {
                                          return <p className="text-sm">{message.content}</p>;
                                        }

                                        // Determine file type
                                        const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
                                        const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
                                        const isMedia = isImage || isVideo;
                                        
                                        // Get file extension for icon
                                        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

                                        return (
                                          <div className={`backdrop-blur-sm rounded-xl p-4 ${
                                            isCurrentUser 
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
                                      <p className="text-sm leading-relaxed">
                                        {message.content}
                                      </p>
                                    )}
                                    
                                    {/* Timestamp */}
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs opacity-70">
                                        {(() => {
                                          try {
                                            const date = new Date(message.timestamp);
                                            if (isNaN(date.getTime())) {
                                              return 'Invalid time';
                                            }
                                            return date.toLocaleTimeString('en-US', { 
                                              hour: '2-digit', 
                                              minute: '2-digit',
                                              hour12: false 
                                            });
                                          } catch (error) {
                                            console.warn('Error formatting timestamp:', error);
                                            return 'Invalid time';
                                          }
                                        })()}
                                      </span>
                                      {isCurrentUser && (
                                        <CheckCircle className="h-3 w-3 opacity-70" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-6 border-t border-border bg-card/30 backdrop-blur-sm">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        id="file-upload-channel"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf,text/*"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => document.getElementById('file-upload-channel')?.click()}
                          className="p-3 hover:bg-accent/50 rounded-xl transition-colors border border-border/50 hover:border-border"
                          title="Attach file"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder={`Message #${selectedChannelData.name}...`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={sending}
                            className="w-full px-4 py-3 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-foreground placeholder-muted-foreground disabled:opacity-50"
                          />
                        </div>
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-3 hover:bg-accent/50 rounded-xl transition-colors border border-border/50 hover:border-border"
                          title="Add emoji"
                        >
                          <Smile className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-primary/25"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
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
                      </div>
                    </div>
                ) : (
                  <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a channel to start chatting</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

      {/* Create Channel Modal */}
      <AnimatePresence>
        {showCreateChannel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full mx-4 border border-border max-h-[80vh] overflow-hidden flex flex-col"
            >
              <h3 className="text-xl font-semibold mb-4 text-foreground">Create New Channel</h3>
              <p className="text-muted-foreground mb-4">
                Create a channel and add members to start group conversations:
              </p>
              
              {/* Channel Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Channel Name</label>
                <input
                  type="text"
                  placeholder="Enter channel name..."
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                />
              </div>
              
              {/* Member Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Add Members</label>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search developers to add..."
                    value={developerSearchQuery}
                    onChange={(e) => setDeveloperSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  />
                </div>
                
                {/* Available Developers List */}
                {loadingCreateChannelDevelopers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filteredCreateChannelDevelopers.map(developer => (
                      <div
                        key={developer.owner}
                        className={`p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all flex items-center gap-3 ${
                          selectedMembers.includes(developer.owner) 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-background/50'
                        }`}
                        onClick={() => {
                          if (selectedMembers.includes(developer.owner)) {
                            setSelectedMembers(prev => prev.filter(addr => addr !== developer.owner));
                          } else {
                            setSelectedMembers(prev => [...prev, developer.owner]);
                          }
                        }}
                      >
                        <img
                          src={developer.imageUrl}
                          alt={developer.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{developer.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{developer.title}</p>
                        </div>
                        {selectedMembers.includes(developer.owner) ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                    {filteredCreateChannelDevelopers.length === 0 && developerSearchQuery && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No developers found matching "{developerSearchQuery}"
                      </div>
                    )}
                    {filteredCreateChannelDevelopers.length === 0 && !developerSearchQuery && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No developers available
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Members */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-foreground">Selected Members</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedMembers.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No members selected</div>
                    ) : (
                      selectedMembers.map(memberAddress => {
                        const developer = createChannelDevelopers.find(dev => dev.owner === memberAddress);
                        return (
                          <div
                            key={memberAddress}
                            className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3"
                          >
                            {developer ? (
                              <>
                                <img
                                  src={developer.imageUrl}
                                  alt={developer.name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {developer.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {developer.title}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {memberAddress.slice(0, 8)}...
                                  </p>
                                </div>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedMembers(prev => prev.filter(addr => addr !== memberAddress))}
                              className="p-1 hover:bg-destructive/20 rounded transition-colors"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowCreateChannel(false);
                    setChannelName('');
                    setSelectedMembers([]);
                    setDeveloperSearchQuery('');
                  }}
                  className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!channelName.trim() || selectedMembers.length === 0 || creatingChannel}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingChannel ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Channel'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Management Modal */}
      <AnimatePresence>
        {showMemberManagement && selectedChannelData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full mx-4 border border-border max-h-[80vh] overflow-hidden flex flex-col"
            >
              <h3 className="text-xl font-semibold mb-4 text-foreground">Manage Channel Members</h3>
              <p className="text-muted-foreground mb-4">
                Add or remove members from {selectedChannelData.name}
              </p>
              
              {/* Current Members */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-foreground">Current Members</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {channelMembers.map((member) => (
                    <div
                      key={member.address}
                      className="p-3 bg-background/50 rounded-lg border border-border flex items-center gap-3"
                    >
                      <img
                        src={getUserAvatar(member.address)}
                        alt={getUserName(member.address)}
                        className="w-8 h-8 rounded-lg object-cover border border-border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(member.address))}&background=random&color=fff&size=32`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{getUserName(member.address)}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {(() => {
                            const developerInfo = addressToDeveloperMap[member.address];
                            return (developerInfo && developerInfo.title) || member.title || 'Developer';
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        {member.address !== currentAccount?.address && (
                          <button
                            onClick={() => handleRemoveMember(member.address)}
                            className="p-1 hover:bg-destructive/20 rounded transition-colors"
                            title="Remove member"
                          >
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Add Members */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3 text-foreground">Add New Members</h4>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search developers to add..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  />
                </div>
                
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filteredMemberDevelopers
                      .filter(dev => !channelMembers.some(member => member.address === dev.owner))
                      .map(developer => (
                        <div
                          key={developer.owner}
                          className="p-3 bg-background/50 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all flex items-center gap-3"
                          onClick={() => handleAddMember(developer.owner)}
                        >
                          <img
                            src={developer.imageUrl}
                            alt={developer.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{developer.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{developer.title}</p>
                          </div>
                          <UserPlus className="h-4 w-4 text-primary" />
                        </div>
                      ))}
                    {filteredMemberDevelopers.filter(dev => !channelMembers.some(member => member.address === dev.owner)).length === 0 && memberSearchQuery && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No developers found matching "{memberSearchQuery}"
                      </div>
                    )}
                    {filteredMemberDevelopers.filter(dev => !channelMembers.some(member => member.address === dev.owner)).length === 0 && !memberSearchQuery && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No developers available to add
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowMemberManagement(false);
                    setMemberSearchQuery('');
                  }}
                  className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Upload Modal */}
      {showFileUpload && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-border"
          >
            <h3 className="text-xl font-semibold mb-4 text-foreground">Upload File</h3>
            <p className="text-muted-foreground mb-4">
              File: <span className="font-medium text-foreground">{selectedFile.name}</span>
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

export default ChannelDashboard;
