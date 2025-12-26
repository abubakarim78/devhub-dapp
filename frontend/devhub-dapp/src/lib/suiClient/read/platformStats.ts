import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '../constants';
import { DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';
import { parseReturnValue, parseU64Value, bytesToHexAddress } from '../utils';

export async function getPlatformStatistics(platformStatisticsId: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_STATISTICS}`,
          arguments: [
            tx.object(platformStatisticsId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      const returnValues = result.results[0].returnValues;
      return {
        totalSubmitted: Number(parseReturnValue(returnValues[0])),
        activeInReview: Number(parseReturnValue(returnValues[1])),
        acceptedCount: Number(parseReturnValue(returnValues[2])),
        rejectedCount: Number(parseReturnValue(returnValues[3])),
        declinedCount: Number(parseReturnValue(returnValues[4])),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting platform statistics:', error);
    return null;
  }
}

// Get total card count
export async function getCardCount(): Promise<number> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues?.[0]) {
      return parseU64Value(result.results[0].returnValues[0]);
    }
    return 0;
  } catch (error) {
    console.error('Error getting card count:', error);
    return 0;
  }
}

// Get current admin address

// Get super admin address
export async function getSuperAdmin(): Promise<string | null> {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_SUPER_ADMIN}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    console.log('Full result structure:', JSON.stringify(result, null, 2));

    if (result.results?.[0]?.returnValues?.[0]) {
      const addressData = result.results[0].returnValues[0];
      console.log('Super admin raw data:', addressData);
      console.log('Super admin data type:', typeof addressData);
      console.log('Super admin data is array:', Array.isArray(addressData));
      if (Array.isArray(addressData)) {
        console.log('Super admin array length:', addressData.length);
        console.log('Super admin first few elements:', addressData.slice(0, 10));
      }
      const convertedAddress = bytesToHexAddress(addressData);
      console.log('Super admin converted address:', convertedAddress);
      return convertedAddress;
    }
    return null;
  } catch (error) {
    console.error('Error getting super admin:', error);
    return null;
  }
}

// Get all admin addresses
