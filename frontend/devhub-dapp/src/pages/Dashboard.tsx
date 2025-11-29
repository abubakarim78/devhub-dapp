import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { User, AlertCircle, CheckCircle, Activity, X, Search, Star, Zap, Briefcase, Users, Wallet, Send, Download, Loader2, Copy, Check, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { 
  getDetailedAnalytics,
  DEVHUB_OBJECT_ID,
  PACKAGE_ID,
  updateCardTransaction,
  getWorkPreferences,
  getSocialLinks
} from '@/lib/suiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DashboardStats {
  activeProjects: number;
  newMessages: number;
  profileViews: number;
  profileHealth: number;
}

interface ActivityItem {
  id: string;
  type: 'review' | 'connection' | 'payment' | 'project';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning';
}

interface SuggestedDeveloper {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  status: 'available' | 'busy' | 'offline';
  verified?: boolean;
  experience?: number;
  views?: number;
  cardId?: number;
  niche?: string;
}

interface OpenProject {
  id: string;
  title: string;
  description: string;
  budget?: string;
  skills: string[];
  status: 'open' | 'in-progress' | 'completed';
}

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





const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { theme } = useTheme();
  const { getUserCards, useConversations, useMessages, getAllCards, uploadToWalrus } = useContract();
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    newMessages: 0,
    profileViews: 0,
    profileHealth: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [suggestedDevelopers, setSuggestedDevelopers] = useState<SuggestedDeveloper[]>([]);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    id: string;
    type: 'sent' | 'received' | 'other';
    amount?: string;
    to?: string;
    from?: string;
    timestamp: string;
    description: string;
  }>>([]);
  
  // Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  
  // Profile settings states
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    niche: '',
    customNiche: '',
    about: '',
    imageUrl: '',
    technologies: '',
    portfolio: '',
    contact: '',
    yearsOfExperience: 0,
    github: '',
    linkedin: '',
    twitter: '',
    personalWebsite: '',
    workTypes: [] as string[],
    hourlyRate: null as number | null,
    locationPreference: '',
    availability: '',
    languages: [] as string[],
    openToWork: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const closeToast = () => {
    setToast(null);
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const timestampMs = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
    const diff = now - timestampMs;
    
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
      return new Date(timestampMs).toLocaleDateString();
    }
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!currentAccount?.address) return;
    
    try {
      await navigator.clipboard.writeText(currentAccount.address);
      setAddressCopied(true);
      showToast('Address copied to clipboard!', 'success');
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      showToast('Failed to copy address', 'error');
    }
  };

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Handle send SUI
  const handleSendSui = async () => {
    if (!currentAccount?.address || !sendRecipient || !sendAmount) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Validate recipient address (basic validation)
    const trimmedRecipient = sendRecipient.trim();
    if (!trimmedRecipient.startsWith('0x') || trimmedRecipient.length < 10) {
      showToast('Invalid recipient address', 'error');
      return;
    }

    // Validate amount
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    // Check if user has enough balance
    const balanceNum = parseFloat(walletBalance.replace(/,/g, ''));
    if (amount > balanceNum) {
      showToast('Insufficient balance', 'error');
      return;
    }

    setSending(true);
    try {
      // Get coins for the user
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: '0x2::sui::SUI',
        limit: 50, // Get up to 50 coins
      });

      if (!coins.data || coins.data.length === 0) {
        throw new Error('No SUI coins found');
      }

      // Convert amount to MIST (1 SUI = 1,000,000,000 MIST)
      const amountInMist = BigInt(Math.floor(amount * 1_000_000_000));

      // Create transaction
      const tx = new Transaction();
      
      // Calculate total balance from all coins
      let totalBalance = BigInt(0);
      const coinObjects: string[] = [];
      
      for (const coin of coins.data) {
        const balance = BigInt(coin.balance);
        totalBalance += balance;
        coinObjects.push(coin.coinObjectId);
        
        if (totalBalance >= amountInMist) {
          break; // We have enough coins
        }
      }

      if (totalBalance < amountInMist) {
        throw new Error('Insufficient balance in available coins');
      }

      // If we need multiple coins, merge them first
      if (coinObjects.length > 1) {
        const primaryCoin = tx.object(coinObjects[0]);
        const otherCoins = coinObjects.slice(1).map(id => tx.object(id));
        tx.mergeCoins(primaryCoin, otherCoins);
        
        // Split the merged coin
        const [transferCoin] = tx.splitCoins(primaryCoin, [amountInMist]);
        tx.transferObjects([transferCoin], trimmedRecipient);
      } else {
        // Single coin - check if we need to split
        const coinBalance = BigInt(coins.data[0].balance);
        if (amountInMist < coinBalance) {
          // Split the coin
          const [transferCoin] = tx.splitCoins(tx.object(coinObjects[0]), [amountInMist]);
          tx.transferObjects([transferCoin], trimmedRecipient);
        } else {
          // Transfer the entire coin
          tx.transferObjects([tx.object(coinObjects[0])], trimmedRecipient);
        }
      }

      // Execute transaction
      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Transaction successful:', result);
            showToast(`Successfully sent ${sendAmount} SUI`, 'success');
            setShowSendModal(false);
            setSendRecipient('');
            setSendAmount('');
            // Refresh wallet balance
            setTimeout(() => {
              loadDashboardData();
            }, 2000); // Wait a bit for the transaction to be indexed
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            showToast('Failed to send SUI. Please try again.', 'error');
          },
        }
      );
    } catch (error: any) {
      console.error('Error sending SUI:', error);
      showToast(error?.message || 'Failed to send SUI. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  // Load profile data into form
  const loadProfileData = useCallback(async (card: any) => {
    try {
      // Load work preferences and social links in parallel
      const [workPrefs, socialLinks] = await Promise.all([
        getWorkPreferences(card.id).catch(() => null),
        getSocialLinks(card.id).catch(() => null)
      ]);

      setProfileFormData({
        name: card.name || '',
        niche: card.niche || 'Developer',
        customNiche: card.customNiche || '',
        about: card.about || card.description || '',
        imageUrl: card.imageUrl || '',
        technologies: card.technologies || '',
        portfolio: card.portfolio || '',
        contact: card.contact || '',
        yearsOfExperience: card.yearsOfExperience || 0,
        github: socialLinks?.github || '',
        linkedin: socialLinks?.linkedin || '',
        twitter: socialLinks?.twitter || '',
        personalWebsite: socialLinks?.personalWebsite || '',
        workTypes: workPrefs?.workTypes || [],
        hourlyRate: workPrefs?.hourlyRate ?? null,
        locationPreference: workPrefs?.locationPreference || '',
        availability: workPrefs?.availability || '',
        languages: card.languages || [],
        openToWork: card.openToWork ?? true
      });

      if (card.imageUrl) {
        setImagePreview(card.imageUrl);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }, []);

  // Load dashboard data on component mount
  useEffect(() => {
    if (currentAccount?.address) {
      loadDashboardData();
    }
  }, [currentAccount?.address]);

  const loadDashboardData = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // Phase 1: Load critical data in parallel
      const [cards, devhubObj, balances, conversations] = await Promise.all([
        getUserCards(currentAccount.address).catch(err => {
          console.error('Error fetching user cards:', err);
          return [];
        }),
        suiClient.getObject({
          id: DEVHUB_OBJECT_ID,
          options: { showContent: true, showType: true, showOwner: true }
        }).catch(err => {
          console.error('Error fetching devhub object:', err);
          return null;
        }),
        suiClient.getAllBalances({
          owner: currentAccount.address
        }).catch(err => {
          console.error('Error fetching balances:', err);
          return [];
        }),
        useConversations(currentAccount.address, true).catch(err => {
          console.error('Error fetching conversations:', err);
          return [];
        })
      ]);

      // Update user cards immediately
      setUserCards(cards);
      
      // Load profile data into form if available
      if (cards.length > 0) {
        const card = cards[0];
        loadProfileData(card);
      }
      
      // Calculate profile health
      const profileHealth = cards.length > 0 ? 
        Math.min(100, (cards[0]?.name ? 20 : 0) + (cards[0]?.skills?.length > 0 ? 20 : 0) + 
        (cards[0]?.description ? 20 : 0) + (cards[0]?.about ? 20 : 0) + (cards[0]?.imageUrl ? 20 : 0)) : 0;

      // Process wallet balance
      let balance = '0';
      const suiBalance = balances.find(b => b.coinType === '0x2::sui::SUI');
      if (suiBalance) {
        const balanceInSui = Number(suiBalance.totalBalance) / 1_000_000_000;
        balance = balanceInSui.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      }
      setWalletBalance(balance);

      // Process unread messages - load messages for each conversation and calculate unread count
      let unreadMessagesCount = 0;
      if (conversations && conversations.length > 0) {
        // Load messages for each conversation and calculate unread count
        await Promise.all(conversations.map(async (conv: any) => {
          try {
            const messages = await useMessages(conv.id, [conv.participant1, conv.participant2]);
            
            if (messages && messages.length > 0) {
              // Get last seen time from localStorage
              const lastSeenKey = `lastSeen-${conv.id}`;
              let lastSeen = localStorage.getItem(lastSeenKey);
              let lastSeenTime = lastSeen ? parseInt(lastSeen) : 0;
              
              // If lastSeen is not set, initialize it to the latest message timestamp
              // This prevents existing messages from being counted as unread
              if (lastSeenTime === 0) {
                // Find the latest message timestamp
                const latestMessage = messages.reduce((latest: any, msg: any) => {
                  try {
                    const msgTimestamp = typeof msg.timestamp === 'string' 
                      ? parseInt(msg.timestamp) 
                      : msg.timestamp;
                    const msgTimestampMs = msgTimestamp < 1000000000000 ? msgTimestamp * 1000 : msgTimestamp;
                    const latestTimestamp = typeof latest.timestamp === 'string' 
                      ? parseInt(latest.timestamp) 
                      : latest.timestamp;
                    const latestTimestampMs = latestTimestamp < 1000000000000 ? latestTimestamp * 1000 : latestTimestamp;
                    return msgTimestampMs > latestTimestampMs ? msg : latest;
                  } catch (e) {
                    return latest;
                  }
                }, messages[0]);
                
                if (latestMessage) {
                  try {
                    const msgTimestamp = typeof latestMessage.timestamp === 'string' 
                      ? parseInt(latestMessage.timestamp) 
                      : latestMessage.timestamp;
                    lastSeenTime = msgTimestamp < 1000000000000 ? msgTimestamp * 1000 : msgTimestamp;
                    // Save to localStorage so we don't recalculate every time
                    localStorage.setItem(lastSeenKey, lastSeenTime.toString());
                  } catch (e) {
                    // If we can't parse, use current time
                    lastSeenTime = Date.now();
                    localStorage.setItem(lastSeenKey, lastSeenTime.toString());
                  }
                }
              }
              
              // Count unread messages (messages from other participant after last seen)
              const unread = messages.filter((msg: any) => {
                // Skip messages from current user
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
              
              unreadMessagesCount += unread;
            }
          } catch (error) {
            console.warn('Error loading messages for unread count:', error);
          }
        }));
      }

      // Phase 2: Fetch projects count and analytics in parallel
      let activeProjectsCount = 0;
      let profileViewsCount = 0;

      const [projectsCountResult, analyticsResult] = await Promise.all([
        (async () => {
          if (!devhubObj?.data?.content || !('fields' in devhubObj.data.content)) {
            return 0;
          }

          try {
            const devhubFields = (devhubObj.data.content as any).fields;
            if (!devhubFields.projects) return 0;

            let projectsTableId: string | undefined;
            let idValue: any;
            
            if (devhubFields.projects.fields && devhubFields.projects.fields.id) {
              idValue = devhubFields.projects.fields.id;
            } else if (devhubFields.projects.id) {
              idValue = devhubFields.projects.id;
            }

            if (!idValue) return 0;
            if (typeof idValue === 'object' && idValue !== null) {
              if (idValue.id) {
                projectsTableId = String(idValue.id);
              } else if (idValue.objectId) {
                projectsTableId = String(idValue.objectId);
              } else {
                const keys = Object.keys(idValue);
                const possibleId = keys.find(k => 
                  typeof idValue[k] === 'string' && 
                  idValue[k].startsWith('0x')
                );
                if (possibleId) {
                  projectsTableId = String(idValue[possibleId]);
                }
              }
            } else if (typeof idValue === 'string') {
              projectsTableId = idValue;
            }

            if (!projectsTableId) return 0;

            const tableDynamicFields = await suiClient.getDynamicFields({
              parentId: projectsTableId,
              limit: 200
            });

            if (!tableDynamicFields.data || tableDynamicFields.data.length === 0) {
              return 0;
            }

            // Batch fetch dynamic field objects in parallel (limit to 20 for performance)
            const fieldObjects = await Promise.all(
              tableDynamicFields.data.slice(0, 20).map(field =>
                suiClient.getDynamicFieldObject({
                  parentId: projectsTableId,
                  name: field.name
                }).catch(() => null)
              )
            );

            // Count user's projects
            for (const fieldObj of fieldObjects) {
              if (!fieldObj?.data?.content || !('fields' in fieldObj.data.content)) continue;
              
              const type = fieldObj.data.type || '';
              if (!type.includes('Project')) continue;

              const container = fieldObj.data.content as any;
              const valueNode = container.fields?.value ?? container.fields;
              const fields = (valueNode && valueNode.fields) ? valueNode.fields : valueNode;

              if (fields && fields.owner === currentAccount.address) {
                activeProjectsCount++;
              }
            }

            return activeProjectsCount;
          } catch (error) {
            console.error('Error fetching user projects:', error);
            return 0;
          }
        })(),
        (async () => {
          if (cards.length > 0 && cards[0]?.id) {
            try {
              const analytics = await getDetailedAnalytics(cards[0].id);
              return analytics?.totalViews || 0;
            } catch (error) {
              console.error('Error fetching analytics:', error);
              return 0;
            }
          }
          return 0;
        })()
      ]);

      activeProjectsCount = projectsCountResult;
      profileViewsCount = analyticsResult;

      // Update stats immediately
      setStats({
        activeProjects: activeProjectsCount,
        newMessages: unreadMessagesCount,
        profileViews: profileViewsCount,
        profileHealth
      });

      // Phase 3: Fetch transaction history (can be done in parallel with other operations)
      const fetchTransactionHistory = async () => {
        try {
          const result = await suiClient.queryTransactionBlocks({
            filter: {
              FromAddress: currentAccount.address
            },
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
            },
            limit: 10,
            order: 'descending',
          });

          const transactions = result || { data: [] };

          if (transactions.data && transactions.data.length > 0) {

            const txHistory: Array<{
              id: string;
              type: 'sent' | 'received' | 'other';
              amount?: string;
              to?: string;
              from?: string;
              timestamp: string;
              description: string;
            }> = [];

            for (const tx of transactions.data.slice(0, 4)) {
              try {
                const txDetails = tx;
                const digest = tx.digest || tx.transaction?.digest;
                const timestamp = tx.timestampMs ? Number(tx.timestampMs) : Date.now();
                const timestampStr = formatTimestamp(timestamp);

                let txType: 'sent' | 'received' | 'other' = 'other';
                let amount = '';
                let description = 'Transaction';
                let toAddress = '';
                let fromAddress = '';

                if (txDetails.balanceChanges && Array.isArray(txDetails.balanceChanges)) {
                  for (const change of txDetails.balanceChanges) {
                    const ownerInfo = change.owner;
                    let changeAddress: string | undefined;
                    let changeAmount: string | number = '0';

                    if (ownerInfo && typeof ownerInfo === 'object') {
                      if ('AddressOwner' in ownerInfo) {
                        changeAddress = ownerInfo.AddressOwner;
                      } else if ('ObjectOwner' in ownerInfo) {
                        changeAddress = ownerInfo.ObjectOwner;
                      }
                    }

                    if (change.amount !== undefined) {
                      changeAmount = change.amount;
                    } else if (change.amount !== undefined && typeof change.amount === 'object') {
                      changeAmount = String(change.amount);
                    }

                    if (changeAddress) {
                      const amountStr = String(changeAmount);
                      const isNegative = amountStr.startsWith('-') || Number(changeAmount) < 0;
                      const absAmount = Math.abs(Number(changeAmount));

                      if (changeAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
                        if (isNegative && absAmount > 0) {
                          txType = 'sent';
                          amount = (absAmount / 1_000_000_000).toFixed(4);
                          description = `Sent ${amount} SUI`;
                        } else if (absAmount > 0) {
                          txType = 'received';
                          amount = (absAmount / 1_000_000_000).toFixed(4);
                          description = `Received ${amount} SUI`;
                        }
                      } else if (isNegative && absAmount > 0) {
                        toAddress = changeAddress;
                      } else if (absAmount > 0) {
                        fromAddress = changeAddress;
                      }
                    }
                  }
                }

                if (txType === 'other' && txDetails.transaction?.data) {
                  const txData = txDetails.transaction.data;
                  if (txData.kind === 'ProgrammableTransaction') {
                    const calls = txData.transaction?.transactions || [];
                    for (const call of calls) {
                      if (call.kind === 'TransferObjects') {
                        txType = 'sent';
                        description = 'Transfer transaction';
                      }
                    }
                  }
                }

                txHistory.push({
                  id: digest || `tx-${timestamp}`,
                  type: txType,
                  amount: amount || undefined,
                  to: toAddress || undefined,
                  from: fromAddress || undefined,
                  timestamp: timestampStr,
                  description: description
                });
              } catch (txDetailError) {
                console.error(`Error processing transaction ${tx.digest || 'unknown'}:`, txDetailError);
                const timestamp = tx.timestampMs ? Number(tx.timestampMs) : Date.now();
                const digest = tx.digest || tx.transaction?.digest || `tx-${timestamp}`;
                txHistory.push({
                  id: digest,
                  type: 'other',
                  timestamp: formatTimestamp(timestamp),
                  description: 'Transaction'
                });
              }
            }

            setTransactionHistory(txHistory);
          } else {
            setTransactionHistory([]);
          }
        } catch (txError) {
          console.error('❌ Error fetching transactions:', txError);
          setTransactionHistory([]);
        }
      };

      // Start transaction history fetch (non-blocking)
      fetchTransactionHistory();
      
      // Phase 4: Fetch activities (parallelize all event queries)
      const fetchActivities = async () => {
        try {
          const userCardIds = cards.map(card => card.id.toString());
          const eventTypes = [
            `${PACKAGE_ID}::devhub::ReviewAdded`,
            `${PACKAGE_ID}::devhub::ProfileViewed`,
            `${PACKAGE_ID}::devhub::ProjectCreated`,
            `${PACKAGE_ID}::devhub::ApplicationSubmitted`,
            `${PACKAGE_ID}::devhub::ProposalCreated`,
            `${PACKAGE_ID}::devhub::CardUpdated`,
            `${PACKAGE_ID}::connections::ConnectionRequestSent`,
            `${PACKAGE_ID}::connections::ConnectionAccepted`,
          ];

          // Query all events in parallel
          const eventPromises = eventTypes.map(eventType =>
            suiClient.queryEvents({
              query: { MoveEventType: eventType },
              limit: 10,
              order: 'descending',
            }).catch(err => {
              console.error(`Error querying ${eventType}:`, err);
              return { data: [] };
            })
          );

          // Also fetch connection transactions in parallel
          const connectionTxPromise = suiClient.queryTransactionBlocks({
            filter: {
              FromAddress: currentAccount.address,
              MoveFunction: `${PACKAGE_ID}::connections::accept_connection_request`
            },
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
            },
            limit: 5,
            order: 'descending',
          }).catch(() => ({ data: [] }));

          const [eventResults, connectionTxResult] = await Promise.all([
            Promise.all(eventPromises),
            connectionTxPromise
          ]);

          const activityItems: ActivityItem[] = [];

          // Process all events
          eventResults.forEach((events, index) => {
            const eventType = eventTypes[index];
            if (!events.data) return;

            for (const event of events.data) {
              const parsedJson = event.parsedJson as any;
              if (!parsedJson) continue;

              let isUserEvent = false;
              let activityItem: ActivityItem | null = null;

              if (eventType.includes('ConnectionRequestSent')) {
                const to = parsedJson.to || '';
                if (to.toLowerCase() === currentAccount.address.toLowerCase()) {
                  isUserEvent = true;
                  const from = parsedJson.from || 'Someone';
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : Date.now();
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `connection-request-${timestamp}`,
                    type: 'connection',
                    title: 'New connection request',
                    description: `From ${from.slice(0, 8)}...`,
                    timestamp: formatTimestamp(timestamp),
                    status: 'pending'
                  };
                }
              } else if (eventType.includes('ConnectionAccepted')) {
                const user1 = parsedJson.user1 || '';
                const user2 = parsedJson.user2 || '';
                if (user1.toLowerCase() === currentAccount.address.toLowerCase() || 
                    user2.toLowerCase() === currentAccount.address.toLowerCase()) {
                  isUserEvent = true;
                  const otherUser = user1.toLowerCase() === currentAccount.address.toLowerCase() ? user2 : user1;
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : Date.now();
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `connection-accepted-${timestamp}`,
                    type: 'connection',
                    title: 'Connection accepted',
                    description: `Connected with ${otherUser.slice(0, 8)}...`,
                    timestamp: formatTimestamp(timestamp),
                    status: 'success'
                  };
                }
              } else if (eventType.includes('ReviewAdded')) {
                const cardId = parsedJson.card_id?.toString() || parsedJson.cardId?.toString();
                if (userCardIds.includes(cardId)) {
                  isUserEvent = true;
                  const rating = parsedJson.rating || 0;
                  const reviewer = parsedJson.reviewer || 'Someone';
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : 
                                   (parsedJson.timestamp ? Number(parsedJson.timestamp) : Date.now());
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `review-${timestamp}`,
                    type: 'review',
                    title: `You received a ${rating}★ review`,
                    description: `From ${reviewer.slice(0, 8)}...`,
                    timestamp: formatTimestamp(timestamp),
                    status: 'success'
                  };
                }
              } else if (eventType.includes('ProfileViewed')) {
                const cardId = parsedJson.card_id?.toString() || parsedJson.cardId?.toString();
                if (userCardIds.includes(cardId)) {
                  isUserEvent = true;
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : 
                                   (parsedJson.timestamp ? Number(parsedJson.timestamp) : Date.now());
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `view-${timestamp}`,
                    type: 'project',
                    title: 'Your profile was viewed',
                    description: 'Someone viewed your developer profile',
                    timestamp: formatTimestamp(timestamp),
                    status: 'success'
                  };
                }
              } else if (eventType.includes('ProjectCreated')) {
                const owner = parsedJson.owner || '';
                if (owner.toLowerCase() === currentAccount.address.toLowerCase()) {
                  isUserEvent = true;
                  const title = parsedJson.title || 'Untitled Project';
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : 
                                   (parsedJson.timestamp ? Number(parsedJson.timestamp) : Date.now());
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `project-${timestamp}`,
                    type: 'project',
                    title: 'Project created',
                    description: title,
                    timestamp: formatTimestamp(timestamp),
                    status: 'success'
                  };
                }
              } else if (eventType.includes('ApplicationSubmitted')) {
                const applicant = parsedJson.applicant || '';
                if (applicant.toLowerCase() === currentAccount.address.toLowerCase()) {
                  isUserEvent = true;
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : 
                                   (parsedJson.timestamp ? Number(parsedJson.timestamp) : Date.now());
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `application-${timestamp}`,
                    type: 'project',
                    title: 'Application submitted',
                    description: 'You submitted a project application',
                    timestamp: formatTimestamp(timestamp),
                    status: 'pending'
                  };
                }
              } else if (eventType.includes('ProposalCreated')) {
                const owner = parsedJson.owner_address || parsedJson.owner || '';
                if (owner.toLowerCase() === currentAccount.address.toLowerCase()) {
                  isUserEvent = true;
                  const timestamp = event.timestampMs ? Number(event.timestampMs) : 
                                   (parsedJson.timestamp ? Number(parsedJson.timestamp) : Date.now());
                  const eventId = typeof event.id === 'string' ? event.id : (event.id as any)?.txDigest || '';
                  activityItem = {
                    id: eventId || `proposal-${timestamp}`,
                    type: 'project',
                    title: 'Proposal created',
                    description: 'You created a new proposal',
                    timestamp: formatTimestamp(timestamp),
                    status: 'pending'
                  };
                }
              }

              if (isUserEvent && activityItem) {
                activityItems.push(activityItem);
              }
            }
          });

          // Process connection transactions
          const connectionTransactions = connectionTxResult?.data ? { data: connectionTxResult.data } : { data: [] };
          if (connectionTransactions.data && connectionTransactions.data.length > 0) {
            for (const tx of connectionTransactions.data) {
              const timestamp = tx.timestampMs ? Number(tx.timestampMs) : Date.now();
              activityItems.push({
                id: tx.digest || `connection-${timestamp}`,
                type: 'connection',
                title: 'Connection accepted',
                description: 'You accepted a connection request',
                timestamp: formatTimestamp(timestamp),
                status: 'success'
              });
            }
          }

          // Sort by timestamp
          activityItems.sort((a, b) => {
            const getTimeValue = (timeStr: string): number => {
              if (timeStr === 'Just now') return Date.now();
              const match = timeStr.match(/(\d+)([mhd])/);
              if (match) {
                const value = parseInt(match[1]);
                const unit = match[2];
                const now = Date.now();
                if (unit === 'm') return now - value * 60 * 1000;
                if (unit === 'h') return now - value * 60 * 60 * 1000;
                if (unit === 'd') return now - value * 24 * 60 * 60 * 1000;
              }
              return 0;
            };
            return getTimeValue(b.timestamp) - getTimeValue(a.timestamp);
          });
          
          setActivities(activityItems.slice(0, 3));
        } catch (error) {
          console.error('Error fetching activity data:', error);
          setActivities([]);
        }
      };

      // Start activities fetch (non-blocking)
      fetchActivities();
      
      // Phase 5: Load suggested developers (lazy-loaded, non-blocking)
      const fetchSuggestedDevelopers = async () => {
        try {
          const normalizeAddr = (addr: string): string => {
            let s = addr.trim().toLowerCase();
            if (!s.startsWith('0x')) s = `0x${s}`;
            if (s.startsWith('0x0x')) {
              s = s.slice(2);
            }
            if (s.length < 64) {
              s = s.padStart(64, '0');
            } else if (s.length > 64) {
              s = s.slice(-64);
            }
            return `0x${s}`;
          };

          const buildAvatarFor = (displayName: string, addr: string, card?: any): string => {
            if (card?.avatarWalrusBlobId) {
              return `https://aggregator-devnet.walrus.space/v1/${card.avatarWalrusBlobId}`;
            }
            const imageUrl = typeof card?.imageUrl === 'string' && card.imageUrl ? card.imageUrl : '';
            if (imageUrl && imageUrl.startsWith('http')) return imageUrl;
            const nameForAvatar = displayName || `${addr.slice(0, 8)}...`;
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=random&color=fff&size=48`;
          };

          // Parallelize: get cards and connection events
          const [allCards, connectionEvents, requestEvents] = await Promise.all([
            getAllCards().catch(() => []),
            suiClient.queryEvents({
              query: { MoveEventType: `${PACKAGE_ID}::connections::ConnectionAccepted` },
              limit: 100,
              order: 'descending'
            }).catch(() => ({ data: [] })),
            suiClient.queryEvents({
              query: { MoveEventType: `${PACKAGE_ID}::connections::ConnectionRequestSent` },
              limit: 100,
              order: 'descending'
            }).catch(() => ({ data: [] }))
          ]);

          const connectedUsers = new Set<string>();
          for (const event of connectionEvents.data || []) {
            if (event.parsedJson) {
              const { user1, user2 } = event.parsedJson as any;
              if (user1 === currentAccount.address || user2 === currentAccount.address) {
                const connectedUser = user1 === currentAccount.address ? user2 : user1;
                connectedUsers.add(normalizeAddr(connectedUser));
              }
            }
          }

          const usersWithPendingRequests = new Set<string>();
          const usersWithSentRequests = new Set<string>();
          for (const event of requestEvents.data || []) {
            if (event.parsedJson) {
              const { from, to } = event.parsedJson as any;
              if (normalizeAddr(to) === normalizeAddr(currentAccount.address)) {
                usersWithPendingRequests.add(normalizeAddr(from));
              }
              if (normalizeAddr(from) === normalizeAddr(currentAccount.address)) {
                usersWithSentRequests.add(normalizeAddr(to));
              }
            }
          }

          const userSuggestions = allCards
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
            .slice(0, 3)
            .map(card => {
              const cardName = card.name || `${card.owner.slice(0, 8)}...`;
              const avatarUrl = buildAvatarFor(cardName, normalizeAddr(card.owner), card);
              
              let status: 'available' | 'busy' | 'offline' = 'available';
              if (card?.analytics?.totalViews > 100) {
                status = 'busy';
              }
              if (!card?.openToWork) {
                status = 'offline';
              }

              return {
                id: normalizeAddr(card.owner),
                name: cardName,
                avatar: avatarUrl,
                skills: card.technologies || 'Developer',
                status: status,
                verified: card?.verified || false,
                experience: card?.yearsOfExperience || 0,
                views: card?.analytics?.totalViews || 0,
                cardId: typeof card.id === 'number' ? card.id : undefined,
                niche: card.niche || ''
              };
            });

          setSuggestedDevelopers(userSuggestions);
        } catch (error) {
          console.error('Error loading suggested developers:', error);
          setSuggestedDevelopers([]);
        }
      };

      // Start suggested developers fetch (non-blocking)
      fetchSuggestedDevelopers();
      
      // Phase 6: Load open projects (lazy-loaded, non-blocking)
      const fetchOpenProjects = async () => {
        try {
          // Reuse devhubObj if available, otherwise fetch it
          const devhubObjForProjects = devhubObj || await suiClient.getObject({
            id: DEVHUB_OBJECT_ID,
            options: { showContent: true, showType: true, showOwner: true }
          });

          const openProjectsData: OpenProject[] = [];

          if (devhubObjForProjects?.data?.content && 'fields' in devhubObjForProjects.data.content) {
            const devhubFields = (devhubObjForProjects.data.content as any).fields;
            
            if (devhubFields.projects) {
              let projectsTableId: string | undefined;
              let idValue: any;
              
              if (devhubFields.projects.fields && devhubFields.projects.fields.id) {
                idValue = devhubFields.projects.fields.id;
              } else if (devhubFields.projects.id) {
                idValue = devhubFields.projects.id;
              }

            if (idValue) {
              if (typeof idValue === 'object' && idValue !== null) {
                if (idValue.id) {
                  projectsTableId = String(idValue.id);
                } else if (idValue.objectId) {
                  projectsTableId = String(idValue.objectId);
                } else {
                  const keys = Object.keys(idValue);
                  const possibleId = keys.find(k => 
                    typeof idValue[k] === 'string' && 
                    idValue[k].startsWith('0x')
                  );
                  if (possibleId) {
                    projectsTableId = String(idValue[possibleId]);
                  }
                }
              } else if (typeof idValue === 'string') {
                projectsTableId = idValue;
              }
            }

            if (projectsTableId) {
                  const tableDynamicFields = await suiClient.getDynamicFields({
                    parentId: projectsTableId,
                    limit: 50
                  });

                  if (tableDynamicFields.data && tableDynamicFields.data.length > 0) {
                    const projectsFromTable: any[] = [];

                    // Batch fetch dynamic field objects in parallel (limit to 20 for performance)
                    const fieldObjects = await Promise.all(
                      tableDynamicFields.data.slice(0, 20).map(field =>
                        suiClient.getDynamicFieldObject({
                          parentId: projectsTableId,
                          name: field.name
                        }).catch(() => null)
                      )
                    );

                    // Process field objects
                    for (const fieldObj of fieldObjects) {
                      if (!fieldObj?.data?.content || !('fields' in fieldObj.data.content)) continue;
                      
                      const type = fieldObj.data.type || '';
                      if (!type.includes('Project')) continue;

                      const container = fieldObj.data.content as any;
                      const valueNode = container.fields?.value ?? container.fields;
                      const fields = (valueNode && valueNode.fields) ? valueNode.fields : valueNode;

                      if (fields) {
                        const applicationsStatus = fields.applications_status || 'Open';
                        if (applicationsStatus === 'Open') {
                          projectsFromTable.push({ fields, data: fieldObj.data });
                        }
                      }
                    }

                    // Sort projects by trending metrics (views, applications, recency)
                    const sortedProjects = projectsFromTable
                      .map((item) => {
                        const fields = item.fields;
                        if (!fields) return null;

                        const views = Number(fields.views ?? 0);
                        const applications = Number(fields.applications ?? 0);
                        const createdAt = Number(fields.creation_timestamp ?? 0);
                        
                        // Calculate trending score: views * 2 + applications * 3 + recency bonus
                        const daysSinceCreation = createdAt > 0 ? (Date.now() - createdAt) / (1000 * 60 * 60 * 24) : 365;
                        const recencyBonus = Math.max(0, 100 - daysSinceCreation);
                        const trendingScore = (views * 2) + (applications * 3) + recencyBonus;

                        return {
                          item,
                          fields,
                          trendingScore,
                          views,
                          applications,
                          createdAt
                        };
                      })
                      .filter((p): p is NonNullable<typeof p> => p !== null)
                      .sort((a, b) => b.trendingScore - a.trendingScore);

                    // Map top 2 trending projects to OpenProject format
                    for (const projectData of sortedProjects.slice(0, 2)) {
                      if (!projectData) continue;
                      
                      const fields = projectData.fields;
                      const title: string = fields.title || 'Untitled Project';
                      const description: string = fields.short_summary || fields.description || 'No description available';
                      const budgetMin: number = Number(fields.budget_min ?? 0);
                      const budgetMax: number = Number(fields.budget_max ?? 0);
                      
                      let budget = 'TBD';
                      if (budgetMin > 0 || budgetMax > 0) {
                        if (budgetMin === budgetMax) {
                          budget = `$${budgetMin.toLocaleString()}`;
                        } else {
                          budget = `$${budgetMin.toLocaleString()} - $${budgetMax.toLocaleString()}`;
                        }
                      }

                      let requiredSkills: string[] = [];
                      if (Array.isArray(fields.required_skills)) {
                        requiredSkills = fields.required_skills.map((s: any) => String(s));
                      }

                      const objectId = fields.id?.id || projectData.item.data?.objectId || 'unknown';

                      openProjectsData.push({
                        id: objectId,
                        title,
                        description,
                        budget,
                        skills: requiredSkills,
                        status: 'open' as const
                      });
                    }
                  }
                }
              }
            }

          setOpenProjects(openProjectsData);
        } catch (error) {
          console.error('Error fetching open projects:', error);
          setOpenProjects([]);
        }
      };

      // Start open projects fetch (non-blocking)
      fetchOpenProjects();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, getUserCards, suiClient, useConversations, useMessages, loadProfileData]);

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setProfileFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  // Handle image upload to Walrus
  const handleImageUpload = useCallback(async () => {
    if (!imageFile || !currentAccount?.address || !uploadToWalrus) {
      showToast('Please select an image file first', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadToWalrus(imageFile);
      const imageUrl = result.blob.walrusUrl || result.originalUrl || '';
      setProfileFormData(prev => ({ ...prev, imageUrl }));
      setImageFile(null);
      showToast('Image uploaded successfully!', 'success');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showToast(error?.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  }, [imageFile, currentAccount?.address, uploadToWalrus]);

  // Handle save profile
  const handleSaveProfile = useCallback(async () => {
    if (!currentAccount?.address || userCards.length === 0) {
      showToast('No profile found to update', 'error');
      return;
    }

    const card = userCards[0];
    const cardId: number = typeof card.id === 'number' ? card.id : Number(card.id);
    
    if (!Number.isFinite(cardId)) {
      showToast('Invalid profile ID', 'error');
      return;
    }

    // If image file is selected but not uploaded, upload it first
    if (imageFile && !profileFormData.imageUrl) {
      await handleImageUpload();
      // Wait a bit for the upload to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSavingProfile(true);
    try {
      const featuredProjects = card.featuredProjects || [];
      const featuredProjectsJson = featuredProjects.map((p: any) => 
        typeof p === 'string' ? p : JSON.stringify(p)
      );

      const tx = updateCardTransaction(cardId, {
        name: profileFormData.name,
        niche: profileFormData.niche,
        customNiche: profileFormData.customNiche || undefined,
        about: profileFormData.about,
        imageUrl: profileFormData.imageUrl,
        technologies: profileFormData.technologies,
        contact: profileFormData.contact,
        portfolio: profileFormData.portfolio,
        featuredProjects: featuredProjectsJson,
        languages: profileFormData.languages,
        openToWork: profileFormData.openToWork,
        yearsOfExperience: profileFormData.yearsOfExperience,
        workTypes: profileFormData.workTypes,
        hourlyRate: profileFormData.hourlyRate,
        locationPreference: profileFormData.locationPreference,
        availability: profileFormData.availability,
        github: profileFormData.github,
        linkedin: profileFormData.linkedin,
        twitter: profileFormData.twitter,
        personalWebsite: profileFormData.personalWebsite
      });

      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Profile updated successfully:', result);
            showToast('Profile updated successfully!', 'success');
            setShowProfileSettings(false);
            // Reload dashboard data
            setTimeout(() => {
              loadDashboardData();
            }, 2000);
          },
          onError: (error) => {
            console.error('Failed to update profile:', error);
            showToast('Failed to update profile. Please try again.', 'error');
          },
        }
      );
    } catch (error: any) {
      console.error('Error saving profile:', error);
      showToast(error?.message || 'Failed to save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  }, [currentAccount?.address, userCards, profileFormData, imageFile, handleImageUpload, signAndExecute, loadDashboardData]);



  // User not connected state
  if (!currentAccount) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <User className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
          </motion.div>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-sm sm:text-lg text-muted-foreground mb-8">You need to connect your Sui wallet to access your dashboard.</p>
          <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-xl border border-primary/30 max-w-md mx-auto">
            <p className="text-primary">
              Connect your wallet to view and manage your developer card.
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
                  {/* Dashboard Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                      Dashboard
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                      Welcome back. Track your activity, opportunities, and profile health.
                    </p>
                    
                    {/* Refresh Button */}
                    <div className="flex items-center gap-4 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                        {loading ? 'Loading...' : 'Refresh Data'}
                      </motion.button>
                      {userCards.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {userCards.length} developer card{userCards.length !== 1 ? 's' : ''} found
                        </div>
                      )}
                    </div>
                    
                    {/* Search and Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                      <div className="flex-1 max-w-md w-full md:w-auto">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search developers, projects"
                            className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full md:w-auto">
                        {userCards.length === 0 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/create')}
                            className="w-full px-4 sm:px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg text-sm sm:text-base"
                          >
                            Create Profile
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/projects/new')}
                          className="w-full px-4 sm:px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-lg text-sm sm:text-base"
                        >
                          Post a Project
                        </motion.button>
                        {userCards.length > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowProfileSettings(true)}
                            className="w-full px-4 sm:px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base col-span-2 sm:col-span-1"
                          >
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile </span>Settings
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-4 sm:p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-primary/20 to-primary/30 border border-primary/30 text-primary-foreground' 
                          : 'bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 text-primary'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-5 w-5 sm:h-8 sm:w-8 animate-spin" /> : stats.activeProjects}
                      </div>
                      <div className={`font-medium text-xs sm:text-sm ${theme === 'dark' ? 'text-primary-foreground/80' : 'text-primary/80'}`}>Active Projects</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-4 sm:p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/30 text-blue-100' 
                          : 'bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/20 text-blue-600'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-5 w-5 sm:h-8 sm:w-8 animate-spin" /> : stats.newMessages}
                      </div>
                      <div className={`font-medium text-xs sm:text-sm ${theme === 'dark' ? 'text-blue-100/80' : 'text-blue-600/80'}`}>New Messages</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-4 sm:p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-green-500/20 to-green-600/30 border border-green-500/30 text-green-100' 
                          : 'bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/20 text-green-600'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-5 w-5 sm:h-8 sm:w-8 animate-spin" /> : stats.profileViews}
                      </div>
                      <div className={`font-medium text-xs sm:text-sm ${theme === 'dark' ? 'text-green-100/80' : 'text-green-600/80'}`}>Profile Views</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-4 sm:p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/30 border border-orange-500/30 text-orange-100' 
                          : 'bg-gradient-to-br from-orange-500/10 to-orange-600/20 border border-orange-500/20 text-orange-600'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-5 w-5 sm:h-8 sm:w-8 animate-spin" /> : `${stats.profileHealth}%`}
                      </div>
                      <div className={`font-medium text-xs sm:text-sm ${theme === 'dark' ? 'text-orange-100/80' : 'text-orange-600/80'}`}>Profile Health</div>
                    </motion.div>
                  </div>

                  {/* Dashboard Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activity */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-blue-500/50' 
                          : 'hover:border-blue-500/30'
                      }`}
                    >
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    Recent Activity
                  </h3>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                          </div>
                        ) : activities.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm sm:text-base text-muted-foreground">No recent activity</p>
                          </div>
                        ) : (
                          activities.map((activity, index) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              className={`flex items-start gap-3 p-4 rounded-xl border ${
                                activity.type === 'review' ? 'bg-green-500/10 border-green-500/20' :
                                activity.type === 'connection' ? 'bg-blue-500/10 border-blue-500/20' :
                                activity.type === 'payment' ? 'bg-orange-500/10 border-orange-500/20' :
                                'bg-purple-500/10 border-purple-500/20'
                              }`}
                            >
                              {activity.type === 'review' && <Star className="h-5 w-5 text-green-400 mt-1" />}
                              {activity.type === 'connection' && <Zap className="h-5 w-5 text-blue-400 mt-1" />}
                              {activity.type === 'payment' && <Briefcase className="h-5 w-5 text-orange-400 mt-1" />}
                              {activity.type === 'project' && <Briefcase className="h-5 w-5 text-purple-400 mt-1" />}
                              <div className="flex-1">
                                <div className="font-semibold text-foreground">{activity.title}</div>
                                <div className="text-sm text-muted-foreground">{activity.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                                {activity.type === 'connection' && (
                                  <div className="flex gap-2 mt-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                                    >
                                      Ignore
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                      Accept
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                </motion.div>

                    {/* Wallet Overview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-green-500/50' 
                          : 'hover:border-green-500/30'
                      }`}
                    >
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    Wallet Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {loading ? (
                        <Loader2 className="h-5 w-5 sm:h-8 sm:w-8 animate-spin" />
                      ) : (
                        `${walletBalance} SUI`
                      )}
                    </div>
                      <div className="grid grid-cols-2 sm:flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowReceiveModal(true)}
                          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <Download className="h-4 w-4" />
                          Receive
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowSendModal(true)}
                          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <Send className="h-4 w-4" />
                          Send
                        </motion.button>
                      </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Recent Transactions</h4>
                      {loading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : transactionHistory.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No recent transactions</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {transactionHistory.map((tx) => (
                            <motion.div
                              key={tx.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-3 rounded-lg border ${
                                tx.type === 'sent' 
                                  ? 'bg-red-500/10 border-red-500/20' 
                                  : tx.type === 'received'
                                  ? 'bg-green-500/10 border-green-500/20'
                                  : 'bg-muted border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {tx.type === 'sent' && (
                                      <Send className="h-3 w-3 text-red-400 flex-shrink-0" />
                                    )}
                                    {tx.type === 'received' && (
                                      <Download className="h-3 w-3 text-green-400 flex-shrink-0" />
                                    )}
                                    <p className={`text-sm font-medium truncate ${
                                      tx.type === 'sent' ? 'text-red-400' : 
                                      tx.type === 'received' ? 'text-green-400' : 
                                      'text-foreground'
                                    }`}>
                                      {tx.description}
                                    </p>
                                  </div>
                                  {tx.amount && (
                                    <p className={`text-xs ${
                                      tx.type === 'sent' ? 'text-red-300' : 
                                      tx.type === 'received' ? 'text-green-300' : 
                                      'text-muted-foreground'
                                    }`}>
                                      {tx.type === 'sent' ? '-' : '+'}{tx.amount} SUI
                                    </p>
                                  )}
                                  {(tx.to || tx.from) && (
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                      {tx.to ? `To: ${tx.to.slice(0, 8)}...${tx.to.slice(-6)}` : 
                                       tx.from ? `From: ${tx.from.slice(0, 8)}...${tx.from.slice(-6)}` : ''}
                                    </p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                  {tx.timestamp}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                    {/* Suggested Developers */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-purple-500/50' 
                          : 'hover:border-purple-500/30'
                      }`}
                    >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      Suggested Developers
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <Link to="/browse">View All</Link>
                    </motion.button>
                  </div>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                          </div>
                        ) : suggestedDevelopers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm sm:text-base text-muted-foreground">No suggested developers</p>
                          </div>
                        ) : (
                          suggestedDevelopers.map((developer, index) => (
                            <motion.div
                              key={developer.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="flex items-center gap-3 p-4 hover:bg-accent/50 rounded-xl transition-colors border border-border/50"
                            >
                              <div className="relative">
                                {developer.avatar.startsWith('http') ? (
                                  <img
                                    src={developer.avatar}
                                    alt={developer.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                    onError={(e) => {
                                      // Fallback to initial if image fails
                                      const target = e.target as HTMLImageElement;
                                      const firstChar = developer.name.charAt(0).toUpperCase();
                                      target.style.display = 'none';
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold';
                                      fallback.textContent = firstChar;
                                      target.parentElement?.appendChild(fallback);
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {developer.avatar}
                                  </div>
                                )}
                                {developer.verified && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className="font-semibold text-foreground truncate cursor-pointer hover:text-primary"
                                    onClick={() => developer.cardId && navigate(`/card/${developer.cardId}`)}
                                  >
                                    {developer.name}
                                  </div>
                                  {developer.verified && (
                                    <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex-shrink-0">
                                      Verified
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1 truncate">{developer.skills}</div>
                                {developer.niche && (
                                  <div className="text-xs text-muted-foreground mb-1">{developer.niche}</div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {(developer.experience ?? 0) > 0 && (
                                    <span>{developer.experience} years exp</span>
                                  )}
                                  {(developer.views ?? 0) > 0 && (
                                    <span>{developer.views} views</span>
                                  )}
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => developer.cardId && navigate(`/card/${developer.cardId}`)}
                                className={`px-3 py-1 text-white text-sm rounded-lg transition-colors flex-shrink-0 ${
                                  developer.status === 'available' ? 'bg-green-500 hover:bg-green-600' :
                                  developer.status === 'busy' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                  'bg-gray-500 hover:bg-gray-600'
                                }`}
                              >
                                {developer.status === 'available' ? 'Available' :
                                 developer.status === 'busy' ? 'Busy' : 'Offline'}
                              </motion.button>
                            </motion.div>
                          ))
                        )}
                      </div>
                </motion.div>

                    {/* Open Projects */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-orange-500/50' 
                          : 'hover:border-orange-500/30'
                      }`}
                    >
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    Open Projects
                  </h3>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                          </div>
                        ) : openProjects.length === 0 ? (
                          <div className="text-center py-8">
                            <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm sm:text-base text-muted-foreground">No open projects</p>
                          </div>
                        ) : (
                          openProjects.map((project, index) => (
                            <motion.div
                              key={project.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border"
                            >
                              <div className="font-semibold text-foreground mb-2">{project.title}</div>
                              <div className="text-sm text-muted-foreground mb-3">{project.description}</div>
                              {project.budget && (
                                <div className="text-sm text-muted-foreground mb-3">
                                  Budget: {project.budget}
                                </div>
                              )}
                              {project.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {project.skills.map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => navigate(`/projects/${project.id}`)}
                                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                                >
                                  Details
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => navigate(`/projects/${project.id}/apply`)}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                  Apply
                                </motion.button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

      {/* Receive Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receive SUI</DialogTitle>
            <DialogDescription>
              Share this address to receive SUI tokens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all font-mono">
                {currentAccount?.address || 'No address'}
              </code>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyAddress}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Copy address"
              >
                {addressCopied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </motion.button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan QR code or copy the address above to receive SUI
            </p>
          </div>
          <DialogFooter>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReceiveModal(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send SUI</DialogTitle>
            <DialogDescription>
              Transfer SUI tokens to another wallet address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Recipient Address
              </label>
              <input
                type="text"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Amount (SUI)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000000001"
                  min="0"
                  max={walletBalance.replace(/,/g, '')}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSendAmount(walletBalance.replace(/,/g, ''))}
                  className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Max
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: {walletBalance} SUI
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowSendModal(false);
                setSendRecipient('');
                setSendAmount('');
              }}
              disabled={sending}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendSui}
              disabled={sending || !sendRecipient || !sendAmount}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Settings Modal */}
      <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Edit your profile information, professional details, and preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Details
              </h3>
              
              {/* Avatar Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Profile Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Image
                    </label>
                    {imageFile && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload to Walrus
                          </>
                        )}
                      </motion.button>
                    )}
                    <input
                      type="text"
                      value={profileFormData.imageUrl}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Or enter image URL"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Name *</label>
                <input
                  type="text"
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Niche</label>
                <input
                  type="text"
                  value={profileFormData.niche}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, niche: e.target.value }))}
                  placeholder="e.g., Full Stack Developer"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">About / Bio</label>
                <textarea
                  value={profileFormData.about}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, about: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Years of Experience</label>
                <input
                  type="number"
                  value={profileFormData.yearsOfExperience}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max="50"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Professional Details Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Details
              </h3>

              <div>
                <label className="text-sm font-medium mb-2 block">Technologies / Skills</label>
                <input
                  type="text"
                  value={profileFormData.technologies}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, technologies: e.target.value }))}
                  placeholder="e.g., React, TypeScript, Node.js"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Portfolio URL</label>
                <input
                  type="url"
                  value={profileFormData.portfolio}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Contact Email</label>
                <input
                  type="email"
                  value={profileFormData.contact}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Work Preferences Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Work Preferences
              </h3>

              <div>
                <label className="text-sm font-medium mb-2 block">Work Types (comma-separated)</label>
                <input
                  type="text"
                  value={profileFormData.workTypes.join(', ')}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, workTypes: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                  placeholder="e.g., Full-time, Part-time, Contract"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hourly Rate (SUI)</label>
                <input
                  type="number"
                  value={profileFormData.hourlyRate || ''}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, hourlyRate: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location Preference</label>
                <input
                  type="text"
                  value={profileFormData.locationPreference}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, locationPreference: e.target.value }))}
                  placeholder="e.g., Remote, New York, USA"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Availability</label>
                <input
                  type="text"
                  value={profileFormData.availability}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, availability: e.target.value }))}
                  placeholder="e.g., Available immediately, 2 weeks notice"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openToWork"
                  checked={profileFormData.openToWork}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, openToWork: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="openToWork" className="text-sm font-medium">
                  Open to work
                </label>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Social Links
              </h3>

              <div>
                <label className="text-sm font-medium mb-2 block">GitHub</label>
                <input
                  type="url"
                  value={profileFormData.github}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, github: e.target.value }))}
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">LinkedIn</label>
                <input
                  type="url"
                  value={profileFormData.linkedin}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Twitter</label>
                <input
                  type="url"
                  value={profileFormData.twitter}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="https://twitter.com/username"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Personal Website</label>
                <input
                  type="url"
                  value={profileFormData.personalWebsite}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, personalWebsite: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowProfileSettings(false);
                // Reload profile data when closing
                if (userCards.length > 0) {
                  loadProfileData(userCards[0]);
                }
              }}
              disabled={savingProfile}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              disabled={savingProfile || !profileFormData.name}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;