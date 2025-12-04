import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '../constants';
import { PACKAGE_ID, DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS } from '../constants';
import { parseReturnValue, parseU64Value, bytesToHexAddress } from '../utils';
import { DevCardData } from '../types';
import { getCardCount } from './platformStats';
import { getCardInfo } from './cardRead';

export async function getProjectManagers() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PROJECT_MANAGERS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting project managers:', error);
    return [];
  }
}

export async function getCommunityManagers() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_COMMUNITY_MANAGERS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting community managers:', error);
    return [];
  }
}

export async function getDevelopmentDirectors() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_DEVELOPMENT_DIRECTORS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting development directors:', error);
    return [];
  }
}

export async function getProductManagers() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PRODUCT_MANAGERS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting product managers:', error);
    return [];
  }
}

export async function getMarketingSpecialists() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_MARKETING_SPECIALISTS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting marketing specialists:', error);
    return [];
  }
}

export async function getBusinessAnalysts() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_BUSINESS_ANALYSTS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting business analysts:', error);
    return [];
  }
}

export async function getCustomNiches() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CUSTOM_NICHES}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as string[];
    }
    return [];
  } catch (error) {
    console.error('Error getting custom niches:', error);
    return [];
  }
}

export async function getAllNichesInUse() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_ALL_NICHES_IN_USE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as string[];
    }
    return [];
  } catch (error) {
    console.error('Error getting all niches in use:', error);
    return [];
  }
}

export async function getAvailableNiches() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_AVAILABLE_NICHES}`,
          arguments: [],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as string[];
    }
    return [];
  } catch (error) {
    console.error('Error getting available niches:', error);
    return [];
  }
}

export async function isCustomNiche(niche: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.IS_CUSTOM_NICHE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.string(niche),
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
    console.error('Error checking if custom niche:', error);
    return false;
  }
}

// Messaging view functions
export async function getAdmins(): Promise<string[]> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_ADMINS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('Full getAdmins result:', JSON.stringify(result, null, 2));

    if (result.results?.[0]?.returnValues?.[0]) {
      const rawData = result.results[0].returnValues[0];
      console.log('Raw admins data:', rawData);
      console.log('Raw admins data type:', typeof rawData);
      console.log('Raw admins data is array:', Array.isArray(rawData));

      // Enhanced debugging for Move vector format
      if (Array.isArray(rawData)) {
        console.log('Array length:', rawData.length);
        console.log('Array contents:', rawData);
        rawData.forEach((item, index) => {
          console.log(`Item ${index}:`, item);
          console.log(`Item ${index} type:`, typeof item);
          console.log(`Item ${index} is array:`, Array.isArray(item));
        });
      }

      // Handle the case where we get a single concatenated string
      if (typeof rawData === 'string' && (rawData as string).length > 64) {
        console.log('Received concatenated string, attempting to split...');

        // Use regex to find all valid Sui addresses in the string
        const addressRegex = /0x[a-fA-F0-9]{64}/g;
        const matches = (rawData as string).match(addressRegex);

        if (matches && matches.length > 0) {
          console.log('Found addresses with regex:', matches);
          return matches;
        }

        // If no matches with 0x prefix, try finding 64-character hex strings
        const hexRegex = /[a-fA-F0-9]{64}/g;
        const hexMatches = (rawData as string).match(hexRegex);

        if (hexMatches && hexMatches.length > 0) {
          console.log('Found hex strings without 0x prefix:', hexMatches);
          return hexMatches.map(addr => '0x' + addr);
        }
      }

      // Handle array of addresses - this is the most likely case for Move vector<address>
      if (Array.isArray(rawData)) {
        console.log('Processing array of addresses...');
        console.log('Array length:', rawData.length);

        // Check if this is a Move vector format: [byteArray, 'vector<address>']
        if (rawData.length === 2 && Array.isArray(rawData[0]) && rawData[1] === 'vector<address>') {
          console.log('Detected Move vector<address> format');
          const byteArray = rawData[0];
          console.log('Byte array length:', byteArray.length);
          console.log('Full byte array:', byteArray);
          console.log('First 10 bytes:', byteArray.slice(0, 10));
          console.log('Last 10 bytes:', byteArray.slice(-10));

          // Move vector<address> is serialized as a concatenated byte array
          // We need to find the actual address data by looking for patterns
          const addresses: string[] = [];

          // Try different approaches to find the addresses
          console.log('=== Attempting to extract addresses ===');

          // The first byte is a count indicator, not a type indicator to skip
          const addressCount = byteArray[0];
          console.log('Address count from first byte:', addressCount);

          // Start from index 1 (skip the count byte)
          let startIndex = 1;

          console.log('Starting extraction from index:', startIndex);
          const remainingBytes = byteArray.slice(startIndex);
          console.log('Remaining bytes length:', remainingBytes.length);
          console.log('Remaining bytes:', remainingBytes);

          // Try to find addresses by looking for 32-byte chunks
          const addressLength = 32;
          const expectedAddresses = Math.floor(remainingBytes.length / addressLength);
          console.log('Expected number of addresses from byte length:', expectedAddresses);
          console.log('Expected number of addresses from count indicator:', addressCount);

          // Use the count indicator to determine how many addresses to extract
          const addressesToExtract = Math.min(addressCount, expectedAddresses);
          console.log('Will extract', addressesToExtract, 'addresses');

          for (let i = 0; i < addressesToExtract; i++) {
            const startByte = i * addressLength;
            const endByte = startByte + addressLength;

            if (endByte <= remainingBytes.length) {
              const addressBytes = remainingBytes.slice(startByte, endByte);
              console.log(`\n--- Extracting address ${i + 1} ---`);
              console.log(`Byte range: ${startByte}-${endByte}`);
              console.log(`Address bytes:`, addressBytes);
              console.log(`Address bytes length:`, addressBytes.length);

              const address = bytesToHexAddress(addressBytes);
              console.log(`Converted address:`, address);
              console.log(`Address length:`, address.length);
              console.log(`Address starts with 0x:`, address.startsWith('0x'));

              if (address && address.startsWith('0x') && address.length === 66) {
                addresses.push(address);
                console.log(`✅ Valid address added:`, address);
              } else {
                console.log(`❌ Invalid address format:`, address);
              }
            } else {
              console.log(`❌ Not enough bytes for address ${i + 1}`);
            }
          }

          console.log('\n=== Final Results ===');
          console.log('Extracted addresses from vector:', addresses);
          console.log('Number of addresses found:', addresses.length);
          return addresses;
        }

        // Handle regular array format
        const convertedAddresses = rawData
          .map((addr: any, index: number) => {
            console.log(`Processing address ${index}:`, addr);
            console.log(`Address type:`, typeof addr);
            console.log(`Address is array:`, Array.isArray(addr));

            // Handle different address formats
            if (Array.isArray(addr) && addr.length === 2) {
              // This is likely a [type, data] format from Move
              const [type, data] = addr;
              console.log(`[type, data] format - type: ${type}, data:`, data);
              if (typeof type === 'number' && Array.isArray(data)) {
                const converted = bytesToHexAddress(data);
                console.log(`Converted [type, data] address ${index}:`, converted);
                return converted;
              }
            } else if (Array.isArray(addr)) {
              // Direct byte array
              console.log(`Direct byte array format:`, addr);
              const converted = bytesToHexAddress(addr);
              console.log(`Converted direct array address ${index}:`, converted);
              return converted;
            } else if (typeof addr === 'string' && addr.startsWith('0x')) {
              console.log(`Valid hex string address ${index}:`, addr);
              return addr;
            } else if (typeof addr === 'string') {
              // Try to parse as hex string without 0x prefix
              if (addr.length === 64 && /^[a-fA-F0-9]+$/.test(addr)) {
                const withPrefix = '0x' + addr;
                console.log(`Added 0x prefix to address ${index}:`, withPrefix);
                return withPrefix;
              }
            }

            // Try to convert to string
            const converted = addr.toString();
            if (converted.includes('vector')) {
              console.log(`Skipping vector string ${index}:`, converted);
              return null;
            }
            console.log(`Fallback conversion ${index}:`, converted);
            return converted;
          })
          .filter(addr => {
            const isValid = addr !== null &&
              addr !== undefined &&
              addr !== '' &&
              !addr.includes('vector') &&
              addr.startsWith('0x') &&
              addr.length === 66; // 0x + 64 hex chars
            console.log(`Address validation for "${addr}": ${isValid}`);
            return isValid;
          });

        console.log('Final converted addresses:', convertedAddresses);
        console.log('Number of valid addresses found:', convertedAddresses.length);
        return convertedAddresses;
      }
    }

    console.log('No valid admin data found');
    return [];
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
}

// Get platform fee balance
export async function getPlatformFeeBalance(): Promise<number> {
  try {
    console.log('🔍 Fetching platform fee balance...');

    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('🔍 Platform fee balance query result:', result);

    if (result.results?.[0]?.returnValues?.[0]) {
      const rawValue = result.results[0].returnValues[0];
      console.log('🔍 Raw platform fee balance value:', rawValue);

      const balance = parseU64Value(rawValue);
      console.log('🔍 Final platform fee balance:', balance);

      // Validate the balance is a reasonable number
      if (isNaN(balance) || balance < 0) {
        console.warn('⚠️ Invalid platform fee balance received:', balance);
        return 0;
      }

      return balance;
    }

    console.log('⚠️ No return values found in platform fee balance query');
    return 0;
  } catch (error) {
    console.error('❌ Error getting platform fee balance:', error);
    return 0;
  }
}

// Get current platform fee amount
export async function getPlatformFee(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::get_platform_fee`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      const feeInMist = Number(parseReturnValue(result.results[0].returnValues[0]));
      return feeInMist / 1_000_000_000; // Convert from MIST to SUI
    }
    return 0.1; // Default to 0.1 SUI
  } catch (error) {
    console.error('Error getting platform fee:', error);
    return 0.1; // Default to 0.1 SUI
  }
}

// Get current project posting fee amount
export async function getProjectPostingFee(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::get_project_posting_fee`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      const feeInMist = Number(parseReturnValue(result.results[0].returnValues[0]));
      return feeInMist / 1_000_000_000; // Convert from MIST to SUI
    }
    return 0.2; // Default to 0.2 SUI
  } catch (error) {
    console.error('Error getting project posting fee:', error);
    return 0.2; // Default to 0.2 SUI
  }
}

// Check if address is admin




// === Utility Functions ===

// Get all active cards (for browse page)
export async function getAllActiveCards(): Promise<DevCardData[]> {
  try {
    const cardCount = await getCardCount();
    const activeCards: DevCardData[] = [];

    for (let i = 1; i <= cardCount; i++) {
      const cardInfo = await getCardInfo(i);
      if (cardInfo && cardInfo.openToWork) {
        activeCards.push(cardInfo);
      }
    }

    return activeCards;
  } catch (error) {
    console.error('Error getting all active cards:', error);
    return [];
  }
}

// Get all cards open to work (for job board)
export async function getCardsOpenToWork(): Promise<DevCardData[]> {
  try {
    const cardCount = await getCardCount();
    const openToWorkCards: DevCardData[] = [];

    for (let i = 1; i <= cardCount; i++) {
      const cardInfo = await getCardInfo(i);
      if (cardInfo && cardInfo.openToWork) {
        openToWorkCards.push(cardInfo);
      }
    }

    return openToWorkCards;
  } catch (error) {
    console.error('Error getting cards open to work:', error);
    return [];
  }
}

// Get suggested developers for dashboard with smart filtering and ranking
export async function getSuggestedDevelopers(limit: number = 3, excludeAddress?: string): Promise<DevCardData[]> {
  try {
    const cardCount = await getCardCount();
    const allCards: DevCardData[] = [];

    // Fetch all active cards
    for (let i = 1; i <= cardCount; i++) {
      const cardInfo = await getCardInfo(i);
      if (cardInfo && cardInfo.openToWork) {
        allCards.push(cardInfo);
      }
    }

    // Filter out the current user's cards if excludeAddress is provided
    const filteredCards = excludeAddress
      ? allCards.filter(card => card.owner !== excludeAddress)
      : allCards;

    // Sort cards by a combination of factors for better suggestions
    const sortedCards = filteredCards.sort((a, b) => {
      // Priority factors (higher is better):
      // 1. Verified status (verified developers get priority)
      // 2. Profile views (more popular developers)
      // 3. Years of experience
      // 4. Number of featured projects

      let scoreA = 0;
      let scoreB = 0;

      // Verified status bonus
      if (a.verified) scoreA += 100;
      if (b.verified) scoreB += 100;

      // Profile views (normalized)
      scoreA += Math.min(a.analytics.totalViews / 10, 50);
      scoreB += Math.min(b.analytics.totalViews / 10, 50);

      // Years of experience
      scoreA += a.yearsOfExperience * 2;
      scoreB += b.yearsOfExperience * 2;

      // Featured projects
      scoreA += a.featuredProjects.length * 5;
      scoreB += b.featuredProjects.length * 5;

      // Average rating (if available)
      if (a.analytics.averageRating > 0) scoreA += a.analytics.averageRating / 10;
      if (b.analytics.averageRating > 0) scoreB += b.analytics.averageRating / 10;

      return scoreB - scoreA;
    });

    // Return the top suggestions
    return sortedCards.slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested developers:', error);
    return [];
  }
}

// Helper function to count open projects by fetching from table (same as Projects page)
async function countOpenProjectsFromTable(): Promise<number> {
  try {
    // Get the DevHub object to find the projects table ID
    const devhubObj = await suiClient.getObject({
      id: DEVHUB_OBJECT_ID,
      options: { showContent: true, showType: true, showOwner: true }
    });

    if (!devhubObj.data?.content || !('fields' in devhubObj.data.content)) {
      console.warn('⚠️ DevHub object has no content');
      return 0;
    }

    const devhubFields = (devhubObj.data.content as any).fields;

    if (!devhubFields.projects) {
      console.warn('⚠️ Projects table not found in DevHub structure');
      return 0;
    }

    // Extract the table ID from the projects field
    let projectsTableId: string;
    let idValue: any;

    if (devhubFields.projects.fields && devhubFields.projects.fields.id) {
      idValue = devhubFields.projects.fields.id;
    } else if (devhubFields.projects.id) {
      idValue = devhubFields.projects.id;
    } else {
      console.error('⚠️ Projects table structure not recognized');
      return 0;
    }

    // Extract string ID from UID object
    if (typeof idValue === 'object' && idValue !== null) {
      if (idValue.id) {
        projectsTableId = String(idValue.id);
      } else if (idValue.objectId) {
        projectsTableId = String(idValue.objectId);
      } else {
        const keys = Object.keys(idValue);
        const possibleId = keys.find(k =>
          typeof idValue[k] === 'string' &&
          idValue[k].startsWith('0x')
        );
        if (possibleId) {
          projectsTableId = String(idValue[possibleId]);
        } else {
          console.error('⚠️ Cannot extract table ID');
          return 0;
        }
      }
    } else if (typeof idValue === 'string') {
      projectsTableId = idValue;
    } else {
      console.error('⚠️ Invalid table ID format');
      return 0;
    }

    // Query dynamic fields on the projects table
    const tableDynamicFields = await suiClient.getDynamicFields({
      parentId: projectsTableId,
      limit: 200
    });

    if (!tableDynamicFields.data || tableDynamicFields.data.length === 0) {
      return 0;
    }

    let openCount = 0;

    // Fetch each dynamic field object and check status
    for (const field of tableDynamicFields.data) {
      try {
        const fieldObj = await suiClient.getDynamicFieldObject({
          parentId: projectsTableId,
          name: field.name
        });

        if (fieldObj.data && fieldObj.data.content && 'fields' in fieldObj.data.content) {
          const type = fieldObj.data.type || '';
          if (type.includes('Project')) {
            // Extract Project struct from dynamic field value
            const container = fieldObj.data.content as any;
            const valueNode = container.fields?.value ?? container.fields;
            const fields = (valueNode && valueNode.fields) ? valueNode.fields : valueNode;

            if (fields && fields.applications_status === 'Open') {
              openCount++;
            }
          }
        }
      } catch (fieldError: any) {
        console.debug(`⚠️ Error fetching field ${field.name}:`, fieldError?.message || fieldError);
        continue;
      }
    }

    console.log(`📊 Counted ${openCount} open projects from table`);
    return openCount;
  } catch (error) {
    console.error('❌ Error counting open projects from table:', error);
    return 0;
  }
}

// Get platform statistics
export async function getPlatformStats(): Promise<{
  totalDevelopers: number;
  activeDevelopers: number;
  verifiedDevelopers: number;
  openProjects: number;
}> {
  try {
    // Fetch platform stats and count open projects from table in parallel
    const [statsResult, openProjectsCount] = await Promise.all([
      suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::get_platform_stats`,
            arguments: [
              tx.object(DEVHUB_OBJECT_ID),
            ],
          });
          return tx;
        })(),
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      }),
      countOpenProjectsFromTable() // Count open projects from table (same method as Projects page)
    ]);

    // Parse platform stats
    let totalDevelopers = 0;
    let activeDevelopers = 0;
    let verifiedDevelopers = 0;

    if (statsResult.results?.[0]?.returnValues) {
      const returnValues = statsResult.results[0].returnValues;
      totalDevelopers = Number(parseReturnValue(returnValues[0]));
      activeDevelopers = Number(parseReturnValue(returnValues[1]));
      verifiedDevelopers = Number(parseReturnValue(returnValues[2]));
    }

    // Use count from table to ensure consistency with Projects page
    const openProjects = openProjectsCount;

    console.log('📊 Platform stats fetched:', {
      totalDevelopers,
      activeDevelopers,
      verifiedDevelopers,
      openProjects,
      openProjectsCount
    });

    return {
      totalDevelopers,
      activeDevelopers,
      verifiedDevelopers,
      openProjects,
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    // Fallback: try to get at least open projects count from table
    try {
      const openProjects = await countOpenProjectsFromTable();
      return {
        totalDevelopers: 0,
        activeDevelopers: 0,
        verifiedDevelopers: 0,
        openProjects,
      };
    } catch (fallbackError) {
      console.error('Error in fallback getting open projects:', fallbackError);
      return {
        totalDevelopers: 0,
        activeDevelopers: 0,
        verifiedDevelopers: 0,
        openProjects: 0,
      };
    }
  }
}

// Get project count
export async function getProjectCount(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::get_project_count`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return Number(parseReturnValue(result.results[0].returnValues[0]));
    }
    return 0;
  } catch (error) {
    console.error('Error getting project count:', error);
    return 0;
  }
}

// Get recent activity by querying blockchain events
export async function getRecentActivity(): Promise<Array<{
  when: string;
  type: string;
  actor: string;
  details: string;
  txStatus: string;
  status: string;
}>> {
  try {
    console.log('🔍 Fetching activity events from package:', PACKAGE_ID);
    
    // Query events from the contract - events are in different modules
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::admin::AdminRoleGranted`
      },
      limit: 10,
      order: 'descending'
    });
    console.log(`📊 AdminRoleGranted events: ${events.data.length}`);

    const adminRevokedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::admin::AdminRoleRevoked`
      },
      limit: 10,
      order: 'descending'
    });
    console.log(`📊 AdminRoleRevoked events: ${adminRevokedEvents.data.length}`);

    const feeWithdrawnEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::admin::PlatformFeesWithdrawn`
      },
      limit: 10,
      order: 'descending'
    });
    console.log(`📊 PlatformFeesWithdrawn events: ${feeWithdrawnEvents.data.length}`);

    const cardCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::card::CardCreated`
      },
      limit: 5,
      order: 'descending'
    });
    console.log(`📊 CardCreated events: ${cardCreatedEvents.data.length}`);

    const projectCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::project::ProjectCreated`
      },
      limit: 10,
      order: 'descending'
    });
    console.log(`📊 ProjectCreated events: ${projectCreatedEvents.data.length}`);

    // Also try querying by package to get all events
    try {
      const packageEvents = await suiClient.queryEvents({
        query: {
          Package: PACKAGE_ID
        },
        limit: 50,
        order: 'descending'
      });
      console.log(`📊 All package events: ${packageEvents.data.length}`);
    } catch (e) {
      console.warn('⚠️ Could not query all package events:', e);
    }

    // Combine and format events
    const activity: Array<{
      when: string;
      type: string;
      actor: string;
      details: string;
      txStatus: string;
      status: string;
    }> = [];

    // Process AdminRoleGranted events
    events.data.forEach((event: any) => {
      activity.push({
        when: new Date(Number(event.timestampMs || 0)).toISOString(),
        type: 'AdminRoleGranted',
        actor: event.parsedJson?.admin || 'Unknown',
        details: `Admin role granted to ${event.parsedJson?.admin || 'Unknown'}`,
        txStatus: 'success',
        status: 'completed'
      });
    });

    // Process AdminRoleRevoked events
    adminRevokedEvents.data.forEach((event: any) => {
      activity.push({
        when: new Date(Number(event.timestampMs || 0)).toISOString(),
        type: 'AdminRoleRevoked',
        actor: event.parsedJson?.admin || 'Unknown',
        details: `Admin role revoked from ${event.parsedJson?.admin || 'Unknown'}`,
        txStatus: 'success',
        status: 'completed'
      });
    });

    // Process PlatformFeesWithdrawn events
    feeWithdrawnEvents.data.forEach((event: any) => {
      activity.push({
        when: new Date(Number(event.timestampMs || 0)).toISOString(),
        type: 'PlatformFeesWithdrawn',
        actor: event.parsedJson?.recipient || 'Unknown',
        details: `Platform fees withdrawn: ${event.parsedJson?.amount || 0} MIST`,
        txStatus: 'success',
        status: 'completed'
      });
    });

    // Process CardCreated events
    cardCreatedEvents.data.forEach((event: any) => {
      activity.push({
        when: new Date(Number(event.timestampMs || 0)).toISOString(),
        type: 'CardCreated',
        actor: event.parsedJson?.owner || 'Unknown',
        details: `Card created: ${event.parsedJson?.card_id || 'Unknown'}`,
        txStatus: 'success',
        status: 'completed'
      });
    });

    // Process ProjectCreated events
    projectCreatedEvents.data.forEach((event: any) => {
      activity.push({
        when: new Date(Number(event.timestampMs || 0)).toISOString(),
        type: 'ProjectCreated',
        actor: event.parsedJson?.owner || 'Unknown',
        details: `Project created: ${event.parsedJson?.project_id || 'Unknown'}`,
        txStatus: 'success',
        status: 'completed'
      });
    });

    // Sort by timestamp (most recent first)
    activity.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    return activity.slice(0, 20); // Return top 20 most recent activities
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

// Get activity statistics
export async function getActivityStats(): Promise<{
  totalEvents: number;
  adminEvents: number;
  feeEvents: number;
  cardEvents: number;
  projectEvents: number;
}> {
  try {
    console.log('🔍 Fetching activity statistics from package:', PACKAGE_ID);
    
    // Query events from the contract - events are in different modules
    const adminGrantedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::admin::AdminRoleGranted`
      },
      limit: 100,
      order: 'descending'
    });

    const adminRevokedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::admin::AdminRoleRevoked`
      },
      limit: 100,
      order: 'descending'
    });

    const feeWithdrawnEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::admin::PlatformFeesWithdrawn`
      },
      limit: 100,
      order: 'descending'
    });

    const cardCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::card::CardCreated`
      },
      limit: 100,
      order: 'descending'
    });

    const projectCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::project::ProjectCreated`
      },
      limit: 100,
      order: 'descending'
    });

    const adminEvents = adminGrantedEvents.data.length + adminRevokedEvents.data.length;
    const feeEvents = feeWithdrawnEvents.data.length;
    const cardEvents = cardCreatedEvents.data.length;
    const projectEvents = projectCreatedEvents.data.length;
    const totalEvents = adminEvents + feeEvents + cardEvents + projectEvents;

    console.log('📊 Activity statistics:', {
      totalEvents,
      adminEvents,
      feeEvents,
      cardEvents,
      projectEvents
    });

    return {
      totalEvents,
      adminEvents,
      feeEvents,
      cardEvents,
      projectEvents
    };
  } catch (error) {
    console.error('Error getting activity statistics:', error);
    return {
      totalEvents: 0,
      adminEvents: 0,
      feeEvents: 0,
      cardEvents: 0,
      projectEvents: 0
    };
  }
}
