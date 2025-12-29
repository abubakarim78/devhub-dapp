import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '../constants';
import { PACKAGE_ID, DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS } from '../constants';
import { parseReturnValue, bytesToHexAddress, parseU64Value } from '../utils';
import { DevCardData, SkillLevel, FeaturedProject, Review, WorkPreferences, SocialLinks } from '../types';

export async function getCardInfo(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      const returnValues = result.results[0].returnValues;
      console.log('Raw decoded data for card', cardId, ':', {
        name: parseReturnValue(returnValues[0]),
        owner: bytesToHexAddress(returnValues[1]),
        niche: parseReturnValue(returnValues[2]),
        imageUrl: parseReturnValue(returnValues[3]),
        about: parseReturnValue(returnValues[4]),
        yearsOfExperience: parseReturnValue(returnValues[5]),
        technologies: parseReturnValue(returnValues[6]),
        portfolio: parseReturnValue(returnValues[7]),
        contact: parseReturnValue(returnValues[8]),
        openToWork: parseReturnValue(returnValues[9]),
        featuredProjects: parseReturnValue(returnValues[10]),
        totalViews: parseReturnValue(returnValues[11]),
        avatarWalrusBlobId: parseReturnValue(returnValues[12])
      });
      // Helper to sanitize string fields (standard cleaning for name, niche, etc.)
      const sanitizeString = (str: any): string => {
        if (typeof str !== 'string') {
          const parsed = parseReturnValue(str);
          if (typeof parsed !== 'string') {
            return '';
          }
          str = parsed;
        }
        // Remove any control characters and trim
        let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
        return cleaned;
      };

      // Enhanced cleaning specifically for the "about" field to remove leading character artifacts
      const sanitizeAboutString = (str: any): string => {
        if (typeof str !== 'string') {
          const parsed = parseReturnValue(str);
          if (typeof parsed !== 'string') {
            return '';
          }
          str = parsed;
        }
        // Start with standard cleaning
        let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
        
        // Remove leading artifacts more aggressively
        // This handles cases like ";Creating", "EBuilding", "3I", etc.
        
        if (cleaned.length > 1) {
          const firstChar = cleaned.charAt(0);
          const secondChar = cleaned.charAt(1);
          const thirdChar = cleaned.length > 2 ? cleaned.charAt(2) : '';
          
          // Check what type of characters we have
          const isSingleDigit = /^\d$/.test(firstChar);
          const isLowercaseLetter = /^[a-z]$/.test(firstChar);
          const isCapitalLetter = /^[A-Z]$/.test(firstChar);
          const isSymbol = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]$/.test(firstChar);
          const isSecondCharCapital = /^[A-Z]$/.test(secondChar);
          const isCommonWordStarter = ['I', 'A', 'T', 'W', 'H', 'Y', 'O', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'U', 'V', 'X', 'Z'].includes(secondChar);
          const isThirdCharWordStart = thirdChar === ' ' || (thirdChar === thirdChar.toLowerCase() && thirdChar !== '' && /^[a-z]$/.test(thirdChar));
          const hasTextAfter = cleaned.length > 2; // There's content after the first two chars
          
          // Priority 1: Remove digits followed by ANY capital letter (like "3I", "4I", "4Design", "5Building")
          if (isSingleDigit && isSecondCharCapital && hasTextAfter) {
            cleaned = cleaned.substring(1).trim();
          }
          // Priority 2: Remove symbols/punctuation followed by capital letter (like ";Creating", "!Building", ":Design")
          else if (isSymbol && isSecondCharCapital && hasTextAfter) {
            cleaned = cleaned.substring(1).trim();
          }
          // Priority 3: Remove single capital letter if followed by another capital letter that starts a word
          // This catches cases like "EBuilding", "IDesign", "ABuilding" where the first letter is an artifact
          else if (isCapitalLetter && isSecondCharCapital && hasTextAfter) {
            // Additional check: if the second char is a common word starter, it's likely an artifact
            // Also check if third char is lowercase (indicating a word start) or space
            if (isCommonWordStarter && (isThirdCharWordStart || thirdChar === '')) {
              cleaned = cleaned.substring(1).trim();
            }
          }
          // Priority 4: Remove lowercase letter + capital letter if it looks like an artifact
          // This catches cases like "cI", "dA", etc. where first char is clearly not part of the word
          else if (
            isLowercaseLetter && 
            isSecondCharCapital && 
            isCommonWordStarter && 
            isThirdCharWordStart &&
            hasTextAfter
          ) {
            cleaned = cleaned.substring(1).trim();
          }
        }

        // Remove any non-printable Unicode characters and invalid UTF-8 sequences
        cleaned = cleaned
          .split('')
          .filter((char: string) => {
            const code = char.charCodeAt(0);
            // Keep printable ASCII (32-126), common whitespace, and valid Unicode letters/numbers
            return (
              (code >= 32 && code <= 126) || // Printable ASCII
              code === 10 || // Line feed
              code === 13 || // Carriage return
              (code >= 160 && code <= 255) || // Latin-1 Supplement
              (code >= 0x00A0 && code <= 0x024F) || // Latin Extended
              (code >= 0x2000 && code <= 0x206F) || // General Punctuation
              (code >= 0x20A0 && code <= 0x20CF) || // Currency Symbols
              /\p{L}|\p{N}|\p{P}|\p{Z}/u.test(char) // Unicode letters, numbers, punctuation, separators
            );
          })
          .join('')
          .trim();
        
        return cleaned;
      };

      // Parse the returned values according to the contract's return structure
      // Use aggressive cleaning only for the "about" field
      const aboutValue = sanitizeAboutString(returnValues[4]);
      const cardData: DevCardData = {
        id: cardId,
        name: sanitizeString(returnValues[0]),
        owner: bytesToHexAddress(returnValues[1]),
        niche: sanitizeString(returnValues[2]),
        about: aboutValue,
        description: aboutValue, // Using about as description
        imageUrl: sanitizeString(returnValues[3]),
        avatarWalrusBlobId: sanitizeString(returnValues[12]),
        skills: [], // Will be fetched separately if needed
        yearsOfExperience: Number(parseReturnValue(returnValues[5])),
        technologies: sanitizeString(returnValues[6]),
        workPreferences: {
          workTypes: [],
          hourlyRate: undefined,
          locationPreference: '',
          availability: '',
        },
        contact: sanitizeString(returnValues[8]),
        socialLinks: {
          github: undefined,
          linkedin: undefined,
          twitter: undefined,
          personalWebsite: undefined,
        },
        portfolio: sanitizeString(returnValues[7]),
        featuredProjects: (() => {
          const raw = parseReturnValue(returnValues[10]);
          if (!raw) return [];
          if (typeof raw === 'string') {
            try {
              return [JSON.parse(raw) as FeaturedProject];
            } catch {
              return [];
            }
          }
          if (Array.isArray(raw)) {
            return raw
              .map((item: any) => {
                if (typeof item === 'string') {
                  try {
                    return JSON.parse(item) as FeaturedProject;
                  } catch {
                    return null;
                  }
                }
                return null;
              })
              .filter((p: FeaturedProject | null): p is FeaturedProject => p !== null);
          }
          return [];
        })(),
        languages: [],
        openToWork: Boolean(parseReturnValue(returnValues[9])),
        isActive: true, // Default to active for existing cards
        verified: false,
        reviews: [],
        createdAt: 0,
        lastUpdated: 0,
        analytics: {
          totalViews: Number(parseReturnValue(returnValues[12])),
          profileViews: 0,
          contactClicks: 0,
          projectApplications: 0,
          totalReviews: 0,
          averageRating: 0,
          lastViewReset: 0,
        },
      };
      return cardData;
    }
    return null;
  } catch (error) {
    console.error('Error getting card info:', error);
    return null;
  }
}

// Get card skills
export async function getCardSkills(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_SKILLS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as SkillLevel[];
    }
    return [];
  } catch (error) {
    console.error('Error getting card skills:', error);
    return [];
  }
}

// Get card reviews
export async function getCardReviews(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_REVIEWS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (!result.results?.[0]?.returnValues) {
      console.warn(`⚠️ No return values for reviews for card ${cardId}`);
      return [];
    }

    // Get the raw returnValue first to check its structure
    const rawReturnValue = result.results[0].returnValues[0];

    console.log(`🔍 Raw returnValue for reviews card ${cardId}:`, {
      raw: rawReturnValue,
      type: typeof rawReturnValue,
      isArray: Array.isArray(rawReturnValue),
      length: Array.isArray(rawReturnValue) ? rawReturnValue.length : 'N/A',
      keys: typeof rawReturnValue === 'object' && rawReturnValue !== null ? Object.keys(rawReturnValue).slice(0, 20) : 'N/A',
      stringified: typeof rawReturnValue === 'object' && rawReturnValue !== null && Object.keys(rawReturnValue).length < 100
        ? JSON.stringify(rawReturnValue, null, 2)
        : 'Too large to stringify',
    });

    // Check if rawReturnValue is [bcsBytes, type] format
    let actualData: any = rawReturnValue;
    if (Array.isArray(rawReturnValue) && rawReturnValue.length === 2) {
      const [bcsBytes, type] = rawReturnValue;
      console.log(`🔍 Found [bcsBytes, type] format - type: ${type}`);
      actualData = bcsBytes;
    }

    // Try parseReturnValue, but also check the raw data
    const parsedValue = parseReturnValue(rawReturnValue);

    console.log(`🔍 Parsed returnValue for reviews card ${cardId}:`, {
      parsed: parsedValue,
      type: typeof parsedValue,
      isArray: Array.isArray(parsedValue),
      length: Array.isArray(parsedValue) ? parsedValue.length : 'N/A',
      actualData: actualData,
      actualDataType: typeof actualData,
      actualDataIsArray: Array.isArray(actualData),
    });

    // Check if actualData is a byte array (array of numbers) - this is BCS-encoded data
    const isActualDataByteArray = Array.isArray(actualData) &&
      actualData.length > 0 &&
      typeof actualData[0] === 'number' &&
      actualData.length > 10;

    // Use actualData if it's a byte array, otherwise use parsedValue
    const dataToParse = isActualDataByteArray ? actualData : parsedValue;

    console.log(`🔍 Data selection:`, {
      isActualDataByteArray,
      actualDataLength: Array.isArray(actualData) ? actualData.length : 'N/A',
      dataToParseType: typeof dataToParse,
      dataToParseIsArray: Array.isArray(dataToParse),
      dataToParseLength: Array.isArray(dataToParse) ? dataToParse.length : 'N/A',
    });

    // Check if dataToParse itself is BCS-encoded (object with numeric keys, not an array)
    const isParsedValueBCS = typeof dataToParse === 'object' && dataToParse !== null &&
      !Array.isArray(dataToParse) &&
      Object.keys(dataToParse).every(key => !isNaN(Number(key))) &&
      Object.keys(dataToParse).length > 10;

    // Check if dataToParse is a byte array (array of numbers) - this is BCS-encoded
    const isDataToParseByteArray = Array.isArray(dataToParse) &&
      dataToParse.length > 0 &&
      typeof dataToParse[0] === 'number' &&
      dataToParse.length > 10;

    console.log(`🔍 Checking BCS encoding:`, {
      isParsedValueBCS,
      isDataToParseByteArray,
      dataToParseType: typeof dataToParse,
      dataToParseIsArray: Array.isArray(dataToParse),
      keysCount: typeof dataToParse === 'object' && dataToParse !== null ? Object.keys(dataToParse).length : 0,
    });

    // Handle byte array (BCS-encoded vector<Review>)
    if (isDataToParseByteArray) {
      console.log(`🔍 Detected byte array format (BCS-encoded vector<Review>)`);
      const byteArray = dataToParse as number[];
      console.log(`🔍 Byte array length: ${byteArray.length}`, byteArray.slice(0, 50));

      // Parse BCS-encoded vector<Review>
      // Format: [vector_length (uleb128), review1, review2, ...]
      let index = 0;
      const reviews: Review[] = [];

      // Read vector length (uleb128)
      let vectorLength = 0;
      let shift = 0;
      while (index < byteArray.length) {
        const byte = byteArray[index++];
        vectorLength |= (byte & 0x7F) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }
      console.log(`🔍 Vector length: ${vectorLength}`);

      // Parse each review
      for (let reviewIdx = 0; reviewIdx < vectorLength && index < byteArray.length; reviewIdx++) {
        console.log(`🔍 Parsing review ${reviewIdx}, starting at byte index ${index}`);

        // Read reviewer address (32 bytes)
        if (index + 32 > byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for reviewer address`);
          break;
        }
        const reviewerBytes = byteArray.slice(index, index + 32);
        const reviewer = bytesToHexAddress(reviewerBytes);
        index += 32;
        console.log(`🔍 Review ${reviewIdx} Reviewer: ${reviewer}`);

        // Read rating (1 byte, u8)
        if (index >= byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for rating`);
          break;
        }
        const rating = byteArray[index++];
        console.log(`🔍 Review ${reviewIdx} Rating: ${rating}`);

        // Read review_text Option<String> (1 byte flag + if Some: length + bytes)
        let review_text: string | undefined = undefined;
        if (index >= byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for review_text flag`);
          break;
        }
        const hasText = byteArray[index++] === 1; // 0 = None, 1 = Some
        if (hasText) {
          // Read string length (uleb128)
          let strLength = 0;
          shift = 0;
          while (index < byteArray.length) {
            const byte = byteArray[index++];
            strLength |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
          }
          // Read string bytes
          if (index + strLength > byteArray.length) {
            console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for review text (need ${strLength}, have ${byteArray.length - index})`);
            break;
          }
          const textBytes = byteArray.slice(index, index + strLength);
          review_text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
          index += strLength;
          console.log(`🔍 Review ${reviewIdx} Review text: "${review_text}"`);
        } else {
          console.log(`🔍 Review ${reviewIdx} Review text: None`);
        }

        // Read timestamp (8 bytes, u64 little-endian)
        if (index + 8 > byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for timestamp`);
          break;
        }
        let timestamp = 0n;
        for (let j = 0; j < 8; j++) {
          timestamp += BigInt(byteArray[index + j]) << BigInt(j * 8);
        }
        index += 8;
        const timestampNum = Number(timestamp);
        console.log(`🔍 Review ${reviewIdx} Timestamp: ${timestampNum} (${new Date(timestampNum).toISOString()})`);

        reviews.push({
          reviewer,
          rating,
          review_text,
          timestamp: timestampNum,
        });
      }

      console.log(`✅ Successfully parsed ${reviews.length} reviews from byte array`);
      return reviews;
    } else if (isParsedValueBCS) {
      console.log(`🔍 dataToParse itself is BCS-encoded vector<Review> (object with numeric keys)`);
      // The entire dataToParse is a BCS-encoded vector<Review>
      // Convert to byte array
      const byteArray: number[] = [];
      const keys = Object.keys(dataToParse).map(Number).sort((a, b) => a - b);
      for (const key of keys) {
        byteArray.push(Number(dataToParse[key]));
      }
      console.log(`🔍 Converted to byte array, length: ${byteArray.length}`, byteArray.slice(0, 50));

      // Parse BCS-encoded vector<Review>
      // Format: [vector_length (uleb128), review1, review2, ...]
      let index = 0;
      const reviews: Review[] = [];

      // Read vector length (uleb128)
      let vectorLength = 0;
      let shift = 0;
      while (index < byteArray.length) {
        const byte = byteArray[index++];
        vectorLength |= (byte & 0x7F) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }
      console.log(`🔍 Vector length: ${vectorLength}`);

      // Parse each review
      for (let reviewIdx = 0; reviewIdx < vectorLength && index < byteArray.length; reviewIdx++) {
        console.log(`🔍 Parsing review ${reviewIdx}, starting at byte index ${index}`);

        // Read reviewer address (32 bytes)
        if (index + 32 > byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for reviewer address`);
          break;
        }
        const reviewerBytes = byteArray.slice(index, index + 32);
        const reviewer = bytesToHexAddress(reviewerBytes);
        index += 32;
        console.log(`🔍 Review ${reviewIdx} Reviewer: ${reviewer}`);

        // Read rating (1 byte, u8)
        if (index >= byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for rating`);
          break;
        }
        const rating = byteArray[index++];
        console.log(`🔍 Review ${reviewIdx} Rating: ${rating}`);

        // Read review_text Option<String> (1 byte flag + if Some: length + bytes)
        let review_text: string | undefined = undefined;
        if (index >= byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for review_text flag`);
          break;
        }
        const hasText = byteArray[index++] === 1; // 0 = None, 1 = Some
        if (hasText) {
          // Read string length (uleb128)
          let strLength = 0;
          shift = 0;
          while (index < byteArray.length) {
            const byte = byteArray[index++];
            strLength |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
          }
          // Read string bytes
          if (index + strLength > byteArray.length) {
            console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for review text (need ${strLength}, have ${byteArray.length - index})`);
            break;
          }
          const textBytes = byteArray.slice(index, index + strLength);
          review_text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
          index += strLength;
          console.log(`🔍 Review ${reviewIdx} Review text: "${review_text}"`);
        } else {
          console.log(`🔍 Review ${reviewIdx} Review text: None`);
        }

        // Read timestamp (8 bytes, u64 little-endian)
        if (index + 8 > byteArray.length) {
          console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for timestamp`);
          break;
        }
        let timestamp = 0n;
        for (let j = 0; j < 8; j++) {
          timestamp += BigInt(byteArray[index + j]) << BigInt(j * 8);
        }
        index += 8;
        const timestampNum = Number(timestamp);
        console.log(`🔍 Review ${reviewIdx} Timestamp: ${timestampNum} (${new Date(timestampNum).toISOString()})`);

        reviews.push({
          reviewer,
          rating,
          review_text,
          timestamp: timestampNum,
        });
      }

      console.log(`✅ Successfully parsed ${reviews.length} reviews from BCS-encoded vector`);
      return reviews;
    }

    // If parseReturnValue gave us an array, try to use it directly
    if (Array.isArray(dataToParse) && dataToParse.length > 0) {
      // Check if it looks like review data
      const firstItem = dataToParse[0];

      // Check if the first item is a BCS-encoded byte array (object with numeric keys)
      // Also check if it's a string that looks like a type name (vector<...::Review>)
      const isBCSEncoded = (typeof firstItem === 'object' && firstItem !== null &&
        !Array.isArray(firstItem) &&
        Object.keys(firstItem).every(key => !isNaN(Number(key))) &&
        Object.keys(firstItem).length > 10) ||
        (typeof firstItem === 'string' && firstItem.includes('vector') && firstItem.includes('Review'));

      if (isBCSEncoded) {
        console.log(`🔍 Detected BCS-encoded review data (object with numeric keys)`);
        // Each element in parsedValue is a BCS-encoded Review struct
        // Convert each object with numeric keys to byte array and parse
        const reviews: Review[] = [];

        for (let reviewIdx = 0; reviewIdx < parsedValue.length; reviewIdx++) {
          const reviewItem = parsedValue[reviewIdx];
          console.log(`🔍 Processing review ${reviewIdx}`);

          // Convert object with numeric keys to byte array
          const byteArray: number[] = [];
          const keys = Object.keys(reviewItem).map(Number).sort((a, b) => a - b);
          for (const key of keys) {
            byteArray.push(Number(reviewItem[key]));
          }
          console.log(`🔍 Converted review ${reviewIdx} to byte array, length: ${byteArray.length}`);

          // Parse BCS-encoded Review struct
          // Format: [reviewer (32 bytes), rating (1 byte), review_text (Option<String>), timestamp (8 bytes)]
          let index = 0;

          // Read reviewer address (32 bytes)
          if (index + 32 > byteArray.length) {
            console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for reviewer address`);
            continue;
          }
          const reviewerBytes = byteArray.slice(index, index + 32);
          const reviewer = bytesToHexAddress(reviewerBytes);
          index += 32;
          console.log(`🔍 Review ${reviewIdx} Reviewer: ${reviewer}`);

          // Read rating (1 byte, u8)
          if (index >= byteArray.length) {
            console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for rating`);
            continue;
          }
          const rating = byteArray[index++];
          console.log(`🔍 Review ${reviewIdx} Rating: ${rating}`);

          // Read review_text Option<String> (1 byte flag + if Some: length + bytes)
          let review_text: string | undefined = undefined;
          if (index >= byteArray.length) {
            console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for review_text flag`);
            continue;
          }
          const hasText = byteArray[index++] === 1; // 0 = None, 1 = Some
          if (hasText) {
            // Read string length (uleb128)
            let strLength = 0;
            let shift = 0;
            while (index < byteArray.length) {
              const byte = byteArray[index++];
              strLength |= (byte & 0x7F) << shift;
              if ((byte & 0x80) === 0) break;
              shift += 7;
            }
            // Read string bytes
            if (index + strLength > byteArray.length) {
              console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for review text (need ${strLength}, have ${byteArray.length - index})`);
              continue;
            }
            const textBytes = byteArray.slice(index, index + strLength);
            review_text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
            index += strLength;
            console.log(`🔍 Review ${reviewIdx} Review text: "${review_text}"`);
          } else {
            console.log(`🔍 Review ${reviewIdx} Review text: None`);
          }

          // Read timestamp (8 bytes, u64 little-endian)
          if (index + 8 > byteArray.length) {
            console.warn(`⚠️ Review ${reviewIdx}: Not enough bytes for timestamp`);
            continue;
          }
          let timestamp = 0n;
          for (let j = 0; j < 8; j++) {
            timestamp += BigInt(byteArray[index + j]) << BigInt(j * 8);
          }
          index += 8;
          const timestampNum = Number(timestamp);
          console.log(`🔍 Review ${reviewIdx} Timestamp: ${timestampNum} (${new Date(timestampNum).toISOString()})`);

          reviews.push({
            reviewer,
            rating,
            review_text,
            timestamp: timestampNum,
          });
        }

        console.log(`✅ Successfully parsed ${reviews.length} reviews from BCS-encoded data`);
        return reviews;
      } else if (typeof firstItem === 'object' && firstItem !== null) {
        console.log(`🔍 First review item structure:`, firstItem);
        // Try to parse as Review objects
        const reviews = dataToParse.map((reviewData: any, idx: number) => {
          console.log(`🔍 Processing review ${idx}:`, reviewData);
          console.log(`🔍 Review data keys:`, Object.keys(reviewData || {}));
          console.log(`🔍 Review data full structure:`, JSON.stringify(reviewData, null, 2));

          let reviewer: string = '';
          let rating: number = 0;
          let review_text: string | undefined = undefined;
          let timestamp: number = 0;

          if (typeof reviewData === 'object' && reviewData !== null) {
            // Try all possible field name variations
            // Reviewer field: reviewer, Reviewer, reviewer_address, etc.
            const reviewerField = reviewData.reviewer || reviewData.Reviewer || reviewData.reviewer_address || reviewData[0];
            if (reviewerField !== undefined && reviewerField !== null) {
              reviewer = bytesToHexAddress(reviewerField);
              console.log(`🔍 Extracted reviewer:`, reviewer, `from field:`, reviewerField);
            }

            // Rating field: rating, Rating (should be u8, 1-5)
            const ratingField = reviewData.rating !== undefined ? reviewData.rating :
              reviewData.Rating !== undefined ? reviewData.Rating :
                reviewData[1];
            if (ratingField !== undefined && ratingField !== null) {
              const ratingNum = Number(ratingField);
              // Rating should be 1-5, if it's larger it might be in wrong field
              if (ratingNum >= 1 && ratingNum <= 5) {
                rating = ratingNum;
              } else {
                console.warn(`⚠️ Rating ${ratingNum} is out of range (1-5), might be wrong field`);
                rating = ratingNum; // Still use it but log warning
              }
              console.log(`🔍 Extracted rating:`, rating, `from field:`, ratingField);
            }

            // Review text field: review_text, reviewText, ReviewText, review_text_option, etc.
            const reviewTextField = reviewData.review_text !== undefined ? reviewData.review_text :
              reviewData.reviewText !== undefined ? reviewData.reviewText :
                reviewData.ReviewText !== undefined ? reviewData.ReviewText :
                  reviewData.review_text_option !== undefined ? reviewData.review_text_option :
                    reviewData[2];
            if (reviewTextField !== undefined && reviewTextField !== null) {
              if (typeof reviewTextField === 'object' && reviewTextField !== null) {
                if (reviewTextField.Some !== undefined) {
                  review_text = safeDecodeText(reviewTextField.Some);
                } else if (reviewTextField.some !== undefined) {
                  review_text = safeDecodeText(reviewTextField.some);
                } else {
                  review_text = safeDecodeText(reviewTextField);
                }
              } else if (typeof reviewTextField === 'string') {
                review_text = reviewTextField;
              } else {
                review_text = safeDecodeText(reviewTextField);
              }
              console.log(`🔍 Extracted review_text:`, review_text, `from field:`, reviewTextField);
            }

            // Timestamp field: timestamp, Timestamp, time, Time, etc.
            const timestampField = reviewData.timestamp !== undefined ? reviewData.timestamp :
              reviewData.Timestamp !== undefined ? reviewData.Timestamp :
                reviewData.time !== undefined ? reviewData.time :
                  reviewData.Time !== undefined ? reviewData.Time :
                    reviewData[3];
            if (timestampField !== undefined && timestampField !== null) {
              timestamp = Number(timestampField);
              // Check if timestamp is reasonable (not epoch 0)
              if (timestamp === 0) {
                console.warn(`⚠️ Timestamp is 0 (epoch), might be wrong field or uninitialized`);
              }
              console.log(`🔍 Extracted timestamp:`, timestamp, `(${new Date(timestamp).toISOString()})`, `from field:`, timestampField);
            }

            // If we still don't have the fields, try array access
            if (!reviewer && Array.isArray(reviewData)) {
              reviewer = bytesToHexAddress(reviewData[0]);
              rating = Number(reviewData[1] || 0);
              if (reviewData[2]) {
                if (typeof reviewData[2] === 'object' && reviewData[2].Some !== undefined) {
                  review_text = safeDecodeText(reviewData[2].Some);
                } else {
                  review_text = safeDecodeText(reviewData[2]);
                }
              }
              timestamp = Number(reviewData[3] || 0);
              console.log(`🔍 Used array access for review ${idx}`);
            }
          } else if (Array.isArray(reviewData)) {
            // Array format: [reviewer, rating, review_text, timestamp]
            reviewer = bytesToHexAddress(reviewData[0]);
            rating = Number(reviewData[1] || 0);
            if (reviewData[2]) {
              if (typeof reviewData[2] === 'object' && reviewData[2].Some !== undefined) {
                review_text = safeDecodeText(reviewData[2].Some);
              } else if (typeof reviewData[2] === 'string') {
                review_text = reviewData[2];
              } else {
                review_text = safeDecodeText(reviewData[2]);
              }
            }
            timestamp = Number(reviewData[3] || 0);
            console.log(`🔍 Used direct array access for review ${idx}`);
          }

          console.log(`✅ Final parsed review ${idx}:`, { reviewer, rating, review_text, timestamp });

          return {
            reviewer,
            rating,
            review_text,
            timestamp,
          } as Review;
        }).filter((review: Review) => {
          const isValid = review.reviewer && review.rating > 0;
          if (!isValid) {
            console.warn(`⚠️ Filtered out invalid review:`, review);
          }
          return isValid;
        });

        console.log(`✅ Successfully parsed ${reviews.length} reviews using parseReturnValue`);
        return reviews;
      }
    }

    // Fallback to manual parsing if parseReturnValue didn't work
    const returnValue = result.results[0].returnValues[0];

    console.log(`🔍 Fallback: Raw returnValue for reviews card ${cardId}:`, {
      raw: returnValue,
      type: typeof returnValue,
      isArray: Array.isArray(returnValue),
      length: Array.isArray(returnValue) ? returnValue.length : 'N/A',
      isUint8Array: returnValue instanceof Uint8Array,
      stringified: JSON.stringify(returnValue, null, 2),
    });

    // Handle [bcsBytes, type] format where bcsBytes is Uint8Array
    let reviewsRaw: any = returnValue;
    if (Array.isArray(returnValue) && returnValue.length === 2) {
      const [bcsBytes, type] = returnValue;
      console.log(`🔍 Found [bcsBytes, type] format - type: ${type}, bcsBytes:`, bcsBytes);
      if (bcsBytes instanceof Uint8Array || Array.isArray(bcsBytes)) {
        reviewsRaw = bcsBytes;
      } else {
        reviewsRaw = bcsBytes;
      }
    } else if (returnValue instanceof Uint8Array) {
      console.log(`🔍 Found Uint8Array format`);
      reviewsRaw = Array.from(returnValue);
    }

    console.log(`🔍 Processed reviewsRaw for card ${cardId}:`, {
      raw: reviewsRaw,
      type: typeof reviewsRaw,
      isArray: Array.isArray(reviewsRaw),
      length: Array.isArray(reviewsRaw) ? reviewsRaw.length : 'N/A',
    });

    let reviews: Review[] = [];

    // Try different ways to extract the vector data
    let vectorData: any = null;

    // Method 1: Check if it's in [type, data] format (BCS encoded)
    if (Array.isArray(reviewsRaw) && reviewsRaw.length === 2) {
      const [type, data] = reviewsRaw;
      console.log(`🔍 Found [type, data] format - type: ${type}, data:`, data);
      vectorData = data;
    }
    // Method 2: Check if it's directly the array
    else if (Array.isArray(reviewsRaw)) {
      console.log(`🔍 Found direct array format`);
      vectorData = reviewsRaw;
    }
    // Method 3: Check if it's nested as [data]
    else if (reviewsRaw && typeof reviewsRaw === 'object') {
      console.log(`🔍 Found object format, checking nested structure`);
      if (Array.isArray(reviewsRaw[0])) {
        vectorData = reviewsRaw[0];
      } else {
        vectorData = reviewsRaw;
      }
    }

    console.log(`🔍 Extracted vectorData:`, {
      vectorData,
      type: typeof vectorData,
      isArray: Array.isArray(vectorData),
      length: Array.isArray(vectorData) ? vectorData.length : 'N/A',
    });

    // Parse the vector data
    if (vectorData && Array.isArray(vectorData)) {
      console.log(`🔍 Processing reviews array with ${vectorData.length} elements`);

      // Check if it's a nested structure (BCS encoding - each element is a Review struct)
      if (vectorData.length > 0 && Array.isArray(vectorData[0])) {
        console.log(`🔍 Found nested array structure (BCS encoding)`);
        // Each element should be a Review struct: {reviewer: address, rating: u8, review_text: Option<String>, timestamp: u64}
        reviews = vectorData.map((reviewData: any, idx: number) => {
          console.log(`🔍 Processing review element ${idx}:`, reviewData, `type:`, typeof reviewData);

          // Review struct format: {reviewer, rating, review_text, timestamp}
          // The data might be in different formats depending on BCS encoding
          let reviewer: string = '';
          let rating: number = 0;
          let review_text: string | undefined = undefined;
          let timestamp: number = 0;

          // Try to extract fields from the review data
          if (typeof reviewData === 'object' && reviewData !== null) {
            // If it's an object with fields (could be named fields or array indices)
            if (reviewData.reviewer !== undefined) {
              // Named fields
              reviewer = bytesToHexAddress(reviewData.reviewer);
              rating = Number(reviewData.rating || 0);
              if (reviewData.review_text) {
                if (typeof reviewData.review_text === 'object' && reviewData.review_text.Some !== undefined) {
                  review_text = safeDecodeText(reviewData.review_text.Some);
                } else if (typeof reviewData.review_text === 'string') {
                  review_text = reviewData.review_text;
                } else {
                  review_text = safeDecodeText(reviewData.review_text);
                }
              }
              timestamp = Number(reviewData.timestamp || 0);
            } else if (Array.isArray(reviewData)) {
              // Array format: [reviewer, rating, review_text, timestamp]
              reviewer = bytesToHexAddress(reviewData[0]);
              rating = Number(reviewData[1] || 0);
              if (reviewData[2]) {
                if (typeof reviewData[2] === 'object' && reviewData[2].Some !== undefined) {
                  review_text = safeDecodeText(reviewData[2].Some);
                } else if (typeof reviewData[2] === 'string') {
                  review_text = reviewData[2];
                } else {
                  review_text = safeDecodeText(reviewData[2]);
                }
              }
              timestamp = Number(reviewData[3] || 0);
            } else {
              // Try indexed access
              reviewer = bytesToHexAddress(reviewData[0] || reviewData.reviewer || '');
              rating = Number(reviewData[1] || reviewData.rating || 0);
              const reviewTextRaw = reviewData[2] || reviewData.review_text;
              if (reviewTextRaw) {
                if (typeof reviewTextRaw === 'object' && reviewTextRaw.Some !== undefined) {
                  review_text = safeDecodeText(reviewTextRaw.Some);
                } else if (typeof reviewTextRaw === 'string') {
                  review_text = reviewTextRaw;
                } else {
                  review_text = safeDecodeText(reviewTextRaw);
                }
              }
              timestamp = Number(reviewData[3] || reviewData.timestamp || 0);
            }
          } else if (Array.isArray(reviewData)) {
            // If it's an array, try to parse as [reviewer, rating, review_text, timestamp]
            reviewer = bytesToHexAddress(reviewData[0]);
            rating = Number(reviewData[1] || 0);
            if (reviewData[2]) {
              if (typeof reviewData[2] === 'object' && reviewData[2].Some !== undefined) {
                review_text = safeDecodeText(reviewData[2].Some);
              } else if (typeof reviewData[2] === 'string') {
                review_text = reviewData[2];
              } else {
                review_text = safeDecodeText(reviewData[2]);
              }
            }
            timestamp = Number(reviewData[3] || 0);
          }

          console.log(`✅ Parsed review ${idx}:`, { reviewer, rating, review_text, timestamp });

          return {
            reviewer,
            rating,
            review_text,
            timestamp,
          } as Review;
        }).filter((review: Review) => {
          const isValid = review.reviewer && review.rating > 0;
          if (!isValid) {
            console.warn(`⚠️ Filtered out invalid review:`, review);
          }
          return isValid;
        });
      } else {
        console.log(`🔍 Found flat array structure - might be BCS-encoded`);
        // This might be BCS-encoded flat array similar to languages
        // For now, try to parse as structured data
        // If the first element is a number, it might be the vector length
        if (vectorData.length > 0 && typeof vectorData[0] === 'number' && vectorData[0] < 100) {
          console.log(`🔍 Detected BCS-encoded format with numbers`);
          // This is more complex - BCS encoding of structs is nested
          // For now, return empty and log for debugging
          console.warn(`⚠️ BCS-encoded struct parsing not fully implemented, raw data:`, vectorData);
          reviews = [];
        } else {
          // Try to parse as array of objects
          reviews = vectorData.map((reviewData: any, idx: number) => {
            console.log(`🔍 Processing review element ${idx}:`, reviewData);

            if (typeof reviewData === 'object' && reviewData !== null) {
              return {
                reviewer: bytesToHexAddress(reviewData.reviewer || reviewData[0] || ''),
                rating: Number(reviewData.rating || reviewData[1] || 0),
                review_text: reviewData.review_text || reviewData[2] ? safeDecodeText(reviewData.review_text || reviewData[2]) : undefined,
                timestamp: Number(reviewData.timestamp || reviewData[3] || 0),
              } as Review;
            }
            return null;
          }).filter((review: Review | null): review is Review => review !== null && Boolean(review.reviewer) && review.rating > 0);
        }
      }
    } else if (vectorData === null || vectorData === undefined) {
      console.warn(`⚠️ VectorData is null/undefined for reviews card ${cardId}`);
      reviews = [];
    } else {
      console.warn(`⚠️ Reviews has unexpected format for card ${cardId}:`, vectorData, `type:`, typeof vectorData);
      reviews = [];
    }

    console.log(`✅ Parsed reviews for card ${cardId}:`, reviews);
    return reviews;
  } catch (error) {
    console.error('Error getting card reviews:', error);
    return [];
  }
}
export async function getDetailedAnalytics(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_DETAILED_ANALYTICS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log(`🔍 Raw analytics result for card ${cardId}:`, result);

    if (result.results?.[0]?.returnValues) {
      const returnValues = result.results[0].returnValues;
      console.log(`🔍 Analytics returnValues for card ${cardId}:`, returnValues);
      console.log(`🔍 Analytics returnValues count: ${returnValues.length}`);

      // Extract the actual values from [value, type] format if needed
      const extractValue = (rv: any, index: number, isProfileViews: boolean = false): number => {
        console.log(`🔍 Extracting analytics value ${index}:`, rv);

        let parsedValue: number;

        // If it's [value, type] format, extract the value
        if (Array.isArray(rv) && rv.length === 2) {
          const [value, type] = rv;
          console.log(`🔍 Found [value, type] format - value:`, value, 'type:', type);

          // If value is a byte array, parse it as u64
          if (Array.isArray(value) && typeof value[0] === 'number') {
            parsedValue = parseU64Value(value);
          } else if (typeof value === 'number') {
            parsedValue = value;
          } else if (typeof value === 'string') {
            const parsed = Number(value);
            parsedValue = isNaN(parsed) ? 0 : parsed;
          } else {
            // Try parsing the value as u64
            parsedValue = parseU64Value(value);
          }
        } else {
          // If it's just a value, parse it as u64
          parsedValue = parseU64Value(rv);
        }

        // Validate profileViews - if it's unreasonably large (likely a parsing error or default value), reset to 0
        // Profile views should be reasonable (e.g., less than 1 million for a single card)
        if (isProfileViews && (parsedValue > 1000000 || isNaN(parsedValue) || parsedValue < 0)) {
          console.warn(`⚠️ Invalid profileViews value detected: ${parsedValue}, resetting to 0`);
          return 0;
        }

        return parsedValue;
      };

      const rawProfileViews = extractValue(returnValues[1], 1, true); // Mark as profileViews for validation
      console.log(`🔍 getDetailedAnalytics - Raw profileViews extracted for card ${cardId}:`, rawProfileViews);
      console.log(`🔍 getDetailedAnalytics - Return value [1] for card ${cardId}:`, returnValues[1]);

      const analytics = {
        totalViews: extractValue(returnValues[0], 0),
        profileViews: rawProfileViews,
        contactClicks: extractValue(returnValues[2], 2),
        projectApplications: extractValue(returnValues[3], 3),
        totalReviews: extractValue(returnValues[4], 4),
        averageRating: extractValue(returnValues[5], 5),
      };

      console.log(`✅ Parsed analytics for card ${cardId}:`, analytics);
      console.log(`🔍 Final profileViews value for card ${cardId}: ${analytics.profileViews}`);
      return analytics;
    }

    console.warn(`⚠️ No return values found for analytics card ${cardId}`);
    return null;
  } catch (error) {
    console.error(`❌ Error getting detailed analytics for card ${cardId}:`, error);
    return null;
  }
}
// Get work preferences
export async function getWorkPreferences(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_WORK_PREFERENCES}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log(`🔍 Raw work preferences result for card ${cardId}:`, result);

    if (!result.results?.[0]?.returnValues) {
      console.warn(`⚠️ No return values for work preferences for card ${cardId}`);
      return null;
    }

    const returnValues = result.results[0].returnValues;
    console.log(`🔍 Work preferences returnValues for card ${cardId}:`, returnValues);
    console.log(`🔍 ReturnValues count: ${returnValues.length}`);

    // WorkPreferences struct has 4 fields:
    // 1. work_types: vector<String>
    // 2. hourly_rate: Option<u64>
    // 3. location_preference: String
    // 4. availability: String

    // Check if struct is returned as a single value with fields property
    let structData: any = null;
    const firstReturnValue = returnValues[0];

    // Check if it's [bcsBytes, type] format
    if (Array.isArray(firstReturnValue) && firstReturnValue.length === 2 && typeof firstReturnValue[1] === 'string') {
      // Try to parse the struct from the byte array or use the parsed value
      structData = parseReturnValue(firstReturnValue);
    } else {
      structData = parseReturnValue(firstReturnValue);
    }

    console.log(`🔍 Parsed structData:`, structData);

    // Check if structData has a fields property (Move struct format)
    if (structData && typeof structData === 'object' && structData.fields) {
      console.log(`🔍 Found struct with fields property:`, structData.fields);
      structData = structData.fields;
    }

    // If structData is an object with the field names, use it directly
    // Otherwise, assume returnValues array contains fields in order
    let workTypesRaw: any;
    let hourlyRateRaw: any;
    let locationPreferenceRaw: any;
    let availabilityRaw: any;

    if (structData && typeof structData === 'object' && !Array.isArray(structData)) {
      // Struct fields are in an object
      workTypesRaw = structData.work_types || structData.workTypes;
      hourlyRateRaw = structData.hourly_rate || structData.hourlyRate;
      locationPreferenceRaw = structData.location_preference || structData.locationPreference;
      availabilityRaw = structData.availability;
      console.log(`🔍 Extracted from struct object:`, { workTypesRaw, hourlyRateRaw, locationPreferenceRaw, availabilityRaw });
    } else if (returnValues.length >= 4) {
      // Struct fields are in returnValues array in order
      workTypesRaw = returnValues[0];
      hourlyRateRaw = returnValues[1];
      locationPreferenceRaw = returnValues[2];
      availabilityRaw = returnValues[3];
      console.log(`🔍 Using returnValues array:`, { workTypesRaw, hourlyRateRaw, locationPreferenceRaw, availabilityRaw });
    } else {
      // The struct is in the first returnValue as a single BCS-encoded struct
      // We need to parse the entire struct from the byte array
      workTypesRaw = returnValues[0];
      console.log(`🔍 Struct is BCS-encoded in first returnValue`);
    }

    // Parse the entire BCS-encoded struct from the byte array
    let workTypes: string[] = [];
    let hourlyRate: number | undefined = undefined;
    let locationPreference: string = '';
    let availability: string = '';

    console.log(`🔍 Raw work_types/struct:`, workTypesRaw);

    if (Array.isArray(workTypesRaw)) {
      // Check if it's [bcsBytes, type] format
      let actualData: any = workTypesRaw;
      if (Array.isArray(workTypesRaw) && workTypesRaw.length === 2 && typeof workTypesRaw[1] === 'string') {
        actualData = workTypesRaw[0];
      }

      // Check if it's a BCS-encoded byte array (array of numbers/strings representing bytes)
      if (Array.isArray(actualData) && actualData.length > 0) {
        // Check if elements are numbers or string numbers (BCS encoding)
        const firstElement = actualData[0];
        const isByteArray = typeof firstElement === 'number' || (typeof firstElement === 'string' && !isNaN(Number(firstElement)));

        if (isByteArray) {
          console.log(`🔍 Detected BCS-encoded struct byte array`);
          // Convert string numbers to actual numbers
          const byteArray = actualData.map((b: any) => typeof b === 'string' ? Number(b) : b);
          console.log(`🔍 Byte array length: ${byteArray.length}`, byteArray.slice(0, 50));

          let index = 0;

          // 1. Parse work_types: vector<String>
          // Read vector length (uleb128)
          let vectorLength = 0;
          let shift = 0;
          while (index < byteArray.length) {
            const byte = byteArray[index++];
            vectorLength |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
          }
          console.log(`🔍 Work types vector length: ${vectorLength}`);

          // Parse each string in the vector
          for (let i = 0; i < vectorLength && index < byteArray.length; i++) {
            // Read string length (uleb128)
            let strLength = 0;
            shift = 0;
            while (index < byteArray.length) {
              const byte = byteArray[index++];
              strLength |= (byte & 0x7F) << shift;
              if ((byte & 0x80) === 0) break;
              shift += 7;
            }

            // Read string bytes
            if (index + strLength > byteArray.length) {
              console.warn(`⚠️ Work type ${i}: Not enough bytes`);
              break;
            }
            const textBytes = byteArray.slice(index, index + strLength);
            const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
            const trimmed = decoded.trim();
            if (trimmed.length > 0) {
              workTypes.push(trimmed);
              console.log(`✅ Decoded work type ${i}: "${trimmed}"`);
            }
            index += strLength;
          }

          // 2. Parse hourly_rate: Option<u64>
          // In Sui BCS, Option<T> encoding can vary. Based on the byte array:
          // - If tag is 0: None (no value follows)
          // - If tag is 1: Some (value follows)
          // However, some implementations use 1 for Some and 0 for None
          // We'll check both patterns
          if (index < byteArray.length) {
            const optionTag = byteArray[index++];
            console.log(`🔍 Option tag for hourly_rate at index ${index - 1}: ${optionTag}, remaining bytes: ${byteArray.length - index}`);
            console.log(`🔍 Next 8 bytes:`, byteArray.slice(index, index + 8));

            // Try both encoding patterns
            if (optionTag === 1 && index + 8 <= byteArray.length) {
              // Pattern 1: Tag 1 means Some (Sui-specific)
              let u64Value = 0n;
              for (let i = 0; i < 8; i++) {
                u64Value += BigInt(byteArray[index + i] || 0) << BigInt(i * 8);
              }
              hourlyRate = Number(u64Value);
              index += 8;
              console.log(`✅ Parsed hourly_rate (tag=1=Some): ${hourlyRate} (from bytes: ${byteArray.slice(index - 8, index).join(', ')})`);
            } else if (optionTag === 0 && index + 8 <= byteArray.length) {
              // Pattern 2: Tag 0 means Some (standard BCS)
              let u64Value = 0n;
              for (let i = 0; i < 8; i++) {
                u64Value += BigInt(byteArray[index + i] || 0) << BigInt(i * 8);
              }
              hourlyRate = Number(u64Value);
              index += 8;
              console.log(`✅ Parsed hourly_rate (tag=0=Some): ${hourlyRate}`);
            } else if (optionTag === 0 || optionTag === 1) {
              // None (either pattern)
              console.log(`✅ hourly_rate is None (tag=${optionTag})`);
            } else {
              // Unexpected - might be that the tag byte is actually part of the value
              // Try reading 8 bytes starting from the tag position
              index--; // Go back
              if (index + 8 <= byteArray.length) {
                let u64Value = 0n;
                for (let i = 0; i < 8; i++) {
                  u64Value += BigInt(byteArray[index + i] || 0) << BigInt(i * 8);
                }
                hourlyRate = Number(u64Value);
                index += 8;
                console.log(`✅ Parsed hourly_rate (no tag, direct): ${hourlyRate}`);
              }
            }
          }

          console.log(`🔍 After hourly_rate parsing, index: ${index}, remaining: ${byteArray.length - index} bytes`);
          console.log(`🔍 Remaining bytes:`, byteArray.slice(index, Math.min(index + 20, byteArray.length)));

          // 3. Parse location_preference: String
          if (index < byteArray.length) {
            // Read string length (uleb128)
            let strLength = 0;
            shift = 0;
            const lengthStartIndex = index;
            while (index < byteArray.length) {
              const byte = byteArray[index++];
              strLength |= (byte & 0x7F) << shift;
              if ((byte & 0x80) === 0) break;
              shift += 7;
            }
            console.log(`🔍 location_preference length: ${strLength} (from bytes at index ${lengthStartIndex}-${index - 1})`);

            // Read string bytes
            if (index + strLength <= byteArray.length) {
              const textBytes = byteArray.slice(index, index + strLength);
              locationPreference = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes)).trim();
              index += strLength;
              console.log(`✅ Parsed location_preference: "${locationPreference}" (from bytes: ${textBytes.join(', ')})`);
            } else {
              console.warn(`⚠️ Not enough bytes for location_preference (need ${strLength}, have ${byteArray.length - index})`);
            }
          }

          console.log(`🔍 After location_preference parsing, index: ${index}, remaining: ${byteArray.length - index} bytes`);
          console.log(`🔍 Remaining bytes:`, byteArray.slice(index, Math.min(index + 20, byteArray.length)));

          // 4. Parse availability: String
          if (index < byteArray.length) {
            // Read string length (uleb128)
            let strLength = 0;
            shift = 0;
            const lengthStartIndex = index;
            while (index < byteArray.length) {
              const byte = byteArray[index++];
              strLength |= (byte & 0x7F) << shift;
              if ((byte & 0x80) === 0) break;
              shift += 7;
            }
            console.log(`🔍 availability length: ${strLength} (from bytes at index ${lengthStartIndex}-${index - 1})`);

            // Read string bytes
            if (index + strLength <= byteArray.length) {
              const textBytes = byteArray.slice(index, index + strLength);
              availability = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes)).trim();
              index += strLength;
              console.log(`✅ Parsed availability: "${availability}" (from bytes: ${textBytes.join(', ')})`);
            } else {
              console.warn(`⚠️ Not enough bytes for availability (need ${strLength}, have ${byteArray.length - index})`);
            }
          }

          console.log(`🔍 Final parsing state - index: ${index}, total bytes: ${byteArray.length}`);
        } else if (Array.isArray(actualData[0])) {
          // Nested array structure - fallback parsing
          workTypes = actualData
            .map((wt: any) => {
              if (Array.isArray(wt)) {
                return safeDecodeText(wt);
              }
              if (typeof wt === 'string') return wt.trim();
              return safeDecodeText(wt);
            })
            .filter((wt: string) => wt && wt.trim().length > 0);
        } else {
          // Flat array - fallback parsing
          workTypes = actualData
            .map((wt: any) => {
              if (typeof wt === 'string') return wt.trim();
              if (Array.isArray(wt)) {
                return safeDecodeText(wt);
              }
              return safeDecodeText(wt);
            })
            .filter((wt: string) => wt && wt.trim().length > 0);
        }
      }
    }
    console.log(`✅ Parsed work_types:`, workTypes);

    // If we didn't parse from BCS, try the fallback methods
    if (workTypes.length === 0 && workTypesRaw) {
      // Fallback: try to parse workTypesRaw if it wasn't BCS-encoded
      if (Array.isArray(workTypesRaw)) {
        const actualData = Array.isArray(workTypesRaw) && workTypesRaw.length === 2 && typeof workTypesRaw[1] === 'string'
          ? workTypesRaw[0]
          : workTypesRaw;

        if (Array.isArray(actualData[0])) {
          workTypes = actualData
            .map((wt: any) => {
              if (Array.isArray(wt)) return safeDecodeText(wt);
              if (typeof wt === 'string') return wt.trim();
              return safeDecodeText(wt);
            })
            .filter((wt: string) => wt && wt.trim().length > 0);
        } else {
          workTypes = actualData
            .map((wt: any) => {
              if (typeof wt === 'string') return wt.trim();
              if (Array.isArray(wt)) return safeDecodeText(wt);
              return safeDecodeText(wt);
            })
            .filter((wt: string) => wt && wt.trim().length > 0);
        }
      }
    }

    // Fallback parsing for other fields if not already parsed from BCS
    if (!hourlyRate && hourlyRateRaw) {
      const parseOptionU64 = (value: any): number | undefined => {
        if (!value) return undefined;
        if (typeof value === 'object' && value !== null) {
          if (value.Some !== undefined) return parseU64Value(value.Some);
          if (value.None !== undefined) return undefined;
          if (Array.isArray(value)) {
            if (value.length === 0) return undefined;
            if (value[0] === 0 && value.length > 1) return parseU64Value(value[1]);
            if (value[0] === 1) return undefined;
          }
        }
        if (typeof value === 'number') return value;
        const parsed = Number(value);
        return isNaN(parsed) ? undefined : parsed;
      };
      hourlyRate = parseOptionU64(hourlyRateRaw);
    }

    if (!locationPreference && locationPreferenceRaw) {
      locationPreference = typeof locationPreferenceRaw === 'string'
        ? locationPreferenceRaw.trim()
        : safeDecodeText(locationPreferenceRaw);
    }

    if (!availability && availabilityRaw) {
      availability = typeof availabilityRaw === 'string'
        ? availabilityRaw.trim()
        : safeDecodeText(availabilityRaw);
    }

    const workPreferences: WorkPreferences = {
      workTypes,
      hourlyRate,
      locationPreference,
      availability,
    };

    console.log(`✅ Final work preferences for card ${cardId}:`, workPreferences);
    return workPreferences;
  } catch (error) {
    console.error(`❌ Error getting work preferences for card ${cardId}:`, error);
    return null;
  }
}

// Get social links
export async function getSocialLinks(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_SOCIAL_LINKS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log(`🔍 Full result structure for social links card ${cardId}:`, {
      results: result.results,
      resultsLength: result.results?.length,
      firstResult: result.results?.[0],
      returnValues: result.results?.[0]?.returnValues,
    });

    if (result.results?.[0]?.returnValues) {
      const returnValues = result.results[0].returnValues;
      const rawReturnValue = returnValues[0];

      console.log(`🔍 Raw social links returnValues for card ${cardId}:`, {
        allReturnValues: returnValues,
        returnValuesCount: returnValues.length,
        firstReturnValue: rawReturnValue,
        type: typeof rawReturnValue,
        isArray: Array.isArray(rawReturnValue),
        length: Array.isArray(rawReturnValue) ? rawReturnValue.length : 'N/A',
        stringified: JSON.stringify(rawReturnValue).substring(0, 200),
      });

      // Check if it's [bcsBytes, type] format
      let actualData: any = rawReturnValue;
      let isBcsFormat = false;
      if (Array.isArray(rawReturnValue) && rawReturnValue.length === 2) {
        const [bcsBytes, type] = rawReturnValue;
        // Check if first element is a byte array and second is a type string
        if (Array.isArray(bcsBytes) && typeof type === 'string' && type.includes('::')) {
          console.log(`🔍 Found [bcsBytes, type] format - type: ${type}`);
          actualData = bcsBytes;
          isBcsFormat = true;
        }
      }

      // Try parseReturnValue first (but don't use it if we detected BCS format)
      const parsedValue = parseReturnValue(rawReturnValue);

      console.log(`🔍 Parsed social links for card ${cardId}:`, parsedValue);
      console.log(`🔍 Actual data for card ${cardId}:`, actualData);
      console.log(`🔍 Is BCS format: ${isBcsFormat}`);

      // Helper function to parse Option<String> from Move
      const parseOptionString = (value: any): string => {
        if (value === null || value === undefined) {
          console.log(`🔍 parseOptionString: null/undefined value`);
          return '';
        }

        // Handle Option format: could be {Some: value} or {None: null} or [0, value] or [1] for None
        if (typeof value === 'object' && value !== null) {
          // Check for {Some: ...} or {None: ...} format
          if (value.Some !== undefined) {
            const val = value.Some;
            console.log(`🔍 parseOptionString: Found Some format, value:`, val);
            if (typeof val === 'string') return val.trim();
            if (Array.isArray(val)) {
              const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(val)).trim();
              console.log(`🔍 parseOptionString: Decoded from bytes:`, decoded);
              return decoded;
            }
            return safeDecodeText(val);
          }
          if (value.None !== undefined || value.None === null) {
            console.log(`🔍 parseOptionString: Found None format`);
            return '';
          }

          // Check for array format [0, value] (Some) or [1] (None) or [1, null] (None)
          if (Array.isArray(value)) {
            if (value.length === 0) {
              console.log(`🔍 parseOptionString: Empty array`);
              return '';
            }

            // Check for [0, value] format (Some)
            if (value[0] === 0 && value.length > 1) {
              const val = value[1];
              console.log(`🔍 parseOptionString: Found [0, value] format, value:`, val);
              if (typeof val === 'string') return val.trim();
              if (Array.isArray(val)) {
                const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(val)).trim();
                console.log(`🔍 parseOptionString: Decoded from bytes:`, decoded);
                return decoded;
              }
              return safeDecodeText(val);
            }

            // Check for [1] or [1, null] format (None)
            if (value[0] === 1 || (value.length === 1 && value[0] === null)) {
              console.log(`🔍 parseOptionString: Found None array format`);
              return '';
            }

            // If it's just an array of bytes/numbers, try to decode it
            if (value.length > 0 && typeof value[0] === 'number') {
              const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(value)).trim();
              console.log(`🔍 parseOptionString: Decoded array of numbers:`, decoded);
              return decoded;
            }
          }

          // If it's already a string field, use it directly
          if (typeof value === 'string') {
            // Filter out type strings (they contain "::")
            if (value.includes('::')) {
              console.log(`🔍 parseOptionString: Filtered out type string:`, value);
              return '';
            }
            return value.trim();
          }
        }

        if (typeof value === 'string') {
          // Filter out type strings (they contain "::")
          if (value.includes('::')) {
            console.log(`🔍 parseOptionString: Filtered out type string:`, value);
            return '';
          }
          return value.trim();
        }
        if (Array.isArray(value)) {
          const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(value)).trim();
          console.log(`🔍 parseOptionString: Decoded array:`, decoded);
          return decoded;
        }
        const decoded = safeDecodeText(value);
        console.log(`🔍 parseOptionString: Used safeDecodeText, result:`, decoded);
        return decoded;
      };

      // Parse the social links struct
      // Check if it's a struct with fields property (Move struct format)
      // If we detected BCS format, use actualData (the byte array) directly
      // Otherwise, try parsedValue first, then fall back to actualData
      let socialLinksData: any;
      if (isBcsFormat) {
        // We already extracted the byte array, use it directly
        socialLinksData = actualData;
        console.log(`🔍 Using BCS byte array directly, length: ${socialLinksData.length}`);
      } else {
        socialLinksData = parsedValue || actualData;

        // If parsedValue is a string (type name), try to get fields from actualData
        if (typeof parsedValue === 'string' && parsedValue.includes('::')) {
          console.log(`⚠️ Parsed value is a type string, trying actualData`);
          socialLinksData = actualData;
        }
      }

      // PRIORITY: Check if it's BCS-encoded (array of numbers) FIRST - this is a struct with Option<String> fields
      // This should be checked before other formats since BCS is the most common format from Sui
      if (Array.isArray(socialLinksData) && socialLinksData.length > 0 && typeof socialLinksData[0] === 'number') {
        console.log(`🔍 Detected BCS-encoded social links struct, attempting to parse...`);
        console.log(`🔍 BCS bytes length: ${socialLinksData.length}`);
        console.log(`🔍 First 50 bytes:`, socialLinksData.slice(0, 50));

        // BCS format for struct with 4 Option<String> fields:
        // Each Option<String> is: [flag (1 byte: 0=None, 1=Some), length (uleb128), bytes...]
        // For struct: field1, field2, field3, field4 in order

        try {
          let index = 0;
          const parseOptionStringFromBCS = (): string => {
            if (index >= socialLinksData.length) return '';

            const flag = socialLinksData[index++];
            if (flag === 0) {
              // None
              return '';
            }
            if (flag !== 1) {
              console.warn(`⚠️ Invalid Option flag: ${flag}, expected 0 or 1`);
              return '';
            }

            // Read string length (uleb128)
            let strLength = 0;
            let shift = 0;
            while (index < socialLinksData.length) {
              const byte = socialLinksData[index++];
              strLength |= (byte & 0x7F) << shift;
              if ((byte & 0x80) === 0) break;
              shift += 7;
            }

            // Read string bytes
            if (index + strLength > socialLinksData.length) {
              console.warn(`⚠️ Not enough bytes for string (need ${strLength}, have ${socialLinksData.length - index})`);
              return '';
            }

            const textBytes = socialLinksData.slice(index, index + strLength);
            const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
            index += strLength;
            return decoded.trim();
          };

          const parsed: SocialLinks = {
            github: parseOptionStringFromBCS(),
            linkedin: parseOptionStringFromBCS(),
            twitter: parseOptionStringFromBCS(),
            personalWebsite: parseOptionStringFromBCS(),
          };

          console.log(`✅ Parsed BCS-encoded social links for card ${cardId}:`, parsed);
          return parsed;
        } catch (error) {
          console.error(`❌ Error parsing BCS-encoded social links:`, error);
          return {
            github: '',
            linkedin: '',
            twitter: '',
            personalWebsite: '',
          };
        }
      }

      // Check if returnValues has multiple entries (each field might be a separate return value)
      // Only check this if we haven't already parsed BCS format
      if (returnValues && returnValues.length >= 4 && !isBcsFormat) {
        console.log(`🔍 Found ${returnValues.length} return values, treating as separate fields`);
        // Assume order: github, linkedin, twitter, personal_website
        // Each return value might be in [value, type] format
        const extractValue = (rv: any) => {
          if (Array.isArray(rv) && rv.length === 2) {
            return rv[0]; // Take the value, ignore the type
          }
          return rv;
        };

        socialLinksData = {
          github: extractValue(returnValues[0]),
          linkedin: extractValue(returnValues[1]),
          twitter: extractValue(returnValues[2]),
          personal_website: extractValue(returnValues[3]),
        };
      }

      // Check if it has a fields property (Move struct format)
      if (socialLinksData && typeof socialLinksData === 'object' && !Array.isArray(socialLinksData) && socialLinksData.fields) {
        console.log(`🔍 Found struct with fields property:`, socialLinksData.fields);
        socialLinksData = socialLinksData.fields;
      }

      if (socialLinksData && typeof socialLinksData === 'object') {
        console.log(`🔍 Parsing social links from object:`, socialLinksData);
        console.log(`🔍 Object keys:`, Object.keys(socialLinksData));
        console.log(`🔍 Object values:`, Object.values(socialLinksData));
        console.log(`🔍 Is array:`, Array.isArray(socialLinksData));

        // Check if it's an array of field values (struct fields in order)
        if (Array.isArray(socialLinksData) && socialLinksData.length >= 4) {
          console.log(`🔍 Detected array format with ${socialLinksData.length} elements`);
          const parsed: SocialLinks = {
            github: parseOptionString(socialLinksData[0]),
            linkedin: parseOptionString(socialLinksData[1]),
            twitter: parseOptionString(socialLinksData[2]),
            personalWebsite: parseOptionString(socialLinksData[3]),
          };
          console.log(`✅ Parsed social links from array for card ${cardId}:`, parsed);
          return parsed;
        }

        // Check if object has numeric indices (0, 1, 2, 3) - struct fields in order
        if ('0' in socialLinksData || 0 in socialLinksData) {
          console.log(`🔍 Detected object with numeric indices`);
          const parsed: SocialLinks = {
            github: parseOptionString(socialLinksData[0] ?? socialLinksData['0']),
            linkedin: parseOptionString(socialLinksData[1] ?? socialLinksData['1']),
            twitter: parseOptionString(socialLinksData[2] ?? socialLinksData['2']),
            personalWebsite: parseOptionString(socialLinksData[3] ?? socialLinksData['3']),
          };
          console.log(`✅ Parsed social links from numeric indices for card ${cardId}:`, parsed);
          return parsed;
        }

        // Try to extract fields, filtering out type strings and non-field properties
        const extractField = (key: string | number, altKey1?: string | number, altKey2?: string | number): string => {
          let value = socialLinksData[key];
          if (value === undefined && altKey1 !== undefined) {
            value = socialLinksData[altKey1];
          }
          if (value === undefined && altKey2 !== undefined) {
            value = socialLinksData[altKey2];
          }

          // If value is the struct type string, skip it
          if (typeof value === 'string' && value.includes('::devhub::SocialLinks')) {
            console.log(`⚠️ Skipping type string for field ${key}:`, value);
            return '';
          }

          const parsed = parseOptionString(value);
          console.log(`🔍 Extracted field ${key}:`, { raw: value, parsed });
          return parsed;
        };

        const parsed: SocialLinks = {
          github: extractField('github', 0),
          linkedin: extractField('linkedin', 1),
          twitter: extractField('twitter', 2),
          personalWebsite: extractField('personal_website', 'personalWebsite', 3),
        };

        console.log(`✅ Parsed social links for card ${cardId}:`, parsed);

        // Check if all fields are empty - if so, log a warning
        const hasAnyLinks = parsed.github || parsed.linkedin || parsed.twitter || parsed.personalWebsite;
        if (!hasAnyLinks) {
          console.warn(`⚠️ All social links are empty for card ${cardId}. Raw data structure:`, {
            socialLinksData,
            parsedValue,
            actualData,
            returnValues,
          });
        }

        return parsed;
      }

      return {
        github: '',
        linkedin: '',
        twitter: '',
        personalWebsite: '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting social links:', error);
    return null;
  }
}

// Helper function to safely decode text from various formats
function safeDecodeText(value: any): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    try {
      return new TextDecoder().decode(new Uint8Array(value));
    } catch {
      return '';
    }
  }
  return String(value || '').trim();
}

// Get languages
export async function getLanguages(cardId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_LANGUAGES}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(cardId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (!result.results?.[0]?.returnValues) {
      console.warn(`⚠️ No return values for languages for card ${cardId}`);
      return [];
    }

    // Parse languages - handle vector<String> from Move contract
    // The return value structure for vectors is typically [bcsBytes, type] or just the data array
    // In Sui, returnValues are arrays of [bcsBytes, type] pairs
    const returnValue = result.results[0].returnValues[0];

    console.log(`🔍 Raw returnValue for card ${cardId}:`, {
      raw: returnValue,
      type: typeof returnValue,
      isArray: Array.isArray(returnValue),
      length: Array.isArray(returnValue) ? returnValue.length : 'N/A',
      isUint8Array: returnValue instanceof Uint8Array,
      stringified: JSON.stringify(returnValue, null, 2),
    });

    // Handle [bcsBytes, type] format where bcsBytes is Uint8Array
    let languagesRaw: any = returnValue;
    if (Array.isArray(returnValue) && returnValue.length === 2) {
      const [bcsBytes, type] = returnValue;
      console.log(`🔍 Found [bcsBytes, type] format - type: ${type}, bcsBytes:`, bcsBytes);
      // If bcsBytes is a Uint8Array, we need to decode it
      if (bcsBytes instanceof Uint8Array || Array.isArray(bcsBytes)) {
        languagesRaw = bcsBytes;
      } else {
        languagesRaw = bcsBytes;
      }
    } else if (returnValue instanceof Uint8Array) {
      console.log(`🔍 Found Uint8Array format`);
      languagesRaw = Array.from(returnValue);
    }

    console.log(`🔍 Processed languagesRaw for card ${cardId}:`, {
      raw: languagesRaw,
      type: typeof languagesRaw,
      isArray: Array.isArray(languagesRaw),
      length: Array.isArray(languagesRaw) ? languagesRaw.length : 'N/A',
      stringified: JSON.stringify(languagesRaw, null, 2),
    });

    let languages: string[] = [];

    // Try different ways to extract the vector data
    let vectorData: any = null;

    // Method 1: Check if it's in [type, data] format (BCS encoded)
    if (Array.isArray(languagesRaw) && languagesRaw.length === 2) {
      // This might be [type, data] format - try the second element
      const [type, data] = languagesRaw;
      console.log(`🔍 Found [type, data] format - type: ${type}, data:`, data);
      vectorData = data;
    }
    // Method 2: Check if it's directly the array
    else if (Array.isArray(languagesRaw)) {
      console.log(`🔍 Found direct array format`);
      vectorData = languagesRaw;
    }
    // Method 3: Check if it's nested as [data]
    else if (languagesRaw && typeof languagesRaw === 'object') {
      console.log(`🔍 Found object format, checking nested structure`);
      // Try accessing [0] if it exists
      if (Array.isArray(languagesRaw[0])) {
        vectorData = languagesRaw[0];
      } else {
        vectorData = languagesRaw;
      }
    }
    // Method 4: Check if it's a string (shouldn't happen, but handle it)
    else if (typeof languagesRaw === 'string') {
      console.log(`🔍 Found string format:`, languagesRaw);
      // If it's a string, check if it contains vector type info
      if (languagesRaw.includes('vector') || languagesRaw.includes('String')) {
        console.warn(`⚠️ String contains type info, skipping:`, languagesRaw);
        return [];
      }
      // Single string (shouldn't happen for vector, but handle it)
      languages = [languagesRaw.trim()].filter(Boolean);
      console.log(`✅ Parsed single string language:`, languages);
      return languages;
    }

    console.log(`🔍 Extracted vectorData:`, {
      vectorData,
      type: typeof vectorData,
      isArray: Array.isArray(vectorData),
      length: Array.isArray(vectorData) ? vectorData.length : 'N/A',
    });

    // Filter out type information strings like "vector<0x1::string::String>"
    if (typeof vectorData === 'string') {
      // If it's a string, check if it contains vector type info
      if (vectorData.includes('vector') || vectorData.includes('String')) {
        console.warn(`⚠️ VectorData string contains type info, skipping:`, vectorData);
        return [];
      }
      // Single string (shouldn't happen for vector, but handle it)
      languages = [vectorData.trim()].filter(Boolean);
      console.log(`✅ Parsed single string language:`, languages);
      return languages;
    }
    // Now parse the vector data
    else if (vectorData && Array.isArray(vectorData)) {
      console.log(`🔍 Processing array with ${vectorData.length} elements`);

      // Check if it's a nested structure (BCS encoding - each element is a byte array)
      if (vectorData.length > 0 && Array.isArray(vectorData[0])) {
        console.log(`🔍 Found nested array structure (BCS encoding)`);
        // Nested array structure - each element is an array of bytes representing a string
        languages = vectorData
          .map((lang: any, idx: number) => {
            console.log(`🔍 Processing language element ${idx}:`, lang);
            // Filter out type information
            if (typeof lang === 'string' && (lang.includes('vector') || lang.includes('String'))) {
              console.log(`⚠️ Skipping type info string:`, lang);
              return null;
            }
            if (Array.isArray(lang)) {
              // Each item is a byte array - decode it
              const decoded = safeDecodeText(lang);
              console.log(`✅ Decoded from bytes:`, decoded);
              return decoded;
            }
            if (typeof lang === 'string') {
              const trimmed = lang.trim();
              console.log(`✅ Using string as-is:`, trimmed);
              return trimmed;
            }
            // Try to decode as bytes
            const decoded = safeDecodeText(lang);
            console.log(`✅ Decoded from other format:`, decoded);
            return decoded;
          })
          .filter((lang: string | null): lang is string => {
            const isValid = lang !== null && lang.trim().length > 0;
            if (!isValid && lang !== null) {
              console.log(`⚠️ Filtered out invalid language:`, lang);
            }
            return isValid;
          });
      } else {
        console.log(`🔍 Found flat array structure`);

        // Check if this is BCS-encoded vector<String> format
        // BCS format: [vector_length, string1_length, string1_bytes..., string2_length, string2_bytes..., ...]
        // OR: [string1_length, string1_bytes..., string2_length, string2_bytes..., ...]
        if (vectorData.length > 0 && typeof vectorData[0] === 'number') {
          console.log(`🔍 Detected BCS-encoded format with numbers`);

          let index = 0;
          const parsedLanguages: string[] = [];

          // Skip the first element if it's the vector length (usually a small number like 1, 2, or 3)
          // Check if first element is a small number that could be vector length
          // If the next element is also a small number (< 100), the first is likely vector length
          if (vectorData.length > 1 && 
              typeof vectorData[0] === 'number' && 
              vectorData[0] > 0 && 
              vectorData[0] < 100 &&
              typeof vectorData[1] === 'number' &&
              vectorData[1] > 0 &&
              vectorData[1] < 100) {
            // First element is likely vector length, second is first string length
            console.log(`🔍 First element ${vectorData[0]} appears to be vector length, skipping`);
            index = 1;
          }

          while (index < vectorData.length) {
            if (index >= vectorData.length) break;

            // Read the length of the next string
            const stringLength = vectorData[index];
            console.log(`🔍 Found string length: ${stringLength} at index ${index}`);

            if (typeof stringLength !== 'number' || stringLength <= 0 || stringLength > 100) {
              console.warn(`⚠️ Invalid string length ${stringLength} at index ${index}, stopping`);
              break;
            }

            index++; // Move past the length byte

            // Extract the bytes for this string
            const stringBytes: number[] = [];
            for (let i = 0; i < stringLength && index < vectorData.length; i++) {
              const byte = vectorData[index];
              if (typeof byte === 'number') {
                stringBytes.push(byte);
              }
              index++;
            }

            if (stringBytes.length === stringLength) {
              // Decode the bytes to a string
              try {
                const decoded = new TextDecoder('utf-8', { fatal: false }).decode(
                  new Uint8Array(stringBytes)
                );
                const trimmed = decoded.trim();
                if (trimmed.length > 0) {
                  console.log(`✅ Decoded language: "${trimmed}" from ${stringBytes.length} bytes`);
                  parsedLanguages.push(trimmed);
                } else {
                  console.warn(`⚠️ Decoded empty string from bytes:`, stringBytes);
                }
              } catch (error) {
                console.warn(`⚠️ Failed to decode bytes:`, stringBytes, error);
              }
            } else {
              console.warn(`⚠️ Expected ${stringLength} bytes but got ${stringBytes.length}`);
            }
          }

          languages = parsedLanguages;
        } else {
          // Flat array - each element might be a string or byte array
          languages = vectorData
            .map((lang: any, idx: number) => {
              console.log(`🔍 Processing language element ${idx}:`, lang, `type:`, typeof lang);
              // Filter out type information
              if (typeof lang === 'string' && (lang.includes('vector') || lang.includes('String'))) {
                console.log(`⚠️ Skipping type info string:`, lang);
                return null;
              }
              if (typeof lang === 'string') {
                // Already a string
                const trimmed = lang.trim();
                console.log(`✅ Using string as-is:`, trimmed);
                return trimmed;
              }
              if (Array.isArray(lang)) {
                // Byte array - decode it
                const decoded = safeDecodeText(lang);
                console.log(`✅ Decoded from byte array:`, decoded);
                return decoded;
              }
              // Try to decode as bytes
              const decoded = safeDecodeText(lang);
              console.log(`✅ Decoded from other format:`, decoded);
              return decoded;
            })
            .filter((lang: string | null): lang is string => {
              const isValid = lang !== null && lang.trim().length > 0;
              if (!isValid && lang !== null) {
                console.log(`⚠️ Filtered out invalid language:`, lang);
              }
              return isValid;
            });
        }
      }
    } else if (vectorData === null || vectorData === undefined) {
      // No data
      console.warn(`⚠️ VectorData is null/undefined for card ${cardId}`);
      languages = [];
    } else {
      // Unexpected format
      console.warn(`⚠️ Languages has unexpected format for card ${cardId}:`, vectorData, `type:`, typeof vectorData);
      languages = [];
    }

    console.log(`✅ Parsed languages for card ${cardId}:`, languages);
    return languages;
  } catch (error) {
    console.error('Error getting languages:', error);
    return [];
  }
}

// Search functions
