import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '../constants';
import { CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';
import { parseReturnValue } from '../utils';
import { Message, Connection, ConnectionRequest } from '../types';

export async function getConversationMessages(conversationId: string, _participants?: string[]): Promise<Message[]> {
  try {
    // Query the conversation object directly to get the messages
    const conversationObject = await suiClient.getObject({
      id: conversationId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (conversationObject.data?.content && 'fields' in conversationObject.data.content) {
      const conversationFields = conversationObject.data.content.fields as any;
      if (conversationFields.messages && Array.isArray(conversationFields.messages)) {
        console.log('Found messages in conversation object:', conversationFields.messages);

        const messages: Message[] = [];
        for (const msg of conversationFields.messages) {
          try {
            console.log('Processing message:', msg);
            console.log('Message fields:', msg.fields);
            console.log('Message structure:', JSON.stringify(msg, null, 2));

            // Try to decrypt the message if participants are provided
            let decryptedContent = 'Message content not available';
            const key = msg.fields?.key ? new Uint8Array(msg.fields.key) : undefined;

            console.log('Processing message fields:', msg.fields);
            console.log('Message has encrypted_content:', !!msg.fields?.encrypted_content);
            console.log('Message has content:', !!msg.fields?.content);

            // First, try to get content from the 'encrypted_content' field (most common case for your messages)
            if (msg.fields?.encrypted_content) {
              try {
                console.log('Processing message with encrypted_content:', msg.fields.encrypted_content);

                // Convert the encrypted_content array to bytes and decode as text
                let contentBytes;
                if (Array.isArray(msg.fields.encrypted_content)) {
                  contentBytes = new Uint8Array(msg.fields.encrypted_content);
                } else if (typeof msg.fields.encrypted_content === 'string') {
                  // Handle hex string
                  const hexString = msg.fields.encrypted_content.startsWith('0x')
                    ? msg.fields.encrypted_content.slice(2)
                    : msg.fields.encrypted_content;
                  contentBytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
                } else {
                  contentBytes = new Uint8Array(msg.fields.encrypted_content);
                }

                console.log('Content bytes length:', contentBytes.length);
                console.log('Content bytes (first 20):', Array.from(contentBytes.slice(0, 20)));

                // Try to decode as plain text first (most messages are stored as plain text)
                try {
                  decryptedContent = new TextDecoder('utf-8', { fatal: false }).decode(contentBytes);

                  // Check if the decoded content is valid text (not just control characters or binary data)
                  if (decryptedContent && decryptedContent.trim().length > 0) {
                    // Validate that it's actually readable text
                    const hasControlChars = /[\x00-\x08\x0E-\x1F\x7F]/.test(decryptedContent);
                    const hasNonPrintable = /[^\x20-\x7E\n\r\t]/.test(decryptedContent);

                    if (!hasControlChars && !hasNonPrintable) {
                      console.log('Message decoded as plain text:', decryptedContent);
                    } else {
                      // If it contains control characters or non-printable chars, try alternative decoding
                      console.log('Message contains control characters, trying alternative decoding');
                      throw new Error('Invalid text encoding');
                    }
                  } else {
                    console.log('Decoded content is empty or whitespace only');
                    throw new Error('Empty decoded content');
                  }
                } catch (textError) {
                  console.log('Plain text decode failed or produced invalid content:', textError);

                  // If plain text fails, try EncryptedObject parsing
                  try {
                    const { EncryptedObject } = await import('@mysten/seal');
                    const encryptedObject = EncryptedObject.parse(contentBytes);
                    console.log('Parsed as EncryptedObject:', encryptedObject);

                    // For now, we'll skip Seal decryption and use plain text fallback
                    console.log('Seal decryption not available, using plain text fallback');
                    throw new Error('Seal decryption not implemented');
                  } catch (sealError) {
                    console.log('EncryptedObject parsing failed:', sealError);
                    decryptedContent = '[Message content format not supported]';
                  }
                }
              } catch (decryptError) {
                console.warn('Failed to process message:', decryptError);
                decryptedContent = '[Message content not available]';
              }
            }
            // Fallback to content field if encrypted_content is not available
            else if (msg.fields?.content) {
              decryptedContent = msg.fields.content;
              console.log('Using content field:', decryptedContent);
            }
            // Also check if the message has a direct content property
            else if (msg.content) {
              decryptedContent = msg.content;
              console.log('Using direct content property:', decryptedContent);
            }
            // Check if the message has a text property (alternative field name)
            else if (msg.fields?.text) {
              decryptedContent = msg.fields.text;
              console.log('Using text field:', decryptedContent);
            }
            // Check if the message has a message property (alternative field name)
            else if (msg.fields?.message) {
              decryptedContent = msg.fields.message;
              console.log('Using message field:', decryptedContent);
            }
            // Check if the message has a body property (alternative field name)
            else if (msg.fields?.body) {
              decryptedContent = msg.fields.body;
              console.log('Using body field:', decryptedContent);
            }
            // Check if the message has a data property (alternative field name)
            else if (msg.fields?.data) {
              decryptedContent = msg.fields.data;
              console.log('Using data field:', decryptedContent);
            }
            // Check if the message has a value property (alternative field name)
            else if (msg.fields?.value) {
              decryptedContent = msg.fields.value;
              console.log('Using value field:', decryptedContent);
            }
            // Check if the message has a payload property (alternative field name)
            else if (msg.fields?.payload) {
              decryptedContent = msg.fields.payload;
              console.log('Using payload field:', decryptedContent);
            }
            // If neither content nor encrypted_content is available, show unavailable
            else {
              console.log('No content or encrypted_content found in message');
              console.log('Available message properties:', Object.keys(msg.fields || {}));
              console.log('Direct message properties:', Object.keys(msg));
              console.log('Full message object:', JSON.stringify(msg, null, 2));
              decryptedContent = '[Message content not available]';
            }

            messages.push({
              sender: msg.fields?.sender || msg.sender,
              content: decryptedContent,
              timestamp: msg.fields?.timestamp || msg.timestamp,
              isRead: msg.fields?.is_read || msg.is_read || false,
              key: key,
            });
          } catch (msgError) {
            console.error('Error processing message:', msgError);
            // Add message with error content
            messages.push({
              sender: msg.fields?.sender || msg.sender,
              content: 'Error loading message',
              timestamp: msg.fields?.timestamp || msg.timestamp,
              isRead: msg.fields?.is_read || msg.is_read || false,
            });
          }
        }

        return messages;
      }
    }

    console.log('No messages found in conversation object');
    return [];
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
}

// Connection view functions
export async function getConnections(connectionStoreId: string, user: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_CONNECTIONS}`,
          arguments: [
            tx.object(connectionStoreId),
            tx.pure.address(user),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as Connection[];
    }
    return [];
  } catch (error) {
    console.error('Error getting connections:', error);
    return [];
  }
}

export async function isConnected(connectionStoreId: string, user1: string, user2: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.IS_CONNECTED}`,
          arguments: [
            tx.object(connectionStoreId),
            tx.pure.address(user1),
            tx.pure.address(user2),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return Boolean(parseReturnValue(result.results[0].returnValues[0]));
    }
    return false;
  } catch (error) {
    console.error('Error checking if connected:', error);
    return false;
  }
}

// Get connection requests owned by user
export async function getConnectionRequests(userAddress: string): Promise<ConnectionRequest[]> {
  try {
    console.log('Querying connection requests for user:', userAddress);
    const currentPackageId = getCurrentPackageId();
    console.log('Using package ID:', currentPackageId);

    const objects = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${currentPackageId}::connections::ConnectionRequest`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    console.log('Raw objects response:', objects);
    console.log('Number of objects found:', objects.data.length);

    const requests: ConnectionRequest[] = [];
    for (const obj of objects.data) {
      console.log('Processing object:', obj);
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = (obj.data.content as any).fields;
        console.log('Object fields:', fields);
        requests.push({
          id: obj.data.objectId,
          from: fields.from,
          to: fields.to,
          introMessage: fields.intro_message,
          sharedContext: fields.shared_context,
          isPublic: fields.is_public,
          status: fields.status,
        });
      }
    }

    console.log('Processed connection requests:', requests);
    return requests;
  } catch (error) {
    console.error('Error getting connection requests:', error);
    return [];
  }
}

// Proposal view functions
