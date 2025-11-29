import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  MessageSquare, 
  Users, 
  FileText, 
  FolderOpen, 
  Settings,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useContract } from '@/hooks/useContract';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'View your profile analytics and stats'
  },
  {
    id: 'profile',
    label: 'My Profile',
    href: '/dashboard-profile',
    icon: User,
    description: 'Manage your developer profile'
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/dashboard-messages',
    icon: MessageSquare,
    description: 'View and respond to your messages'
  },
  {
    id: 'channels',
    label: 'Channels',
    href: '/dashboard-channels',
    icon: Hash,
    description: 'Manage group channels and team communication'
  },
  {
    id: 'connections',
    label: 'Connections',
    href: '/dashboard-connections',
    icon: Users,
    description: 'Manage your connections'
  },
  {
    id: 'proposals',
    label: 'Proposals',
    href: '/dashboard-proposals',
    icon: FileText,
    description: 'View and manage your proposals'
  },
  {
    id: 'projects', 
    label: 'Projects',
    href: '/dashboard-projects',
    icon: FolderOpen,
    description: 'Track your projects and your work'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard-settings',
    icon: Settings,
    description: 'Account and preference settings'
  },
];

interface DashboardSidebarProps {
  className?: string;
  /**
   * Callback when a navigation item is clicked (used to close mobile sidebar)
   */
  onNavigate?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ className, onNavigate }) => {
  const location = useLocation();
  const currentAccount = useCurrentAccount();
  const { useConversations, useMessages } = useContract();
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to calculate unread message count
  const calculateUnreadCount = useCallback(async () => {
    if (!currentAccount?.address) {
      setUnreadCount(0);
      return;
    }

    try {
      const conversations = await useConversations(currentAccount.address, true);
      
      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Load messages for each conversation and calculate unread count
      let totalUnread = 0;
      
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
            
            totalUnread += unread;
          }
        } catch (error) {
          console.warn('Error loading messages for unread count:', error);
        }
      }));
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error calculating unread count:', error);
      setUnreadCount(0);
    }
  }, [currentAccount?.address, useConversations, useMessages]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (currentAccount?.address) {
      calculateUnreadCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        calculateUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [currentAccount?.address, calculateUnreadCount]);

  // Refresh count when navigating to messages page (user might have read messages)
  useEffect(() => {
    if (location.pathname === '/dashboard-messages') {
      // Delay slightly to allow messages to be marked as read
      setTimeout(() => {
        calculateUnreadCount();
      }, 1000);
    }
  }, [location.pathname, calculateUnreadCount]);

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <div className="lg:sticky lg:top-0 lg:w-[320px] xl:w-[280px] max-lg:w-full bg-secondary/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border shadow-2xl shadow-primary/5 lg:overflow-visible lg:z-30">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
          <LayoutDashboard className="text-primary h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Dashboard</h2>
        </div>
        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div
                key={index}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="lg:block"
              >
                <Link
                  to={item.href}
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors duration-200 group relative ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block text-sm sm:text-base">{item.label}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground/70 hidden sm:block">
                      {item.description}
                    </span>
                  </div>
                  {item.id === 'messages' && unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
