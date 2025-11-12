import React from 'react';
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
      <div className="lg:sticky lg:top-24 bg-secondary/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border shadow-2xl shadow-primary/5">
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
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors duration-200 group ${
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
