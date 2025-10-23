import React from 'react';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

interface RemoveAdminDialogProps {
  isOpen: boolean;
  adminToRemove: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const RemoveAdminDialog: React.FC<RemoveAdminDialogProps> = ({
  isOpen,
  adminToRemove,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/95 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl max-w-md w-full mx-4"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            Remove Admin
          </h3>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Are you sure you want to remove this admin? This action cannot be undone.
        </p>
        
        {adminToRemove && (
          <div className="bg-background/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Admin Address:</p>
            <p className="font-mono text-sm break-all">{adminToRemove}</p>
          </div>
        )}
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Remove Admin
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RemoveAdminDialog;
