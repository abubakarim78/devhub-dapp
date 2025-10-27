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
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ className }) => {
  const location = useLocation();

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <div className="sticky top-24 bg-secondary/50 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="text-primary h-8 w-8" />
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
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
              >
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 group ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block">{item.label}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground/70">
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
