import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { suiClient } from '../constants';
import { PACKAGE_ID, DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS } from '../constants';
import { parseReturnValue, bytesToHexAddress, parseU64Value, decodeBytesToString } from '../utils';
import { Project, ProjectApplication } from '../types';

export async function getProjectInfo(projectId: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PROJECT_INFO}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(projectId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as Project;
    }
    return null;
  } catch (error) {
    console.error('Error getting project info:', error);
    return null;
  }
}

// Helper to parse ProjectApplication from return value
function parseProjectApplication(value: any): ProjectApplication | null {
  try {
    if (!value) {
      return null;
    }

    // If value is already an object with expected fields, return it
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.id || value.applicantAddress || value.yourRole) {
        return {
          id: value.id || '',
          projectId: value.projectId || '',
          applicantAddress: value.applicantAddress || '',
          yourRole: value.yourRole || '',
          availabilityHrsPerWeek: Number(value.availabilityHrsPerWeek || 0),
          startDate: value.startDate || '',
          expectedDurationWeeks: Number(value.expectedDurationWeeks || 0),
          proposalSummary: value.proposalSummary || '',
          requestedCompensation: Number(value.requestedCompensation || 0),
          milestonesCount: Number(value.milestonesCount || 0),
          githubRepoLink: value.githubRepoLink || '',
          onChainAddress: value.onChainAddress || '',
          teamMembers: Array.isArray(value.teamMembers) ? value.teamMembers : [],
          applicationStatus: value.applicationStatus || 'Pending',
          submissionTimestamp: Number(value.submissionTimestamp || 0),
          coverLetterWalrusBlobId: value.coverLetterWalrusBlobId,
          portfolioWalrusBlobIds: Array.isArray(value.portfolioWalrusBlobIds) ? value.portfolioWalrusBlobIds : [],
          proposalId: value.proposalId,
        };
      }
    }

    // If it's an array, it's likely struct fields that need to be parsed elsewhere
    // Return null here and let the caller handle array parsing
    return null;
  } catch (e) {
    console.error('Error parsing ProjectApplication:', e, value);
    return null;
  }
}

// Helper function to inspect a transaction and see what data was stored
export async function inspectApplicationTransaction(digest: string, client?: SuiClient) {
  try {
    const clientToUse = client || suiClient;
    console.log('🔍 Inspecting transaction:', digest);
    
    const tx = await clientToUse.getTransactionBlock({
      digest,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });

    console.log('📋 Transaction details:', JSON.stringify(tx, null, 2));

    // Find created Proposal objects
    const createdProposals = tx.objectChanges?.filter(
      (change: any) => change.type === 'created' && 
      (change.objectType?.includes('Proposal') || change.objectType?.includes('proposal'))
    ) || [];

    console.log(`📦 Found ${createdProposals.length} created Proposal objects`);

    // Fetch each proposal object to see its data
    for (const proposal of createdProposals) {
      if ('objectId' in proposal) {
        const proposalId = proposal.objectId;
        console.log(`\n🔍 Fetching Proposal object: ${proposalId}`);
        
        try {
          const proposalObj = await clientToUse.getObject({
            id: proposalId,
            options: {
              showContent: true,
              showType: true,
              showOwner: true,
            },
          });

          console.log(`📄 Proposal ${proposalId} data:`, JSON.stringify(proposalObj, null, 2));
          
          if (proposalObj.data?.content && 'fields' in proposalObj.data.content) {
            const fields = (proposalObj.data.content as any).fields;
            console.log(`📋 Proposal fields:`, Object.keys(fields));
            console.log(`📋 Proposal field values:`, {
              proposal_title: fields.proposal_title || fields.proposalTitle,
              your_role: fields.your_role || fields.yourRole,
              proposal_summary: fields.proposal_summary || fields.proposalSummary,
              applicant_address: fields.applicant_address || fields.applicantAddress,
              start_date: fields.start_date || fields.startDate,
              requested_compensation: fields.requested_compensation || fields.requestedCompensation,
              application_status: fields.application_status || fields.applicationStatus,
            });
          }
        } catch (e) {
          console.error(`❌ Error fetching proposal ${proposalId}:`, e);
        }
      }
    }

    // Check events for application data
    const events = tx.events || [];
    console.log(`\n📊 Found ${events.length} events`);
    events.forEach((event: any, idx: number) => {
      console.log(`Event ${idx}:`, {
        type: event.type,
        parsedJson: event.parsedJson,
        bcs: event.bcs,
      });
    });

    return tx;
  } catch (error) {
    console.error('❌ Error inspecting transaction:', error);
    throw error;
  }
}

// BCS decoder for ProjectApplication struct
function decodeBCSProjectApplication(bytes: number[], projectId: number): ProjectApplication | null {
  try {
    console.log(`🔍 Decoding BCS byte array (${bytes.length} bytes)`);
    console.log(`🔍 First 50 bytes:`, bytes.slice(0, 50));
    let offset = 0;

    // Helper to read ULEB128 (unsigned LEB128)
    const readULEB128 = (): number => {
      let result = 0;
      let shift = 0;
      let bytesRead = 0;
      while (offset < bytes.length && bytesRead < 10) {
        const byte = bytes[offset++];
        bytesRead++;
        result |= (byte & 0x7F) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
        if (shift >= 64) break;
      }
      return result;
    };

    // Helper to read u64 (8 bytes, little-endian)
    const readU64 = (): number => {
      if (offset + 8 > bytes.length) {
        console.warn(`⚠️ Not enough bytes for u64 at offset ${offset}`);
        return 0;
      }
      let value = 0n;
      for (let i = 0; i < 8; i++) {
        const byte = bytes[offset++];
        if (byte === undefined) {
          console.warn(`⚠️ Undefined byte at offset ${offset - 1}`);
          return 0;
        }
        value += BigInt(byte) << BigInt(i * 8);
      }
      return Number(value);
    };

    // Helper to read address (32 bytes)
    const readAddress = (): string => {
      if (offset + 32 > bytes.length) {
        console.warn(`⚠️ Not enough bytes for address at offset ${offset}`);
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
      }
      const addrBytes = bytes.slice(offset, offset + 32);
      offset += 32;
      return bytesToHexAddress(addrBytes);
    };

    // Helper to read ID (32 bytes)
    const readID = (): string => {
      if (offset + 32 > bytes.length) {
        console.warn(`⚠️ Not enough bytes for ID at offset ${offset}`);
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
      }
      const idBytes = bytes.slice(offset, offset + 32);
      offset += 32;
      return bytesToHexAddress(idBytes);
    };

    // Helper to read UID (struct with id field)
    const readUID = (): string => {
      return readID();
    };

    // Helper to read String (ULEB128 length + UTF-8 bytes)
    const readString = (): string => {
      const length = readULEB128();
      if (length === 0) return '';
      if (offset + length > bytes.length) {
        console.warn(`⚠️ Not enough bytes for string (length ${length}) at offset ${offset}`);
        return '';
      }
      const strBytes = bytes.slice(offset, offset + length);
      offset += length;
      return decodeBytesToString(strBytes);
    };

    // Helper to read Option<String>
    const readOptionString = (): string | undefined => {
      if (offset >= bytes.length) return undefined;
      const tag = bytes[offset++];
      if (tag === 0) return undefined;
      if (tag === 1) return readString();
      return undefined;
    };

    // Helper to read Option<ID>
    const readOptionID = (): string | undefined => {
      if (offset >= bytes.length) return undefined;
      const tag = bytes[offset++];
      if (tag === 0) return undefined;
      if (tag === 1) return readID();
      return undefined;
    };

    // Helper to read vector<String>
    const readVectorString = (): string[] => {
      const length = readULEB128();
      const result: string[] = [];
      for (let i = 0; i < length; i++) {
        result.push(readString());
      }
      return result;
    };

    // Helper to validate if decoded values make sense
    const validateDecoded = (app: ProjectApplication | null): boolean => {
      if (!app) return false;
      if (!app.applicantAddress || app.applicantAddress.length !== 66 || !app.applicantAddress.startsWith('0x')) {
        return false;
      }
      if (app.requestedCompensation > 1000000000) {
        return false;
      }
      if (app.availabilityHrsPerWeek > 200) {
        return false;
      }
      return true;
    };
    
    // Try decoding with a given start offset
    const tryDecode = (startOffset: number): ProjectApplication | null => {
      offset = startOffset;
      try {
        // Decode struct fields in order
        const id = readUID();
        const project_id = readID();
        const applicant_address = readAddress();
        const your_role = readString();
        const availability_hrs_per_week = readU64();
        const start_date = readString();
        const expected_duration_weeks = readU64();
        const proposal_summary = readString();
        const requested_compensation = readU64();
        const milestones_count = readU64();
        const github_repo_link = readString();
        const on_chain_address = readAddress();
        const team_members = readVectorString();
        const application_status = readString();
        const submission_timestamp = readU64();
        const cover_letter_walrus_blob_id = readOptionString();
        const portfolio_walrus_blob_ids = readVectorString();
        const proposal_id = readOptionID();

        const parseStartDate = (dateStr: string): string => {
          if (!dateStr) return '';
          if (/^\d+$/.test(dateStr)) {
            const timestamp = Number(dateStr);
            if (!isNaN(timestamp)) {
              const date = timestamp > 1000000000000 
                ? new Date(timestamp) 
                : new Date(timestamp * 1000);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
            }
          }
          return dateStr;
        };

        const app: ProjectApplication = {
          id: id || '1',
          projectId: String(projectId),
          projectObjectId: project_id,
          applicantAddress: applicant_address,
          yourRole: your_role,
          availabilityHrsPerWeek: availability_hrs_per_week,
          startDate: parseStartDate(start_date),
          expectedDurationWeeks: expected_duration_weeks,
          proposalSummary: proposal_summary,
          requestedCompensation: requested_compensation,
          milestonesCount: milestones_count,
          githubRepoLink: github_repo_link,
          onChainAddress: on_chain_address,
          teamMembers: team_members,
          applicationStatus: application_status || 'Pending',
          submissionTimestamp: submission_timestamp,
          coverLetterWalrusBlobId: cover_letter_walrus_blob_id,
          portfolioWalrusBlobIds: portfolio_walrus_blob_ids,
          proposalId: proposal_id,
        };
        
        return validateDecoded(app) ? app : null;
      } catch (e) {
        console.warn(`⚠️ Decode attempt failed at offset ${startOffset}:`, e);
        return null;
      }
    };
    
    // Try with offset 0 first
    let decoded = tryDecode(0);
    if (decoded) {
      console.log(`✅ Successfully decoded with offset 0`);
      return decoded;
    }
    
    // If that failed and first byte is small, try skipping it
    if (bytes.length > 0 && bytes[0] < 10 && bytes[0] > 0) {
      console.log(`🔍 Trying decode with offset 1 (skipping first byte ${bytes[0]})...`);
      decoded = tryDecode(1);
      if (decoded) {
        console.log(`✅ Successfully decoded with offset 1`);
        return decoded;
      }
    }
    
    console.error(`❌ Failed to decode BCS byte array with any offset`);
    return null;
  } catch (error) {
    console.error('❌ Error decoding BCS ProjectApplication:', error);
    return null;
  }
}

// Get project applications
export async function getProjectApplications(projectId: number, client?: SuiClient) {
  try {
    const clientToUse = client || suiClient;
    console.log('🔍 Fetching applications for project:', projectId);
    const result = await clientToUse.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_PROJECT_APPLICATIONS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.u64(projectId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('📥 Raw result for project applications:', JSON.stringify(result, null, 2));
    console.log('📊 Number of results:', result.results?.length || 0);

    if (!result.results || result.results.length === 0) {
      console.log('⚠️ No results found');
      return [];
    }

    // Check if there are multiple return values (one per application) or a single vector
    let vectorData: any = null;
    
    // First, check if we have multiple results (one per application)
    if (result.results.length > 1) {
      console.log(`📊 Found ${result.results.length} results, treating each as a separate application`);
      vectorData = result.results.map((r: any) => r.returnValues?.[0]).filter(Boolean);
    } else if (result.results[0]?.returnValues) {
      // Single result with return values - might be a vector
      const returnValue = result.results[0].returnValues[0];
      console.log('📊 Return value type:', typeof returnValue);
      console.log('📊 Return value structure:', JSON.stringify(returnValue, null, 2));

      // The contract returns &vector<ProjectApplication>
      // The return value from devInspectTransactionBlock is typically in format [type, data]
      if (Array.isArray(returnValue)) {
        // Check if it's [type, data] format where type is byte array and data is type string
        if (returnValue.length === 2) {
          const [first, second] = returnValue;
          console.log('📦 First element type:', typeof first, 'Is array:', Array.isArray(first), 'Length:', Array.isArray(first) ? first.length : 'N/A');
          console.log('📦 Second element type:', typeof second, 'Value:', typeof second === 'string' ? second.substring(0, 50) : second);

          // If first is a byte array and second is a string (type descriptor), 
          // the first element contains the vector data
          if (Array.isArray(first) && typeof second === 'string') {
            // The byte array might contain multiple concatenated applications
            // For now, treat it as a single item that needs BCS decoding
            // The decoder will handle it
            vectorData = [first];
            console.log('📦 Using first element (byte array) as vector data, length:', first.length);
          } else if (Array.isArray(second)) {
            // The data should be the vector contents
            vectorData = second;
          } else {
            // Sometimes the data is nested differently
            vectorData = returnValue;
          }
        } else {
          // Direct array (might be the vector itself)
          vectorData = returnValue;
        }
      } else if (returnValue && typeof returnValue === 'object') {
        // Might be an object with a 'data' field or similar
        vectorData = returnValue.data || returnValue.value || [returnValue];
      }
    }

    if (!vectorData || !Array.isArray(vectorData)) {
      console.log('⚠️ Could not extract vector data from return value');
      console.log('⚠️ vectorData:', vectorData, 'Type:', typeof vectorData);
      return [];
    }

    // The contract returns &vector<ProjectApplication>
    let applications: ProjectApplication[] = [];

    console.log('📋 Vector data length:', vectorData.length);
    if (vectorData.length > 0) {
      console.log('📋 First item structure:', JSON.stringify(vectorData[0], null, 2));
      console.log('📋 First item type:', typeof vectorData[0], Array.isArray(vectorData[0]) ? 'array' : 'object');
      if (vectorData[0] && typeof vectorData[0] === 'object' && !Array.isArray(vectorData[0])) {
        console.log('📋 First item keys:', Object.keys(vectorData[0]));
        if (vectorData[0].fields) {
          console.log('📋 First item fields keys:', Object.keys(vectorData[0].fields));
          console.log('📋 First item fields sample:', {
            id: vectorData[0].fields.id,
            applicant_address: vectorData[0].fields.applicant_address,
            your_role: vectorData[0].fields.your_role,
            proposal_summary: vectorData[0].fields.proposal_summary,
            start_date: vectorData[0].fields.start_date,
          });
        }
        // Check if it has an objectId - if so, we can fetch it directly
        if (vectorData[0].objectId) {
          console.log('📋 First item has objectId:', vectorData[0].objectId);
        }
      } else if (Array.isArray(vectorData[0])) {
        console.log('📋 First item is array with length:', vectorData[0].length);
        console.log('📋 First item array sample:', vectorData[0].slice(0, 5));
      }
    }

    // Check if the first item is a BCS-encoded vector containing multiple applications
    // (starts with vector length byte, then concatenated applications)
    if (vectorData.length === 1 && Array.isArray(vectorData[0]) && 
        vectorData[0].length > 100 && vectorData[0].every((v: any) => typeof v === 'number' && v >= 0 && v <= 255)) {
      const byteArray = vectorData[0];
      const firstByte = byteArray[0];
      
      // If first byte is a small number (1-10), it might be the vector length
      if (firstByte >= 1 && firstByte <= 10) {
        console.log(`🔍 Detected BCS vector with ${firstByte} applications in single byte array (${byteArray.length} bytes)`);
        
        // Try to decode all applications from this byte array
        const decodedApps: ProjectApplication[] = [];
        
        // First, try decoding with offset 1 (skipping length byte) - this should give us the first application
        try {
          const firstAppBytes = byteArray.slice(1);
          const firstDecoded = decodeBCSProjectApplication(firstAppBytes, projectId);
          
          if (firstDecoded && firstDecoded.applicantAddress && firstDecoded.applicantAddress.length === 66) {
            console.log(`✅ Decoded first application from vector`);
            decodedApps.push(firstDecoded);
            
            // If there are more applications, try to find and decode them
            if (firstByte > 1) {
              // Try different offsets to find the second application
              // Start from a reasonable offset (first app is typically 400-800 bytes)
              for (let testOffset = 400; testOffset < byteArray.length - 100; testOffset += 50) {
                try {
                  const secondAppBytes = byteArray.slice(testOffset);
                  const secondDecoded = decodeBCSProjectApplication(secondAppBytes, projectId);
                  
                  if (secondDecoded && secondDecoded.applicantAddress && secondDecoded.applicantAddress.length === 66 &&
                      secondDecoded.applicantAddress !== firstDecoded.applicantAddress) {
                    console.log(`✅ Decoded second application from vector at offset ${testOffset}`);
                    decodedApps.push(secondDecoded);
                    break;
                  }
                } catch (e) {
                  // Continue trying different offsets
                }
              }
            }
          }
        } catch (e) {
          console.warn(`⚠️ Error decoding applications from vector:`, e);
        }
        
        if (decodedApps.length > 0) {
          console.log(`✅ Successfully decoded ${decodedApps.length} applications from BCS vector`);
          applications = decodedApps;
          // Skip the map processing below
        } else {
          // Fall through to normal processing
          console.log(`⚠️ Could not decode applications from vector, falling back to normal processing`);
        }
      }
    }
    
    // Parse each application in the vector (if not already decoded above)
    if (applications.length === 0) {
      console.log(`📊 Starting to parse ${vectorData.length} applications from vector data`);
      const parsedApps = vectorData
        .map((item: any, index: number) => {
        try {
          console.log(`🔍 Parsing application ${index + 1}/${vectorData.length}:`, typeof item, Array.isArray(item) ? `array[${item.length}]` : 'object');

          // If item is already an object with expected fields
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            // Check if it has struct fields (like fields.id, fields.applicant_address, etc.)
            if (item.fields) {
              const fields = item.fields;
              try {
                // Helper to safely get and parse string fields
                const getStringField = (fieldName: string): string => {
                  const value = fields[fieldName];
                  if (!value) return '';
                  if (typeof value === 'string') return value;
                  
                  // Handle byte arrays (BCS-encoded strings)
                  if (Array.isArray(value) && value.every((v: any) => typeof v === 'number')) {
                    try {
                      return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(value));
                    } catch {
                      return '';
                    }
                  }
                  
                  const parsed = parseReturnValue(value);
                  return typeof parsed === 'string' ? parsed : String(parsed || '');
                };

                // Helper to safely get and parse address fields
                const getAddressField = (fieldName: string): string => {
                  const value = fields[fieldName];
                  if (!value) return '';
                  if (typeof value === 'string' && value.startsWith('0x')) return value;
                  return bytesToHexAddress(value);
                };

                // Helper to safely get and parse ID fields
                const getIdField = (fieldName: string): string => {
                  const value = fields[fieldName];
                  if (!value) return '';
                  if (typeof value === 'object' && value.id) return String(value.id);
                  return String(value);
                };

                // Helper to safely get and parse Option fields
                const getOptionField = (fieldName: string): string | undefined => {
                  const value = fields[fieldName];
                  if (!value) return undefined;
                  // Handle Option<String> - could be { Some: value } or just the value
                  if (typeof value === 'object' && value.Some !== undefined) {
                    const parsed = parseReturnValue(value.Some);
                    return typeof parsed === 'string' ? parsed : undefined;
                  }
                  const parsed = parseReturnValue(value);
                  return typeof parsed === 'string' ? parsed : undefined;
                };

                // Helper to safely parse numbers from various formats
                const safeParseNumber = (value: any, defaultValue: number = 0): number => {
                  if (typeof value === 'number') return value;
                  if (typeof value === 'bigint') return Number(value);
                  if (typeof value === 'string') {
                    const num = Number(value);
                    return isNaN(num) ? defaultValue : num;
                  }
                  // Try parseU64Value for BCS-encoded numbers
                  return parseU64Value(value) || defaultValue;
                };

                // Helper to parse start date - might be timestamp or date string
                const parseStartDate = (): string => {
                  const dateValue = fields.start_date;
                  if (!dateValue) return '';
                  
                  const dateStr = getStringField('start_date');
                  if (!dateStr) return '';
                  
                  // If it's a numeric string (timestamp), try to convert
                  if (/^\d+$/.test(dateStr)) {
                    const timestamp = Number(dateStr);
                    if (!isNaN(timestamp)) {
                      // Check if it's in milliseconds or seconds
                      const date = timestamp > 1000000000000 
                        ? new Date(timestamp) 
                        : new Date(timestamp * 1000);
                      if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
                      }
                    }
                  }
                  
                  // If it's already a date string, return as-is
                  return dateStr;
                };

        const app: ProjectApplication = {
          id: getIdField('id'),
          projectId: String(projectId),
          projectObjectId: getIdField('project_id'),
                  applicantAddress: getAddressField('applicant_address'),
                  yourRole: getStringField('your_role'),
                  availabilityHrsPerWeek: safeParseNumber(fields.availability_hrs_per_week, 0),
                  startDate: parseStartDate(),
                  expectedDurationWeeks: safeParseNumber(fields.expected_duration_weeks, 0),
                  proposalSummary: getStringField('proposal_summary'),
                  requestedCompensation: safeParseNumber(fields.requested_compensation, 0),
                  milestonesCount: safeParseNumber(fields.milestones_count, 0),
                  githubRepoLink: getStringField('github_repo_link'),
                  onChainAddress: getAddressField('on_chain_address'),
                  teamMembers: Array.isArray(fields.team_members)
                    ? fields.team_members.map((m: any) => {
                        if (Array.isArray(m) && m.every((v: any) => typeof v === 'number')) {
                          try {
                            return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(m));
                          } catch {
                            return String(m);
                          }
                        }
                        const parsed = parseReturnValue(m);
                        return typeof parsed === 'string' ? parsed : String(parsed || '');
                      })
                    : [],
                  applicationStatus: getStringField('application_status') || 'Pending',
                  submissionTimestamp: safeParseNumber(fields.submission_timestamp, 0),
                  coverLetterWalrusBlobId: getOptionField('cover_letter_walrus_blob_id'),
                  portfolioWalrusBlobIds: Array.isArray(fields.portfolio_walrus_blob_ids)
                    ? fields.portfolio_walrus_blob_ids.map((p: any) => {
                        if (Array.isArray(p) && p.every((v: any) => typeof v === 'number')) {
                          try {
                            return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(p));
                          } catch {
                            return String(p);
                          }
                        }
                        const parsed = parseReturnValue(p);
                        return typeof parsed === 'string' ? parsed : String(parsed || '');
                      })
                    : [],
                  proposalId: fields.proposal_id ? getIdField('proposal_id') : undefined,
                };
                console.log(`✅ Parsed application ${index} from struct fields:`, {
                  id: app.id,
                  applicantAddress: app.applicantAddress,
                  yourRole: app.yourRole,
                  proposalSummary: app.proposalSummary?.substring(0, 50),
                  applicationStatus: app.applicationStatus,
                  startDate: app.startDate,
                  requestedCompensation: app.requestedCompensation,
                  expectedDurationWeeks: app.expectedDurationWeeks,
                  availabilityHrsPerWeek: app.availabilityHrsPerWeek,
                  rawFields: Object.keys(fields),
                  rawFieldValues: {
                    requested_compensation: fields.requested_compensation,
                    expected_duration_weeks: fields.expected_duration_weeks,
                    availability_hrs_per_week: fields.availability_hrs_per_week,
                    start_date: fields.start_date,
                  }
                });
                return app;
              } catch (e) {
                console.error(`❌ Error parsing application ${index} from struct fields:`, e, fields);
              }
            }
            
            // Try the existing parseProjectApplication function
            if (item.id || item.applicantAddress || item.yourRole) {
              const parsed = parseProjectApplication(item);
              if (parsed) {
                console.log(`✅ Parsed application ${index} as object`);
                return parsed;
              }
            }
          }

          // If item is an array, it might be a BCS-encoded byte array
          if (Array.isArray(item)) {
            console.log(`🔍 Item ${index} is array with ${item.length} elements`);

            // Check if this is a raw BCS byte array (all numbers 0-255)
            const isByteArray = item.length > 100 && item.every((v: any) => typeof v === 'number' && v >= 0 && v <= 255);
            
            if (isByteArray) {
              // This might be a BCS-encoded vector containing multiple applications
              // Check if first byte is a small number (vector length indicator)
              const firstByte = item[0];
              const mightBeVectorLength = firstByte >= 1 && firstByte <= 10;
              
              if (mightBeVectorLength && index === 0) {
                // This is likely a BCS-encoded vector - decode all applications from it
                console.log(`🔍 Detected BCS vector byte array (${item.length} bytes, length indicator: ${firstByte}), decoding all applications...`);
                
                const decodedApplications: ProjectApplication[] = [];
                let currentOffset = 1; // Skip the length byte
                
                // Try to decode multiple applications
                for (let appIndex = 0; appIndex < firstByte && currentOffset < item.length; appIndex++) {
                  try {
                    const remainingBytes = item.slice(currentOffset);
                    const decoded = decodeBCSProjectApplication(remainingBytes, projectId);
                    
                    if (decoded && decoded.applicantAddress && decoded.applicantAddress.length === 66 && decoded.applicantAddress.startsWith('0x')) {
                      // Calculate how many bytes this application consumed
                      // This is approximate - we'll need to track the offset properly
                      console.log(`✅ Decoded application ${appIndex + 1} from vector at offset ${currentOffset}`);
                      decodedApplications.push(decoded);
                      
                      // Estimate bytes consumed (this is rough - actual size varies)
                      // For now, we'll decode one at a time and the decoder will handle offsets
                      // We need to modify decodeBCSProjectApplication to return the bytes consumed
                      // For now, let's just return the first one and handle the rest differently
                      if (appIndex === 0) {
                        // Return first application, but we need to handle multiple
                        // For now, return null here and handle it in a different way
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Failed to decode application ${appIndex + 1} from vector:`, e);
                    break;
                  }
                }
                
                // If we decoded multiple applications, we need to return them all
                // But the map function expects one return per item
                // So we'll return the first one here, and the rest will be handled by processing the vector differently
                if (decodedApplications.length > 0) {
                  // Return first application
                  return decodedApplications[0];
                }
              }
              
              // This is a BCS-encoded struct byte array - decode it
              console.log(`🔍 Detected BCS byte array (${item.length} bytes), decoding...`);
              
              // Try decoding with original offset
              let decoded = null;
              try {
                decoded = decodeBCSProjectApplication(item, projectId);
                // Validate decoded values make sense
                if (decoded && decoded.applicantAddress && decoded.applicantAddress.length === 66 && decoded.applicantAddress.startsWith('0x')) {
                  // Address looks valid, check other fields
                  if (decoded.requestedCompensation > 0 && decoded.requestedCompensation < 1000000000 && 
                      decoded.availabilityHrsPerWeek > 0 && decoded.availabilityHrsPerWeek < 200) {
                    console.log(`✅ Parsed application ${index} from BCS byte array:`, {
                      id: decoded.id,
                      applicantAddress: decoded.applicantAddress,
                      yourRole: decoded.yourRole,
                      requestedCompensation: decoded.requestedCompensation,
                      expectedDurationWeeks: decoded.expectedDurationWeeks,
                      availabilityHrsPerWeek: decoded.availabilityHrsPerWeek,
                      startDate: decoded.startDate,
                    });
                    return decoded;
                  } else {
                    console.warn(`⚠️ Decoded values don't look valid, trying alternative offset...`);
                    decoded = null;
                  }
                }
              } catch (e) {
                console.error(`❌ Error decoding BCS byte array for application ${index}:`, e);
              }
              
              // If decoding failed or values don't make sense, try skipping first byte
              if (!decoded && item.length > 1 && item[0] < 10) {
                console.log(`🔍 Trying BCS decode with offset 1 (skipping first byte ${item[0]})...`);
                try {
                  const itemWithoutFirst = item.slice(1);
                  decoded = decodeBCSProjectApplication(itemWithoutFirst, projectId);
                  if (decoded && decoded.applicantAddress && decoded.applicantAddress.length === 66) {
                    console.log(`✅ Parsed application ${index} from BCS byte array (with offset):`, {
                      id: decoded.id,
                      applicantAddress: decoded.applicantAddress,
                      yourRole: decoded.yourRole,
                    });
                    return decoded;
                  }
                } catch (e2) {
                  console.error(`❌ Error decoding with offset:`, e2);
                }
              }
              
              // If BCS decoding failed completely, don't try the fallback parser on byte arrays
              // as it will produce incorrect results
              if (!decoded && isByteArray) {
                console.warn(`⚠️ BCS decoding failed for byte array, skipping fallback parser to avoid incorrect data`);
                return null;
              }
            }

            // Try to extract fields - the structure depends on BCS encoding
            // Only do this if it's NOT a raw byte array (which should be handled by BCS decoder above)
            if (!isByteArray) {
            // ProjectApplication has 18 fields (including UID)
            // The first element might be the UID, or it might be skipped

            // Try different field arrangements
            let fields = item;

            // If first element is an array (nested structure)
            if (item.length > 0 && Array.isArray(item[0])) {
              fields = item[0];
            }

            // Try to parse assuming fields are in struct order
            // Based on Move struct: id (UID), project_id (ID), applicant_address (address), 
            // your_role (String), availability_hrs_per_week (u64), start_date (String), etc.
            try {
              // Helper to safely parse string fields
              const parseStringField = (field: any): string => {
                if (!field) return '';
                if (typeof field === 'string') return field;
                
                // Handle byte arrays (BCS-encoded strings)
                if (Array.isArray(field) && field.every((v: any) => typeof v === 'number')) {
                  try {
                    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(field));
                  } catch {
                    return '';
                  }
                }
                
                const parsed = parseReturnValue(field);
                return typeof parsed === 'string' ? parsed : '';
              };

              // Helper to safely parse number fields
              const parseNumberField = (field: any): number => {
                if (typeof field === 'number') return field;
                if (typeof field === 'bigint') return Number(field);
                if (typeof field === 'string') {
                  const num = Number(field);
                  return isNaN(num) ? 0 : num;
                }
                // Try parseU64Value for BCS-encoded numbers
                const parsed = parseU64Value(field);
                return parsed || 0;
              };

              // Helper to safely parse address fields
              const parseAddressField = (field: any): string => {
                if (!field) return '';
                if (typeof field === 'string' && field.startsWith('0x')) return field;
                return bytesToHexAddress(field);
              };

              // Helper to safely parse ID fields
              const parseIdField = (field: any): string => {
                if (!field) return '';
                if (typeof field === 'object' && field.id) return String(field.id);
                return String(field);
              };

              // Based on the Move struct order:
              // 0: id (UID)
              // 1: project_id (ID)
              // 2: applicant_address (address)
              // 3: your_role (String)
              // 4: availability_hrs_per_week (u64)
              // 5: start_date (String)
              // 6: expected_duration_weeks (u64)
              // 7: proposal_summary (String)
              // 8: requested_compensation (u64)
              // 9: milestones_count (u64)
              // 10: github_repo_link (String)
              // 11: on_chain_address (address)
              // 12: team_members (vector<String>)
              // 13: application_status (String)
              // 14: submission_timestamp (u64)
              // 15: cover_letter_walrus_blob_id (Option<String>)
              // 16: portfolio_walrus_blob_ids (vector<String>)
              // 17: proposal_id (Option<ID>)

              // Helper to parse start date - might be timestamp or date string
              const parseStartDateFromField = (field: any): string => {
                const dateStr = parseStringField(field);
                if (!dateStr) return '';
                
                // If it's a numeric string (timestamp), try to convert
                if (/^\d+$/.test(dateStr)) {
                  const timestamp = Number(dateStr);
                  if (!isNaN(timestamp)) {
                    // Check if it's in milliseconds or seconds
                    const date = timestamp > 1000000000000 
                      ? new Date(timestamp) 
                      : new Date(timestamp * 1000);
                    if (!isNaN(date.getTime())) {
                      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
                    }
                  }
                }
                
                // If it's already a date string, return as-is
                return dateStr;
              };

              const app: ProjectApplication = {
                id: parseIdField(fields[0]),
                projectId: String(projectId),
                projectObjectId: parseIdField(fields[1]),
                applicantAddress: parseAddressField(fields[2]),
                yourRole: parseStringField(fields[3]),
                availabilityHrsPerWeek: parseNumberField(fields[4]),
                startDate: parseStartDateFromField(fields[5]),
                expectedDurationWeeks: parseNumberField(fields[6]),
                proposalSummary: parseStringField(fields[7]),
                requestedCompensation: parseNumberField(fields[8]),
                milestonesCount: parseNumberField(fields[9]),
                githubRepoLink: parseStringField(fields[10]),
                onChainAddress: parseAddressField(fields[11]),
                teamMembers: Array.isArray(fields[12])
                  ? fields[12].map((m: any) => parseStringField(m))
                  : [],
                applicationStatus: parseStringField(fields[13]) || 'Pending',
                submissionTimestamp: parseNumberField(fields[14]),
                coverLetterWalrusBlobId: fields[15] ? parseStringField(fields[15]) : undefined,
                portfolioWalrusBlobIds: Array.isArray(fields[16])
                  ? fields[16].map((p: any) => parseStringField(p))
                  : [],
                proposalId: fields[17] ? parseIdField(fields[17]) : undefined,
              };

              console.log(`✅ Parsed application ${index} from array:`, {
                id: app.id,
                applicantAddress: app.applicantAddress,
                yourRole: app.yourRole,
                proposalSummary: app.proposalSummary?.substring(0, 50),
                applicationStatus: app.applicationStatus,
                startDate: app.startDate,
                requestedCompensation: app.requestedCompensation,
                expectedDurationWeeks: app.expectedDurationWeeks,
                availabilityHrsPerWeek: app.availabilityHrsPerWeek,
                fieldsLength: fields.length,
                rawFieldSamples: {
                  field4: fields[4],
                  field5: fields[5],
                  field6: fields[6],
                  field8: fields[8],
                }
              });
              return app;
            } catch (e) {
              console.error(`❌ Error parsing application ${index} from array:`, e, item);
              return null;
            }
            } // End of !isByteArray check
            } // End of Array.isArray(item) check

          console.log(`⚠️ Could not parse application ${index}`);
          return null;
        } catch (e) {
          console.error(`❌ Error processing application ${index}:`, e, item);
          return null;
        }
      });
      applications = parsedApps.filter((app): app is ProjectApplication => app !== null);
    }
    
    // Filter out invalid applications
    applications = applications
      .filter((app: ProjectApplication | null): app is ProjectApplication => {
        if (app === null) {
          console.log(`⚠️ Filtered out null application`);
          return false;
        }
        if (!app.applicantAddress || app.applicantAddress === '') {
          console.log(`⚠️ Filtered out application with empty applicantAddress:`, app.id);
          return false;
        }
        return true;
      });

    console.log(`✅ Successfully parsed ${applications.length} applications out of ${vectorData.length} items:`, applications.map(a => ({
      id: a.id,
      applicant: a.applicantAddress,
      role: a.yourRole,
      status: a.applicationStatus,
    })));
    
    if (applications.length < vectorData.length) {
      console.warn(`⚠️ Warning: Only parsed ${applications.length} out of ${vectorData.length} applications. Some may have failed to parse.`);
    }
    
    return applications;
  } catch (error) {
    console.error('❌ Error getting project applications:', error);
    return [];
  }
}

// Get detailed analytics
