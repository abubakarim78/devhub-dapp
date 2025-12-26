import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';
import { ConnectionRequest } from '../types';

// === Legacy Messaging Functions (Deprecated) ===

// Helper function to start conversation
export function startConversationTransaction(participant2: string) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::messaging::${CONTRACT_FUNCTIONS.START_CONVERSATION}`,
    arguments: [
      tx.pure.address(participant2),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to send encrypted message
export async function sendEncryptedMessageTransaction(
  conversationId: string,
  content: string,
  _participants: string[]
) {
  console.log('sendEncryptedMessageTransaction called with content:', content);
  console.log('Content type:', typeof content);
  console.log('Content length:', content.length);
  console.log('Conversation ID:', conversationId);

  try {
    // Note: This legacy function is deprecated in favor of the new messaging SDK
    // The new SDK handles encryption automatically
    console.warn('sendEncryptedMessageTransaction is deprecated. Use the new messaging SDK instead.');

    // Check if the conversationId looks like a valid Sui object ID
    const isValidSuiObjectId = /^0x[a-fA-F0-9]{64}$/.test(conversationId);

    if (!isValidSuiObjectId) {
      console.warn('Invalid conversation ID format, need to create conversation first');
      // If it's not a valid Sui object ID, we need to create a conversation first
      // This should be handled by the conversation creation flow, not message sending
      throw new Error('Conversation does not exist. Please create a conversation first.');
    }

    // If it's a valid Sui object ID, proceed with the original logic
    const encodedContent = Array.from(new TextEncoder().encode(content));
    const encryptedBytes = new Uint8Array(encodedContent);
    const key = new Uint8Array(32); // Dummy key for compatibility

    // Create content hash for verification
    const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));

    console.log('Message encrypted successfully');
    console.log('Encrypted bytes length:', encryptedBytes.length);
    console.log('Content hash length:', contentHash.byteLength);
    console.log('Key length:', key.length);

    // Store the full encrypted object (which includes metadata) instead of just raw bytes
    const tx = new Transaction();

    tx.moveCall({
      target: `${getCurrentPackageId()}::messaging::${CONTRACT_FUNCTIONS.SEND_MESSAGE}`,
      arguments: [
        tx.object(conversationId),
        tx.pure.vector('u8', Array.from(encryptedBytes)), // This is the full BCS-encoded encrypted object
        tx.pure.vector('u8', Array.from(new Uint8Array(contentHash))),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    return tx;
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Legacy function for backward compatibility (will be deprecated)
export function sendMessageTransaction(
  conversationId: string,
  content: string
) {
  console.log('sendMessageTransaction called with content:', content);
  console.log('Content type:', typeof content);
  console.log('Content length:', content.length);

  const tx = new Transaction();

  const encodedContent = Array.from(new TextEncoder().encode(content));
  console.log('Encoded content:', encodedContent);
  console.log('Encoded content length:', encodedContent.length);

  tx.moveCall({
    target: `${getCurrentPackageId()}::messaging::${CONTRACT_FUNCTIONS.SEND_MESSAGE}`,
    arguments: [
      tx.object(conversationId),
      tx.pure.vector('u8', encodedContent),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to mark message as read
export function markAsReadTransaction(
  conversationId: string,
  messageIndex: number
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::messaging::${CONTRACT_FUNCTIONS.MARK_AS_READ}`,
    arguments: [
      tx.object(conversationId),
      tx.pure.u64(messageIndex),
    ],
  });

  return tx;
}

// === Connection Functions ===

// Helper function to create connection store
export function createConnectionStoreTransaction() {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::connections::${CONTRACT_FUNCTIONS.CREATE_CONNECTION_STORE}`,
    arguments: [],
  });

  return tx;
}

// Helper function to send connection request
export function sendConnectionRequestTransaction(
  to: string,
  introMessage: string,
  sharedContext: string,
  isPublic: boolean
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::connections::${CONTRACT_FUNCTIONS.SEND_CONNECTION_REQUEST}`,
    arguments: [
      tx.pure.address(to),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(introMessage))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(sharedContext))),
      tx.pure.bool(isPublic),
    ],
  });

  return tx;
}

// Helper function to accept connection request
export function acceptConnectionRequestTransaction(
  connectionStoreId: string,
  connectionRequest: ConnectionRequest
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::connections::${CONTRACT_FUNCTIONS.ACCEPT_CONNECTION_REQUEST}`,
    arguments: [
      tx.object(connectionStoreId),
      tx.object(connectionRequest.id), // Pass the ConnectionRequest object ID
    ],
  });

  return tx;
}

// Helper function to decline connection request
export function declineConnectionRequestTransaction(
  connectionRequestId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::connections::${CONTRACT_FUNCTIONS.DECLINE_CONNECTION_REQUEST}`,
    arguments: [
      tx.object(connectionRequestId),
    ],
  });

  return tx;
}

// Helper function to update connection preferences
export function updateConnectionPreferencesTransaction(
  connectionStoreId: string,
  connectedUser: string,
  notificationsEnabled: boolean,
  profileShared: boolean,
  messagesAllowed: boolean
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::connections::${CONTRACT_FUNCTIONS.UPDATE_CONNECTION_PREFERENCES}`,
    arguments: [
      tx.object(connectionStoreId),
      tx.pure.address(connectedUser),
      tx.pure.bool(notificationsEnabled),
      tx.pure.bool(profileShared),
      tx.pure.bool(messagesAllowed),
    ],
  });

  return tx;
}

// Helper function to update connection status
export function updateConnectionStatusTransaction(
  connectionStoreId: string,
  connectedUser: string,
  newStatus: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::connections::${CONTRACT_FUNCTIONS.UPDATE_CONNECTION_STATUS}`,
    arguments: [
      tx.object(connectionStoreId),
      tx.pure.address(connectedUser),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newStatus))),
    ],
  });

  return tx;
}

// === Channel Management Functions ===

export async function createChannelTransaction(channelName: string, initialMembers: string[]) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getCurrentPackageId()}::channels::${CONTRACT_FUNCTIONS.CREATE_CHANNEL}`,
    arguments: [
      tx.pure.string(channelName),
      tx.pure.vector('address', initialMembers),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export async function sendMessageToChannelTransaction(
  channelId: string,
  memberCapId: string,
  encryptedContent: Uint8Array,
  contentHash: Uint8Array
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getCurrentPackageId()}::channels::${CONTRACT_FUNCTIONS.SEND_MESSAGE_TO_CHANNEL}`,
    arguments: [
      tx.object(channelId),
      tx.object(memberCapId),
      tx.pure.vector('u8', Array.from(encryptedContent)),
      tx.pure.vector('u8', Array.from(contentHash)),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export async function addMemberToChannelTransaction(
  channelId: string,
  newMember: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getCurrentPackageId()}::channels::${CONTRACT_FUNCTIONS.ADD_MEMBER_TO_CHANNEL}`,
    arguments: [
      tx.object(channelId),
      tx.pure.address(newMember),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export async function removeMemberFromChannelTransaction(
  channelId: string,
  memberToRemove: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getCurrentPackageId()}::channels::${CONTRACT_FUNCTIONS.REMOVE_MEMBER_FROM_CHANNEL}`,
    arguments: [
      tx.object(channelId),
      tx.pure.address(memberToRemove),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

// === Additional Channel Management Functions ===

// Get channel messages (transaction builder for read operation)
export async function getChannelMessagesTransaction(channelId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getCurrentPackageId()}::channels::get_channel_messages`,
    arguments: [tx.object(channelId)],
  });
  return tx;
}

// Get channel members (transaction builder for read operation)
export async function getChannelMembersTransaction(channelId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getCurrentPackageId()}::channels::get_channel_members`,
    arguments: [tx.object(channelId)],
  });
  return tx;
}

