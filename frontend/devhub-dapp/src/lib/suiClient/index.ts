// Main index file that re-exports all modules for backward compatibility
// This allows the original suiClient.ts API to remain unchanged

// Export constants and configuration
export * from './constants';

// Export types
export * from './types';

// Export utility functions
export * from './utils';

// Export transaction builders
export * from './transactions/cardTransactions';
export * from './transactions/projectTransactions';
export * from './transactions/proposalTransactions';
export * from './transactions/adminTransactions';
export * from './transactions/messagingTransactions';
export * from './transactions/helperTransactions';

// Export read functions
export * from './read/cardRead';
export * from './read/projectRead';
export * from './read/proposalRead';
export * from './read/search';
export * from './read/messagingRead';
export * from './read/adminRead';
export * from './read/platformStats';

// Export messaging SDK wrapper functions
export * from './messaging/messagingSDK';

// Export upgrade utilities
export * from './upgrade';

// Export cache utilities
export * from './clearCache';

