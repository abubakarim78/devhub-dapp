
import React from 'react';
import { LayoutDashboard, Users, Activity, Eye, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export type AdminTab = 'overview' | 'admins' | 'activity';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'overview' as const,
      icon: LayoutDashboard,
      label: 'Overview',
      description: 'Platform statistics and analytics'
    },
    {
      id: 'admins' as const,
      icon: Users,
      label: 'Admin Directory',
      description: 'View administrator information'
    },
    {
      id: 'activity' as const,
      icon: Activity,
      label: 'Activity Log',
      description: 'Audit log of platform activities'
    },
  ];

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-1"
    >
      <div className="sticky top-24 bg-secondary/50 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-primary h-8 w-8" />
          <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
        </div>
        <nav className="space-y-2">
          {navItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 group ${
                activeTab === item.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="h-5 w-5" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block">{item.label}</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70">
                  {item.description}
                </span>
              </div>
              {item.id === 'admins' || item.id === 'activity' ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : null}
            </motion.button>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
