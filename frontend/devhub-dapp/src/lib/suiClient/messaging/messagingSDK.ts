// Messaging SDK wrapper functions
// These functions provide a wrapper around the Sui messaging SDK
// Note: Some functions are currently using mock implementations due to SDK compatibility issues

import { suiClient, getCurrentPackageId } from '../constants';
import { getAllActiveCards } from '../read/adminRead';

export async function createMessagingChannel(
  userAddress: string,
  participantAddress: string,
  _signer: any
) {
  try {
    // For now, we'll use the legacy conversation creation
    // until the SDK compatibility issues are resolved
    console.warn('Using legacy conversation creation due to SDK compatibility issues');

    // Create a mock channel ID that looks like a valid Sui object ID
    // Sui object IDs are 32 bytes (64 hex characters) starting with 0x
    const timestamp = Date.now().toString(16);
    const userHash = userAddress.slice(2, 10); // Remove 0x and take 8 chars
    const participantHash = participantAddress.slice(2, 10); // Remove 0x and take 8 chars
    const randomSuffix = Math.random().toString(16).slice(2, 10);

    // Create a 64-character hex string (32 bytes)
    const hexId = (timestamp + userHash + participantHash + randomSuffix).padEnd(64, '0').slice(0, 64);
    const channelId = `0x${hexId}`;
    const encryptedKeyBytes = new Uint8Array(32); // Mock key

    return { channelId, encryptedKeyBytes };
  } catch (error) {
    console.error('Error creating messaging channel:', error);
    throw error;
  }
}

// Helper function to get user's messaging memberships
export async function getUserMemberships(_userAddress: string) {
  try {
    // For now, we'll use the legacy conversation approach
    // until the SDK compatibility issues are resolved
    console.warn('Using legacy conversation loading due to SDK compatibility issues');

    // Return empty memberships for now
    return { memberships: [], hasNextPage: false, cursor: null };
  } catch (error) {
    console.error('Error getting user memberships:', error);
    return { memberships: [], hasNextPage: false, cursor: null };
  }
}

// Helper function to get user's channel memberships
export async function getUserChannelMemberships(userAddress: string) {
  try {
    console.log('Getting channel memberships for user:', userAddress);

    const client = suiClient;
    const ownedObjects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${getCurrentPackageId()}::channels::MemberCap`
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    const memberships = ownedObjects.data.map((obj: any) => {
      const fields = (obj.data?.content as any)?.fields;
      return {
        channelId: fields?.channel_id || obj.data?.objectId,
        memberCapId: obj.data?.objectId,
        memberAddress: fields?.member_address || userAddress,
      };
    });

    console.log('Found channel memberships:', memberships);
    return memberships;
  } catch (error) {
    console.error('Error getting user channel memberships:', error);
    return [];
  }
}

// Helper function to get channel objects
export async function getChannelObjects(_channelIds: string[], _userAddress: string) {
  try {
    // For now, we'll use a mock approach
    // until the SDK compatibility issues are resolved
    console.warn('Using mock channel objects due to SDK compatibility issues');

    // Return empty channel objects for now
    return [];
  } catch (error) {
    console.error('Error getting channel objects:', error);
    return [];
  }
}

// Helper function to send a message
export async function sendMessage(
  _channelId: string,
  _memberCapId: string,
  _message: string,
  _encryptedKey: any,
  _signer: any
) {
  try {
    // For now, we'll use a mock approach
    // until the SDK compatibility issues are resolved
    console.warn('Using mock message sending due to SDK compatibility issues');

    // Return mock results for now
    const digest = `mock_digest_${Date.now()}`;
    const messageId = `mock_message_${Date.now()}`;

    return { digest, messageId };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Helper function to get channel messages
export async function getChannelMessages(
  _channelId: string,
  _userAddress: string,
  _limit: number = 50,
  _direction: 'forward' | 'backward' = 'backward'
) {
  try {
    // For now, we'll use a mock approach
    // until the SDK compatibility issues are resolved
    console.warn('Using mock channel messages due to SDK compatibility issues');

    // Return empty messages for now
    return { messages: [], hasNextPage: false, cursor: null };
  } catch (error) {
    console.error('Error getting channel messages:', error);
    return { messages: [], hasNextPage: false, cursor: null };
  }
}
export async function getChannelMessagesFromObject(channelId: string) {
  try {
    console.log('Getting messages for channel:', channelId);

    const client = suiClient;
    const channelObject = await client.getObject({
      id: channelId,
      options: {
        showContent: true,
        showType: true
      }
    });

    if (!channelObject.data?.content) {
      console.error('Channel object not found:', channelId);
      return [];
    }

    const messages = channelObject.data.content.fields.messages || [];
    console.log('Raw messages from blockchain:', messages);

    return messages.map((msg: any, index: number) => {
      console.log('Processing message:', msg);
      console.log('Message fields:', msg.fields);

      // Try to decode the encrypted content using the same logic as getConversationMessages
      let decryptedContent = '[Encrypted message]';

      try {
        // First, try to get content from the 'encrypted_content' field (most common case)
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
                // Allow UTF-8 characters including emojis, but reject control characters
                const hasControlChars = /[\x00-\x08\x0E-\x1F\x7F]/.test(decryptedContent);

                // Check if the content is valid UTF-8 text (including emojis and other Unicode characters)
                const isValidUTF8 = /^[\p{L}\p{N}\p{P}\p{S}\p{Z}\p{M}\p{Cc}\p{Cf}\p{Cn}\p{Co}\p{Cs}]*$/u.test(decryptedContent);

                if (!hasControlChars && isValidUTF8) {
                  console.log('Message decoded as plain text:', decryptedContent);
                } else {
                  // If it contains control characters or invalid UTF-8, try alternative decoding
                  console.log('Message contains control characters or invalid UTF-8, trying alternative decoding');
                  throw new Error('Invalid text encoding');
                }
              } else {
                console.log('Decoded content is empty or whitespace only');
                throw new Error('Empty decoded content');
              }
            } catch (textError) {
              console.log('Plain text decode failed or produced invalid content:', textError);
              decryptedContent = '[Message content format not supported]';
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
      } catch (error) {
        console.warn('Could not decode message content:', error);
        decryptedContent = '[Encrypted message]';
      }

      // Ensure unique ID by combining timestamp with index
      const uniqueId = msg.id || `${Date.now()}_${index}`;

      // Parse timestamp properly - handle different formats
      let parsedTimestamp = Date.now();
      try {
        const rawTimestamp = msg.fields?.timestamp || msg.timestamp;
        console.log('Raw timestamp from blockchain:', rawTimestamp, 'Type:', typeof rawTimestamp);
        if (rawTimestamp) {
          // If it's a string, try to parse it
          if (typeof rawTimestamp === 'string') {
            const numTimestamp = parseInt(rawTimestamp);
            if (!isNaN(numTimestamp)) {
              // If the timestamp is in seconds (less than year 2001), convert to milliseconds
              if (numTimestamp < 1000000000000) {
                parsedTimestamp = numTimestamp * 1000;
              } else {
                parsedTimestamp = numTimestamp;
              }
            } else {
              // Try to parse as date string
              const dateTimestamp = new Date(rawTimestamp).getTime();
              if (!isNaN(dateTimestamp)) {
                parsedTimestamp = dateTimestamp;
              }
            }
          } else if (typeof rawTimestamp === 'number') {
            // If the timestamp is in seconds (less than year 2001), convert to milliseconds
            if (rawTimestamp < 1000000000000) {
              parsedTimestamp = rawTimestamp * 1000;
            } else {
              parsedTimestamp = rawTimestamp;
            }
          }
        }
      } catch (error) {
        console.warn('Error parsing timestamp:', error);
        parsedTimestamp = Date.now();
      }

      console.log('Final parsed timestamp:', parsedTimestamp, 'Date:', new Date(parsedTimestamp));

      return {
        id: uniqueId,
        sender: msg.fields?.sender || msg.sender || '',
        content: decryptedContent,
        timestamp: parsedTimestamp,
        isRead: msg.fields?.is_read || msg.is_read || true
      };
    });
  } catch (error) {
    console.error('Error getting channel messages:', error);
    return [];
  }
}

// Helper function to get channel members
export async function getChannelMembers(channelId: string) {
  try {
    console.log('Getting members for channel:', channelId);

    const client = suiClient;
    const channelObject = await client.getObject({
      id: channelId,
      options: {
        showContent: true,
        showType: true
      }
    });

    if (!channelObject.data?.content) {
      console.error('Channel object not found:', channelId);
      return [];
    }

    const members = channelObject.data.content.fields.members || [];

    // Get all active cards to map addresses to names
    let addressToNameMap: Record<string, { name: string; title: string; imageUrl: string }> = {};

    try {
      // Call directly to avoid dynamic self-import loops
      const activeCards = await getAllActiveCards();

      // Create mapping from address to user info
      activeCards.forEach((card: any) => {
        if (card.owner && card.name) {
          addressToNameMap[card.owner] = {
            name: card.name,
            title: card.niche || 'Developer',
            imageUrl: card.imageUrl || '/api/placeholder/40/40'
          };
        }
      });
    } catch (error) {
      console.warn('Could not fetch user names, using fallback:', error);
    }

    return members.map((address: string) => {
      const userInfo = addressToNameMap[address];
      return {
        address,
        name: userInfo?.name || `Developer ${address.slice(0, 8)}...`,
        title: userInfo?.title || 'Developer',
        imageUrl: userInfo?.imageUrl || '/api/placeholder/40/40',
        isOnline: Math.random() > 0.5
      };
    });
  } catch (error) {
    console.error('Error getting channel members:', error);
    return [];
  }
}

// Helper function to get channel details
export async function getChannelDetails(channelId: string) {
  try {
    console.log('Getting channel details for:', channelId);

    const client = suiClient;
    const channelObject = await client.getObject({
      id: channelId,
      options: {
        showContent: true,
        showType: true
      }
    });

    if (!channelObject.data?.content) {
      console.error('Channel object not found:', channelId);
      return null;
    }

    const fields = channelObject.data.content.fields as any;
    const members = fields.members || [];
    const messages = fields.messages?.fields?.contents || [];
    
    // Get the last message timestamp for lastActivity
    let lastActivity = 0;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const timestamp = lastMessage.fields?.timestamp || lastMessage.timestamp || 0;
      lastActivity = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      // Convert to milliseconds if in seconds
      if (lastActivity < 1000000000000) {
        lastActivity = lastActivity * 1000;
      }
    }

    // Get channel name if available, otherwise use a default
    const name = fields.name || fields.channel_name || `Channel ${channelId.slice(0, 8)}...`;

    // Get creation timestamp if available
    let createdAt = 0;
    if (fields.created_at) {
      createdAt = typeof fields.created_at === 'string' ? parseInt(fields.created_at) : fields.created_at;
      if (createdAt < 1000000000000) {
        createdAt = createdAt * 1000;
      }
    } else if (channelObject.data.createdAt) {
      createdAt = typeof channelObject.data.createdAt === 'string' 
        ? parseInt(channelObject.data.createdAt) 
        : channelObject.data.createdAt;
    }

    return {
      id: channelId,
      name,
      members: members.map((addr: string) => ({ address: addr })),
      createdAt,
      lastActivity,
      isActive: true
    };
  } catch (error) {
    console.error('Error getting channel details:', error);
    return null;
  }
}
