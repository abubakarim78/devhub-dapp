import { useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import {
  PACKAGE_ID,
  Conversation,
  Connection,
  Message,
  createMessagingChannel,
  getUserMemberships,
  getChannelObjects,
  sendMessage,
  getChannelMessages,
  createChannelTransaction,
  sendMessageToChannelTransaction,
  addMemberToChannelTransaction,
  removeMemberFromChannelTransaction,
  getChannelMessagesTransaction,
  getChannelMembersTransaction,
  getUserChannelMemberships,
  getChannelDetails,
  getChannelMessagesFromObject,
} from "../lib/suiClient";
import type { ContractCacheRef } from "./useContractCache";
import { isCacheValid, setCacheEntry } from "./useContractUtils";

export const useContractMessaging = (
  cacheRef: React.MutableRefObject<ContractCacheRef>,
) => {
  const client = useSuiClient();

  const getConversationMessages = useCallback(
    async (conversationId: string, participants?: string[]): Promise<Message[]> => {
      try {
        console.log('Getting messages for conversation:', conversationId);

        const conversationObject = await client.getObject({
          id: conversationId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (!conversationObject.data || !conversationObject.data.content) {
          console.log('Conversation object not found or no content');
          return [];
        }

        const conversationContent = conversationObject.data.content as any;
        const conversationData = conversationContent.fields as any;

        if (!conversationData.messages) {
          console.log('No messages field found in conversation');
          return [];
        }

        let messagesVector;
        if (conversationData.messages.fields && conversationData.messages.fields.contents) {
          messagesVector = conversationData.messages.fields.contents;
        } else if (Array.isArray(conversationData.messages)) {
          messagesVector = conversationData.messages;
        } else if (conversationData.messages.contents) {
          messagesVector = conversationData.messages.contents;
        } else {
          console.log('Messages field structure not recognized:', conversationData.messages);
          return [];
        }

        if (!messagesVector || messagesVector.length === 0) {
          console.log('No messages found in conversation');
          return [];
        }

        const messages: Message[] = [];

        for (let i = 0; i < messagesVector.length; i++) {
          const messageData = messagesVector[i].fields;

          try {
            let decryptedContent = '';

            if (messageData.encrypted_content && participants) {
              let encryptedBytes;
              if (Array.isArray(messageData.encrypted_content)) {
                encryptedBytes = new Uint8Array(messageData.encrypted_content);
              } else if (messageData.encrypted_content instanceof Uint8Array) {
                encryptedBytes = messageData.encrypted_content;
              } else {
                console.error(`Unexpected encrypted content format for message ${i}:`, messageData.encrypted_content);
                decryptedContent = '[Invalid encrypted content format]';
                continue;
              }

              try {
                console.warn('Legacy Seal encryption is deprecated. Use the new messaging SDK instead.');
                const { EncryptedObject } = await import('@mysten/seal');

                try {
                  // Try to parse as EncryptedObject (decryption logic would go here if needed)
                  EncryptedObject.parse(encryptedBytes);
                  // For now, fall through to text decoder since decryption is not implemented
                  throw new Error('Decryption not implemented');
                } catch (parseError) {
                  try {
                    const textDecoder = new TextDecoder();
                    const decodedText = textDecoder.decode(encryptedBytes);
                    decryptedContent = decodedText;
                  } catch (textError) {
                    decryptedContent = '[Message content format not supported - may be from older version]';
                  }
                }

                if (decryptedContent) {
                  messages.push({
                    sender: messageData.sender,
                    content: decryptedContent,
                    timestamp: messageData.timestamp.toString(),
                    isRead: messageData.is_read || false
                  });
                  continue;
                }

                console.warn('Legacy Seal client is deprecated. Use the new messaging SDK instead.');
                throw new Error('Legacy encryption is no longer supported. Use the new messaging SDK.');
              } catch (decryptError: any) {
                console.error(`Failed to decrypt message ${i}:`, decryptError);
                decryptedContent = '[Encrypted message - decryption failed]';
              }
            } else if (messageData.encrypted_content) {
              console.log(`Message ${i} has encrypted_content but no participants, decoding as plain text`);
              try {
                if (Array.isArray(messageData.encrypted_content)) {
                  const textDecoder = new TextDecoder('utf-8', { fatal: false });
                  decryptedContent = textDecoder.decode(new Uint8Array(messageData.encrypted_content));
                } else {
                  decryptedContent = '[Invalid message format]';
                }
              } catch (error) {
                console.error(`Message ${i} failed to decode as plain text:`, error);
                decryptedContent = '[Message decode failed]';
              }
            } else {
              console.log(`Message ${i} no encrypted_content field, trying direct content field`);
              if (messageData.content) {
                decryptedContent = messageData.content;
              } else {
                decryptedContent = '[Message content not available]';
              }
            }

            messages.push({
              sender: messageData.sender,
              content: decryptedContent,
              timestamp: messageData.timestamp.toString(),
              isRead: messageData.is_read || false
            });
          } catch (messageError) {
            console.error(`Error processing message ${i}:`, messageError);
            messages.push({
              sender: messageData.sender || 'Unknown',
              content: '[Message processing failed]',
              timestamp: messageData.timestamp?.toString() || '0',
              isRead: false
            });
          }
        }

        return messages;
      } catch (err) {
        console.error('Error getting conversation messages:', err);
        return [];
      }
    },
    [client],
  );

  const getConnections = useCallback(
    async (_connectionStoreId: string, user: string): Promise<Connection[]> => {
      try {
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::devhub::ConnectionAccepted`
          },
          limit: 100,
          order: 'ascending'
        });

        const connections: Connection[] = [];
        for (const event of events.data) {
          if (event.parsedJson) {
            const { user1, user2 } = event.parsedJson as any;
            if (user1 === user || user2 === user) {
              const connectedUser = user1 === user ? user2 : user1;
              connections.push({
                user: connectedUser,
                status: 'Connected',
                notificationsEnabled: true,
                profileShared: true,
                messagesAllowed: true
              });
            }
          }
        }

        return connections;
      } catch (err) {
        console.error('Error getting connections:', err);
        return [];
      }
    },
    [client],
  );

  const getConversations = useCallback(
    async (user: string): Promise<any[]> => {
      try {
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::messaging::ConversationCreated`
          },
          limit: 100,
          order: 'ascending'
        });

        const conversations: any[] = [];
        for (const event of events.data) {
          if (event.parsedJson) {
            const eventData = event.parsedJson as any;
            if (eventData.participant1 === user || eventData.participant2 === user) {
              conversations.push({
                id: eventData.conversation_id,
                participant1: eventData.participant1,
                participant2: eventData.participant2,
                timestamp: eventData.timestamp
              });
            }
          }
        }

        return conversations;
      } catch (err) {
        console.error('Error getting conversations:', err);
        return [];
      }
    },
    [client],
  );

  const useMessages = useCallback(
    async (conversationId: string, forceRefresh: boolean = false): Promise<Message[]> => {
      const cacheKey = `messages:${conversationId}`;
      const cached = cacheRef.current.messages?.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const messages = await getConversationMessages(conversationId);

        if (!cacheRef.current.messages) {
          cacheRef.current.messages = new Map();
        }
        cacheRef.current.messages.set(cacheKey, setCacheEntry(messages));

        return messages;
      } catch (err) {
        console.error('Error fetching messages:', err);
        return [];
      }
    },
    [getConversationMessages, cacheRef],
  );

  const useConnections = useCallback(
    async (connectionStoreId: string, user: string, forceRefresh: boolean = false): Promise<Connection[]> => {
      const cacheKey = `connections:${connectionStoreId}:${user}`;
      const cached = cacheRef.current.connections?.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const connections = await getConnections(connectionStoreId, user);

        if (!cacheRef.current.connections) {
          cacheRef.current.connections = new Map();
        }
        cacheRef.current.connections.set(cacheKey, setCacheEntry(connections));

        return connections;
      } catch (err) {
        console.error('Error fetching connections:', err);
        return [];
      }
    },
    [getConnections, cacheRef],
  );

  const useConversations = useCallback(
    async (user: string, forceRefresh: boolean = false): Promise<Conversation[]> => {
      const cacheKey = `conversations:${user}`;
      const cached = cacheRef.current.conversations?.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log('Querying for ConversationCreated events with package ID:', PACKAGE_ID);
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::messaging::ConversationCreated`
          },
          limit: 100,
          order: 'ascending'
        });

        const conversationsByPair: Record<string, Conversation> = {};
        for (const event of events.data) {
          if (event.parsedJson) {
            const { conversation_id, participant1, participant2 } = event.parsedJson as any;
            const p1 = participant1?.toLowerCase();
            const p2 = participant2?.toLowerCase();
            const u = user?.toLowerCase();

            if (p1 === u || p2 === u) {
              const a = participant1.toLowerCase();
              const b = participant2.toLowerCase();
              const key = a < b ? `${a}-${b}` : `${b}-${a}`;
              conversationsByPair[key] = {
                id: conversation_id,
                participant1,
                participant2,
                messages: []
              };
            }
          }
        }
        const conversations = Object.values(conversationsByPair);

        if (!cacheRef.current.conversations) {
          cacheRef.current.conversations = new Map();
        }
        cacheRef.current.conversations.set(cacheKey, setCacheEntry(conversations));

        return conversations;
      } catch (err) {
        console.error('Error fetching conversations:', err);
        return [];
      }
    },
    [client, cacheRef],
  );

  return {
    getConversationMessages,
    getConnections,
    getConversations,
    useMessages,
    useConnections,
    useConversations,
    // SDK function wrappers
    createMessagingChannel,
    getUserMemberships,
    getChannelObjects,
    sendMessage,
    getChannelMessages,
    createChannelTransaction,
    sendMessageToChannelTransaction,
    addMemberToChannelTransaction,
    removeMemberFromChannelTransaction,
    getChannelMessagesTransaction,
    getChannelMembersTransaction,
    getUserChannelMemberships,
    getChannelDetails,
    getChannelMessagesFromObject,
  };
};

