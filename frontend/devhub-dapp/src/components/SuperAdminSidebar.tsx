import React from 'react';
import { Shield, BarChart3, Users, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export type SuperAdminTab = 'overview' | 'admins' | 'fees' | 'activity';

interface SuperAdminSidebarProps {
  activeTab: SuperAdminTab;
  onTabChange: (tab: SuperAdminTab) => void;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { 
      id: 'overview' as const,
      icon: BarChart3, 
      label: 'Overview', 
      description: 'Platform statistics and quick actions'
    },
    { 
      id: 'admins' as const,
      icon: Users, 
      label: 'Admins', 
      description: 'Manage administrators and roles'
    },
    { 
      id: 'fees' as const,
      icon: DollarSign, 
      label: 'Fees', 
      description: 'Withdraw and manage platform revenue'
    },
    { 
      id: 'activity' as const,
      icon: Activity, 
      label: 'Activity Log', 
      description: 'Audit log of admin actions'
    },
  ];

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-1"
    >
      <div 
        className="sticky top-24 bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border shadow-2xl shadow-primary/5 max-h-[calc(100vh-8rem)] overflow-y-auto sidebar-scrollable"
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-primary h-8 w-8" />
            <h2 className="text-2xl font-bold text-foreground">Super Admin</h2>
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
              </motion.button>
            ))}
          </nav>
        </div>
      </div>
    </motion.aside>
  );
};

export default SuperAdminSidebar;