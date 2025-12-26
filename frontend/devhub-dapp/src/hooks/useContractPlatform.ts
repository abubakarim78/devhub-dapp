import { useCallback } from "react";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS, getCurrentPackageId } from "../lib/suiClient";
import type { ContractCacheRef } from "./useContractCache";
import { isCacheValid, setCacheEntry } from "./useContractUtils";

export const useContractPlatform = (
  cacheRef: React.MutableRefObject<ContractCacheRef>,
  withRetry: <T>(operation: () => Promise<T>) => Promise<T>,
  setState: React.Dispatch<React.SetStateAction<any>>,
) => {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  const getPlatformFeeBalance = useCallback(
    async (forceRefresh: boolean = false): Promise<number> => {
      const cached = cacheRef.current.platformFeeBalance;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log("🔍 Fetching platform fee balance...");

        const balance = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE_BALANCE}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID)],
          });

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender: currentAccount?.address || "0x0",
          });

          console.log("📥 Platform fee balance result:", result);

          if (result.results?.[0]?.returnValues?.[0]) {
            const [bytes] = result.results[0].returnValues[0];
            console.log("📊 Raw bytes:", bytes);

            // Handle different byte formats for u64
            let balance: number;
            if (Array.isArray(bytes)) {
              // Convert little-endian byte array to number
              balance = bytes.reduce((acc, byte, index) => {
                return acc + byte * Math.pow(256, index);
              }, 0);
            } else if (typeof bytes === "string") {
              balance = parseInt(bytes);
            } else {
              balance = Number(bytes);
            }

            console.log("💰 Parsed balance:", balance, "MIST");
            return balance;
          }
          return 0;
        });

        cacheRef.current.platformFeeBalance = setCacheEntry(balance);
        return balance;
      } catch (err) {
        console.error("❌ Error getting platform fee balance:", err);
        setState((prev: any) => ({
          ...prev,
          error: "Failed to get platform fee balance",
        }));
        return 0;
      }
    },
    [client, currentAccount, cacheRef, withRetry, setState],
  );

  const getPlatformFee = useCallback(async (): Promise<number> => {
    // You can cache this if needed, but platform fee is usually a constant
    try {
      console.log("🔍 Fetching platform fee...");

      const fee = await withRetry(async () => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.GET_PLATFORM_FEE}`,
          arguments: [tx.object(DEVHUB_OBJECT_ID)],
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx as any,
          sender: currentAccount?.address || "0x0",
        });

        console.log("📥 Platform fee result:", result);

        if (result.results?.[0]?.returnValues?.[0]) {
          const [bytes] = result.results[0].returnValues[0];
          console.log("📊 Raw bytes:", bytes);

          // Handle different byte formats for u64
          let fee: number;
          if (Array.isArray(bytes)) {
            // Convert little-endian byte array to number
            fee = bytes.reduce((acc, byte, index) => {
              return acc + byte * Math.pow(256, index);
            }, 0);
          } else if (typeof bytes === "string") {
            fee = parseInt(bytes);
          } else {
            fee = Number(bytes);
          }

          console.log("💰 Parsed platform fee:", fee, "MIST");
          return fee;
        }
        return 0;
      });

      return fee;
    } catch (err) {
      console.error("❌ Error getting platform fee:", err);
      setState((prev: any) => ({ ...prev, error: "Failed to get platform fee" }));
      return 0;
    }
  }, [client, currentAccount, withRetry, setState]);

  return {
    getPlatformFeeBalance,
    getPlatformFee,
  };
};

