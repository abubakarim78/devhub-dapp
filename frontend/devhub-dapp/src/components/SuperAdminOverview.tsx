import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Activity } from 'lucide-react';

interface SuperAdminOverviewProps {
  platformStats: {
    totalDevelopers: number;
    activeDevelopers: number;
    verifiedDevelopers: number;
    openProjects: number;
  };
  platformFeeBalance: number;
  totalCards: number;
  getDisplayAdmins: () => Array<{
    address: string;
    role: string;
    status: string;
    notes: string;
  }>;
  onNavigateToAdmins: () => void;
  onNavigateToFees: () => void;
}

const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({
  platformStats,
  platformFeeBalance,
  totalCards,
  getDisplayAdmins,
  onNavigateToAdmins,
  onNavigateToFees,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
          Super Admin Dashboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Grant or revoke admin roles, manage platform fees, and
          track admin activity.
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-blue-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Admins
              </p>
              <p className="text-3xl font-bold text-foreground">
                {getDisplayAdmins().length}
              </p>
              <p className="text-xs text-muted-foreground">
                Active on-chain
              </p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-green-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Accrued Platform Fees
              </p>
              <p className="text-3xl font-bold text-foreground">
                {(platformFeeBalance / 1_000_000_000).toFixed(2)} SUI
              </p>
              <p className="text-xs text-muted-foreground">
                Unwithdrawn balance
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-purple-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Cards
              </p>
              <p className="text-3xl font-bold text-foreground">
                {totalCards.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                All developer cards
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-orange-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Open Projects
              </p>
              <p className="text-3xl font-bold text-foreground">
                {platformStats.openProjects}
              </p>
              <p className="text-xs text-muted-foreground">
                Available for applications
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToAdmins}
          className="p-6 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-2xl text-left hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Admin Management
            </h3>
          </div>
          <p className="text-muted-foreground">
            View, search, and manage all admin accounts and roles.
          </p>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToFees}
          className="p-6 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-2xl text-left hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Platform Fees
            </h3>
          </div>
          <p className="text-muted-foreground">
            Manage and withdraw collected platform fees.
          </p>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SuperAdminOverview;
