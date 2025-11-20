import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Settings, 
  Send, 
  RotateCcw, 
  Check, 
  Loader2, 
  BarChart3 
} from 'lucide-react';

interface SuperAdminFeesProps {
  // Platform fee balance
  platformFeeBalance: number;
  
  // Fee configuration
  currentTradingFee: number;
  currentListingFee: number;
  newTradingFee: string;
  setNewTradingFee: (fee: string) => void;
  newListingFee: string;
  setNewListingFee: (fee: string) => void;
  updatingFees: boolean;
  handleUpdateFees: () => void;
  handleResetFees: () => void;
  
  // Withdrawal
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  withdrawRecipient: string;
  setWithdrawRecipient: (recipient: string) => void;
  withdrawingFees: boolean;
  handleWithdrawFees: () => void;
  handleMaxWithdraw: () => void;
  
  // Refresh function
  onRefreshBalance?: () => void;
}

const SuperAdminFees: React.FC<SuperAdminFeesProps> = ({
  platformFeeBalance,
  currentTradingFee,
  currentListingFee,
  newTradingFee,
  setNewTradingFee,
  newListingFee,
  setNewListingFee,
  updatingFees,
  handleUpdateFees,
  handleResetFees,
  withdrawAmount,
  setWithdrawAmount,
  withdrawRecipient,
  setWithdrawRecipient,
  withdrawingFees,
  handleWithdrawFees,
  handleMaxWithdraw,
  onRefreshBalance,
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
          Platform Fees
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage and withdraw collected platform fees.
        </p>
      </div>

      {/* Platform Fee Balance */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Platform Fee Balance
            </h2>
          </div>
          {onRefreshBalance && (
            <button
              onClick={onRefreshBalance}
              className="flex items-center space-x-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors duration-200"
              title="Refresh balance"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between bg-background p-4 rounded-lg border border-border">
          <p className="text-lg font-medium text-foreground">
            Current Platform Fee Balance:
          </p>
          <p className="text-2xl font-bold text-primary">
            {(platformFeeBalance / 1_000_000_000).toFixed(2)} SUI
          </p>
        </div>
      </div>

      {/* Fee Configuration and Withdrawal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Fees Configuration */}
        <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Settings className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Platform Fees
              </h3>
              <p className="text-sm text-muted-foreground">
                Change or update fee configuration
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Current Platform Fee
                </p>
                <p className="text-lg font-bold text-foreground">
                  {typeof currentTradingFee === 'number' ? currentTradingFee.toFixed(2) : currentTradingFee} SUI
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Project Posting Fee
                </p>
                <p className="text-lg font-bold text-foreground">
                  {typeof currentListingFee === 'number' ? currentListingFee.toFixed(2) : currentListingFee} SUI
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Platform Fee (SUI)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTradingFee}
                  onChange={(e) => setNewTradingFee(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="0.10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Project Posting Fee (SUI)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newListingFee}
                  onChange={(e) => setNewListingFee(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="0.20"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetFees}
                className="flex-1 px-4 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Reset</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdateFees}
                disabled={updatingFees}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {updatingFees ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                <span>
                  {updatingFees ? "Updating..." : "Update Fees"}
                </span>
              </motion.button>
            </div>

            <p className="text-xs text-muted-foreground">
              Fee updates are timelocked for 10 minutes before
              activation.
            </p>
          </div>
        </div>

        {/* Withdraw Platform Fees */}
        <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Send className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Withdraw Platform Fees
              </h3>
              <p className="text-sm text-muted-foreground">
                Move accrued fees to treasury
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Available Balance
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(platformFeeBalance / 1_000_000_000).toFixed(2)}{" "}
                SUI
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Destination (Treasury) Address
              </label>
              <input
                type="text"
                value={withdrawRecipient}
                onChange={(e) =>
                  setWithdrawRecipient(e.target.value)
                }
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground font-mono text-sm"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount (SUI)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) =>
                    setWithdrawAmount(e.target.value)
                  }
                  className="flex-1 px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="Enter amount"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMaxWithdraw}
                  className="px-4 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all duration-200 flex items-center space-x-2"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Max</span>
                </motion.button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWithdrawFees}
              disabled={
                withdrawingFees ||
                !withdrawAmount ||
                !withdrawRecipient
              }
              className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {withdrawingFees ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>
                {withdrawingFees ? "Withdrawing..." : "Withdraw"}
              </span>
            </motion.button>

            <p className="text-xs text-muted-foreground">
              Withdrawing fees requires one transaction.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminFees;
