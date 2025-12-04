import { useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalrusService, type WalrusBlob } from "../services/walrus";

// Add Walrus-related interfaces
export interface WalrusUploadResult {
  blob: WalrusBlob;
  originalUrl?: string;
}

export const useContractWalrus = (
  setState: React.Dispatch<React.SetStateAction<any>>,
) => {
  const currentAccount = useCurrentAccount();

  const uploadToWalrus = useCallback(
    async (
      file: File,
      progressCallback?: (message: string) => void,
    ): Promise<WalrusUploadResult> => {
      // Client-side size guard to avoid 413 from publisher
      const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
      if (file.size > MAX_BYTES) {
        throw new Error(
          `File too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). ` +
          `Maximum allowed is 5 MB. Please compress the video or upload a smaller file.`
        );
      }

      setState((prev: any) => ({
        ...prev,
        walrusUploading: true,
        walrusProgress: "Uploading to Walrus...",
        error: null, // Clear any previous errors
      }));

      const updateProgress = (message: string) => {
        setState((prev: any) => ({ ...prev, walrusProgress: message }));
        progressCallback?.(message);
      };

      try {
        updateProgress("Uploading file to Walrus...");

        // Pass the user's address to ensure blob ownership
        const blob = await WalrusService.uploadFile(
          file,
          currentAccount?.address,
        );

        updateProgress("Upload successful! Waiting for blob certification...");

        const isCertified = await WalrusService.waitForBlobCertification(
          blob.blobId,
          updateProgress,
        );

        if (isCertified) {
          updateProgress("File uploaded and certified successfully!");
        } else {
          updateProgress(
            "File uploaded! Certification may take a few more moments.",
          );
        }

        // Clear progress after delay
        setTimeout(() => {
          setState((prev: any) => ({ ...prev, walrusProgress: "" }));
        }, 3000);

        return { blob };
      } catch (error) {
        console.error("Walrus upload failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev: any) => ({
          ...prev,
          walrusProgress: "",
          error: `Failed to upload to Walrus: ${errorMessage}`,
        }));
        throw error;
      } finally {
        setState((prev: any) => ({ ...prev, walrusUploading: false }));
      }
    },
    [currentAccount?.address, setState],
  );

  const uploadUrlToWalrus = useCallback(
    async (
      url: string,
      progressCallback?: (message: string) => void,
    ): Promise<WalrusUploadResult> => {
      if (!url.trim()) {
        throw new Error("Please provide a valid URL");
      }

      // Check if it's already a Walrus URL
      if (WalrusService.isWalrusUrl(url)) {
        throw new Error("This is already a Walrus URL");
      }

      setState((prev: any) => ({
        ...prev,
        walrusUploading: true,
        walrusProgress: "Fetching URL and uploading to Walrus...",
        error: null, // Clear any previous errors
      }));

      const updateProgress = (message: string) => {
        setState((prev: any) => ({ ...prev, walrusProgress: message }));
        progressCallback?.(message);
      };

      try {
        updateProgress("Fetching from URL and uploading to Walrus...");

        // Pass the user's address to ensure blob ownership
        const blob = await WalrusService.uploadFromUrl(
          url,
          currentAccount?.address,
        );

        updateProgress("Upload successful! Waiting for blob certification...");

        const isCertified = await WalrusService.waitForBlobCertification(
          blob.blobId,
          updateProgress,
        );

        if (isCertified) {
          updateProgress("URL content uploaded and certified successfully!");
        } else {
          updateProgress(
            "URL content uploaded! Certification may take a few more moments.",
          );
        }

        // Clear progress after delay
        setTimeout(() => {
          setState((prev: any) => ({ ...prev, walrusProgress: "" }));
        }, 3000);

        return { blob, originalUrl: url };
      } catch (error) {
        console.error("Walrus URL upload failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev: any) => ({
          ...prev,
          walrusProgress: "",
          error: `Failed to upload URL to Walrus: ${errorMessage}`,
        }));
        throw error;
      } finally {
        setState((prev: any) => ({ ...prev, walrusUploading: false }));
      }
    },
    [currentAccount?.address, setState],
  );

  // Check if URL is a Walrus URL
  const isWalrusUrl = useCallback((url: string): boolean => {
    return WalrusService.isWalrusUrl(url);
  }, []);

  // Get Walrus blob info
  const getWalrusBlob = useCallback(
    async (blobId: string): Promise<WalrusBlob | null> => {
      try {
        // This would need to be implemented in your WalrusService
        // For now, we'll create a basic blob object
        return {
          blobId,
          walrusUrl: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`,
        };
      } catch (error) {
        console.error("Error getting Walrus blob:", error);
        return null;
      }
    },
    [],
  );

  return {
    uploadToWalrus,
    uploadUrlToWalrus,
    isWalrusUrl,
    getWalrusBlob,
  };
};

