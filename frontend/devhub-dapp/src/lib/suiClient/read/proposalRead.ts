import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '../constants';
import { CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';
import { parseReturnValue, bytesToHexAddress } from '../utils';
import { Proposal } from '../types';

export async function getProposalDetails(proposalId: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_PROPOSAL_DETAILS}`,
          arguments: [
            tx.object(proposalId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as Proposal;
    }
    return null;
  } catch (error) {
    console.error('Error getting proposal details:', error);
    return null;
  }
}

export async function getUserProposals(userProposalsId: string) {
  try {
    console.log('🔍 Fetching user proposals from:', userProposalsId);
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_USER_PROPOSALS}`,
          arguments: [
            tx.object(userProposalsId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('📥 Raw getUserProposals result:', JSON.stringify(result, null, 2));

    if (!result.results?.[0]?.returnValues) {
      console.log('⚠️ No return values found for getUserProposals');
      return [];
    }

    const returnValue = result.results[0].returnValues[0];
    console.log('📊 getUserProposals return value:', JSON.stringify(returnValue, null, 2));

    // The contract returns &vector<ID>
    // Handle different return value formats
    let proposalIds: string[] = [];

    // If it's [type, data] format
    if (Array.isArray(returnValue) && returnValue.length === 2) {
      const [type, data] = returnValue;
      console.log('📦 Type:', type, 'Data:', data);
      if (Array.isArray(data)) {
        proposalIds = data.map((id: any) => {
          // ID can be a string, object with id field, or byte array
          if (typeof id === 'string') return id;
          if (typeof id === 'object' && id.id) return String(id.id);
          if (Array.isArray(id)) {
            // Try to parse as address/ID
            return bytesToHexAddress(id);
          }
          return String(id);
        }).filter(id => id && id !== '');
      }
    } else if (Array.isArray(returnValue)) {
      // Direct array of IDs
      proposalIds = returnValue.map((id: any) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id.id) return String(id.id);
        if (Array.isArray(id)) {
          return bytesToHexAddress(id);
        }
        return String(id);
      }).filter(id => id && id !== '');
    } else if (returnValue && typeof returnValue === 'object') {
      // Might be an object with a 'data' field
      const data = returnValue.data || returnValue.value || returnValue;
      if (Array.isArray(data)) {
        proposalIds = data.map((id: any) => {
          if (typeof id === 'string') return id;
          if (typeof id === 'object' && id.id) return String(id.id);
          if (Array.isArray(id)) {
            return bytesToHexAddress(id);
          }
          return String(id);
        }).filter(id => id && id !== '');
      }
    }

    console.log(`✅ Parsed ${proposalIds.length} proposal IDs:`, proposalIds);
    return proposalIds;
  } catch (error) {
    console.error('❌ Error getting user proposals:', error);
    return [];
  }
}

export async function getProposalsByStatus(proposalsByStatusId: string, status: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_PROPOSALS_BY_STATUS}`,
          arguments: [
            tx.object(proposalsByStatusId),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(status))),
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
    console.error('Error getting proposals by status:', error);
    return [];
  }
}
