import { useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { DEVHUB_OBJECT_ID, PACKAGE_ID, CONTRACT_FUNCTIONS, DevCardData } from '../lib/suiClient';

export function useContract() {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Get card count
  const getCardCount = async (): Promise<number> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
        arguments: [tx.object(DEVHUB_OBJECT_ID)],
      });

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || '0x0',
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [bytes] = result.results[0].returnValues[0];
        return parseInt(bytes.toString());
      }
      return 0;
    } catch (err) {
      console.error('Error getting card count:', err);
      return 0;
    }
  };

  // Get card info by ID
  const getCardInfo = async (cardId: number): Promise<DevCardData | null> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
        arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.u64(cardId)],
      });

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || '0x0',
      });

      if (result.results?.[0]?.returnValues) {
        const values = result.results[0].returnValues;
        // Parse the returned values according to the contract structure
        return {
          id: cardId,
          name: new TextDecoder().decode(new Uint8Array(values[0][0])),
          owner: values[1][0].toString(),
          title: new TextDecoder().decode(new Uint8Array(values[2][0])),
          imageUrl: new TextDecoder().decode(new Uint8Array(values[3][0])),
          description: values[4][0] ? new TextDecoder().decode(new Uint8Array(values[4][0])) : undefined,
          yearsOfExperience: parseInt(values[5][0].toString()),
          technologies: new TextDecoder().decode(new Uint8Array(values[6][0])),
          portfolio: new TextDecoder().decode(new Uint8Array(values[7][0])),
          contact: new TextDecoder().decode(new Uint8Array(values[8][0])),
          openToWork: Boolean(values[9][0]),
        };
      }
      return null;
    } catch (err) {
      console.error('Error getting card info:', err);
      return null;
    }
  };

  // Get all cards
  const getAllCards = async (): Promise<DevCardData[]> => {
    try {
      const count = await getCardCount();
      const cards: DevCardData[] = [];
      
      for (let i = 1; i <= count; i++) {
        const card = await getCardInfo(i);
        if (card) {
          cards.push(card);
        }
      }
      
      return cards;
    } catch (err) {
      console.error('Error getting all cards:', err);
      return [];
    }
  };

  // Get user's cards
  const getUserCards = async (userAddress: string): Promise<DevCardData[]> => {
    try {
      const allCards = await getAllCards();
      return allCards.filter(card => card.owner === userAddress);
    } catch (err) {
      console.error('Error getting user cards:', err);
      return [];
    }
  };

  // Check if user is admin
  const isAdmin = async (address: string): Promise<boolean> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.IS_ADMIN}`,
        arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.address(address)],
      });

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || '0x0',
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        return Boolean(result.results[0].returnValues[0][0]);
      }
      return false;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };

  // Get platform fee balance
  const getPlatformFeeBalance = async (): Promise<number> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::devcard::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
        arguments: [tx.object(DEVHUB_OBJECT_ID)],
      });

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || '0x0',
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [bytes] = result.results[0].returnValues[0];
        return parseInt(bytes.toString());
      }
      return 0;
    } catch (err) {
      console.error('Error getting platform fee balance:', err);
      return 0;
    }
  };

  return {
    loading,
    error,
    getCardCount,
    getCardInfo,
    getAllCards,
    getUserCards,
    isAdmin,
    getPlatformFeeBalance,
  };
}