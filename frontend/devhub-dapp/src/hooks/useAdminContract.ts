import { useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { suiClient } from '../lib/suiClient';

// Contract addresses - replace with your deployed contract addresses
const ADMIN_MODULE_ADDRESS = import.meta.env.NEXT_PUBLIC_ADMIN_MODULE_ADDRESS || '';
const DEVHUB_MODULE_ADDRESS = import.meta.env.NEXT_PUBLIC_DEVHUB_MODULE_ADDRESS || '';
const DEVHUB_OBJECT_ID = import.meta.env.NEXT_PUBLIC_DEVHUB_OBJECT_ID || '';
const PLATFORM_STATS_OBJECT_ID = import.meta.env.NEXT_PUBLIC_PLATFORM_STATS_OBJECT_ID || '';

interface PlatformStats {
  totalCards: number;
  totalUsers: number;
  totalFeesCollected: number;
  activeCards: number;
  lastUpdated: number;
}

interface AdminAction {
  actionType: string;
  admin: string;
  amount?: number;
  timestamp: number;
  details: string;
}

export const useAdminContract = () => {
  const currentAccount = useCurrentAccount();

  // Check if current user is admin
  const isAdmin = useCallback(async (address: string): Promise<boolean> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${ADMIN_MODULE_ADDRESS}::admin::is_platform_admin`,
        arguments: [tx.pure.address(address)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: await tx.build({ client: suiClient }),
        sender: address,
      });

      const value = result.results?.[0]?.returnValues?.[0]?.[0];
      return Number(value) === 1;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, []);

  // Get platform statistics
  const getPlatformStats = useCallback(async (): Promise<PlatformStats> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${ADMIN_MODULE_ADDRESS}::admin::get_platform_stats`,
        arguments: [tx.object(PLATFORM_STATS_OBJECT_ID)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: await tx.build({ client: suiClient }),
        sender: currentAccount?.address || '',
      });

      const returnValues = result.results?.[0]?.returnValues || [];
      
      return {
        totalCards: parseInt(returnValues[0]?.[0]?.toString() || '0'),
        totalUsers: parseInt(returnValues[1]?.[0]?.toString() || '0'),
        totalFeesCollected: parseInt(returnValues[2]?.[0]?.toString() || '0'),
        activeCards: parseInt(returnValues[3]?.[0]?.toString() || '0'),
        lastUpdated: parseInt(returnValues[4]?.[0]?.toString() || '0'),
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        totalCards: 0,
        totalUsers: 0,
        totalFeesCollected: 0,
        activeCards: 0,
        lastUpdated: 0,
      };
    }
  }, [currentAccount]);

  // Get platform fee balance from DevHub
  const getPlatformFeeBalance = useCallback(async (): Promise<number> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${DEVHUB_MODULE_ADDRESS}::devcard::get_platform_fee_balance`,
        arguments: [tx.object(DEVHUB_OBJECT_ID)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: await tx.build({ client: suiClient }),
        sender: currentAccount?.address || '',
      });

      const value = result.results?.[0]?.returnValues?.[0]?.[0];
      return parseInt(
        Array.isArray(value) ? value.toString() : value ?? '0'
      );
    } catch (error) {
      console.error('Error fetching platform fee balance:', error);
      return 0;
    }
  }, [currentAccount]);

  // Get total card count
  const getCardCount = useCallback(async (): Promise<number> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${DEVHUB_MODULE_ADDRESS}::devcard::get_card_count`,
        arguments: [tx.object(DEVHUB_OBJECT_ID)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: await tx.build({ client: suiClient }),
        sender: currentAccount?.address || '',
      });

      const cardCountValue = result.results?.[0]?.returnValues?.[0]?.[0] as unknown;
      return parseInt(
        cardCountValue !== undefined
          ? (Array.isArray(cardCountValue) ? cardCountValue.toString() : String(cardCountValue))
          : '0'
      );
    } catch (error) {
      console.error('Error fetching card count:', error);
      return 0;
    }
  }, [currentAccount]);

  // Get platform fee rate
  const getPlatformFeeRate = useCallback(async (): Promise<number> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${ADMIN_MODULE_ADDRESS}::admin::get_platform_fee_rate`,
        arguments: [],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: await tx.build({ client: suiClient }),
        sender: currentAccount?.address || '',
      });

      const feeRateValue = result.results?.[0]?.returnValues?.[0]?.[0];
      return parseInt(
        feeRateValue !== undefined
          ? (Array.isArray(feeRateValue) ? feeRateValue.toString() : String(feeRateValue))
          : '0'
      );
    } catch (error) {
      console.error('Error fetching platform fee rate:', error);
      return 100_000_000; // Default 0.1 SUI
    }
  }, [currentAccount]);

  // Create transaction to withdraw platform fees
  const createWithdrawFeesTransaction = useCallback((
    adminCapId: string,
    recipient: string,
    amount: number
  ): Transaction => {
    const tx = new Transaction();
    
    // Get clock object
    tx.moveCall({
      target: `0x6::clock::create_for_testing`,
      arguments: [tx.pure.u64(Date.now())],
    });

    tx.moveCall({
      target: `${ADMIN_MODULE_ADDRESS}::admin::withdraw_platform_fees`,
      arguments: [
        tx.object(adminCapId),
        tx.object(DEVHUB_OBJECT_ID),
        tx.pure.address(recipient),
        tx.pure.u64(amount),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }, []);

  // Create transaction to withdraw all platform fees
  const createWithdrawAllFeesTransaction = useCallback((
    adminCapId: string
  ): Transaction => {
    const tx = new Transaction();
    
    // Get clock object
    tx.moveCall({
      target: `0x6::clock::create_for_testing`,
      arguments: [tx.pure.u64(Date.now())],
    });

    tx.moveCall({
      target: `${ADMIN_MODULE_ADDRESS}::admin::withdraw_all_platform_fees`,
      arguments: [
        tx.object(adminCapId),
        tx.object(DEVHUB_OBJECT_ID),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }, []);

  // Create transaction to update platform statistics
  const createUpdateStatsTransaction = useCallback((
    adminCapId: string
  ): Transaction => {
    const tx = new Transaction();
    
    // Get clock object
    tx.moveCall({
      target: `0x6::clock::create_for_testing`,
      arguments: [tx.pure.u64(Date.now())],
    });

    tx.moveCall({
      target: `${ADMIN_MODULE_ADDRESS}::admin::update_platform_stats`,
      arguments: [
        tx.object(adminCapId),
        tx.object(PLATFORM_STATS_OBJECT_ID),
        tx.object(DEVHUB_OBJECT_ID),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }, []);

  // Create transaction to transfer admin capabilities
  const createTransferAdminTransaction = useCallback((
    adminCapId: string,
    newAdminAddress: string
  ): Transaction => {
    const tx = new Transaction();
    
    // Get clock object
    tx.moveCall({
      target: `0x6::clock::create_for_testing`,
      arguments: [tx.pure.u64(Date.now())],
    });

    tx.moveCall({
      target: `${ADMIN_MODULE_ADDRESS}::admin::transfer_admin_cap`,
      arguments: [
        tx.object(adminCapId),
        tx.pure.address(newAdminAddress),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }, []);

  // Create transaction for batch operations
  const createBatchUpdateAndWithdrawTransaction = useCallback((
    adminCapId: string,
    withdrawalAmount: number,
    recipient: string
  ): Transaction => {
    const tx = new Transaction();
    
    // Get clock object
    tx.moveCall({
      target: `0x6::clock::create_for_testing`,
      arguments: [tx.pure.u64(Date.now())],
    });

    tx.moveCall({
      target: `${ADMIN_MODULE_ADDRESS}::admin::batch_update_stats_and_withdraw`,
      arguments: [
        tx.object(adminCapId),
        tx.object(PLATFORM_STATS_OBJECT_ID),
        tx.object(DEVHUB_OBJECT_ID),
        tx.pure.u64(withdrawalAmount),
        tx.pure.address(recipient),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }, []);

  // Get admin actions history
  const getAdminActionsHistory = useCallback(async (limit: number = 10): Promise<AdminAction[]> => {
    try {
      // Query events from the admin module
      const events = await suiClient.queryEvents({
        query: {
          MoveModule: {
            package: ADMIN_MODULE_ADDRESS,
            module: 'admin',
          },
        },
        limit,
        order: 'descending',
      });

      return events.data
        .filter(event => event.type.includes('AdminActionLogged'))
        .map(event => {
          const parsed = event.parsedJson as {
            action_type?: string;
            admin?: string;
            amount?: number;
            timestamp?: string;
            details?: string;
          } || {};
          return {
            actionType: parsed.action_type || '',
            admin: parsed.admin || '',
            amount: parsed.amount || undefined,
            timestamp: parseInt(parsed.timestamp || '0'),
            details: parsed.details || '',
          };
        });
    } catch (error) {
      console.error('Error fetching admin actions history:', error);
      return [];
    }
  }, []);

  // Get system health status
  const getSystemHealth = useCallback(async () => {
    try {
      const [stats, feeBalance] = await Promise.all([
        getPlatformStats(),
        getPlatformFeeBalance(),
      ]);

      return {
        platformStatus: 'online',
        blockchainConnection: 'connected',
        network: 'Sui Testnet',
        totalCards: stats.totalCards,
        platformFees: feeBalance / 1_000_000_000, // Convert from MIST to SUI
        lastUpdated: stats.lastUpdated,
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        platformStatus: 'offline',
        blockchainConnection: 'disconnected',
        network: 'Unknown',
        totalCards: 0,
        platformFees: 0,
        lastUpdated: 0,
      };
    }
  }, [getPlatformStats, getPlatformFeeBalance]);

  return {
    // View functions
    isAdmin,
    getPlatformStats,
    getPlatformFeeBalance,
    getCardCount,
    getPlatformFeeRate,
    getAdminActionsHistory,
    getSystemHealth,
    
    // Transaction creators
    createWithdrawFeesTransaction,
    createWithdrawAllFeesTransaction,
    createUpdateStatsTransaction,
    createTransferAdminTransaction,
    createBatchUpdateAndWithdrawTransaction,
    
    // Constants
    ADMIN_MODULE_ADDRESS,
    DEVHUB_MODULE_ADDRESS,
    DEVHUB_OBJECT_ID,
    PLATFORM_STATS_OBJECT_ID,
  };
};