import { useState, useCallback, useMemo } from "react";
import {
  searchCardsBySkill,
  searchCardsByLocation,
  searchCardsByWorkType,
  searchCardsByNiche,
  searchProjectsBySkill,
  getAvailableDevelopers,
  getOpenProjects,
  getUIUXDesigners,
  getContentCreators,
  getDevOpsProfessionals,
  getProjectManagers,
  getCommunityManagers,
  getDevelopmentDirectors,
  getProductManagers,
  getMarketingSpecialists,
  getBusinessAnalysts,
  getCustomNiches,
  getAllNichesInUse,
  getAvailableNiches,
  isCustomNiche,
  getProposalDetails,
  getUserProposals,
  getProposalsByStatus,
  getPlatformStatistics,
  isConnected,
} from "../lib/suiClient";
import { useContractCache } from "./useContractCache";
import { useContractAdmin } from "./useContractAdmin";
import { useContractPlatform } from "./useContractPlatform";
import { useContractWalrus } from "./useContractWalrus";
import { useContractProjects } from "./useContractProjects";
import { useContractSearch } from "./useContractSearch";
import { useContractCards } from "./useContractCards";
import { useContractMessaging } from "./useContractMessaging";
import { MAX_RETRIES, RETRY_DELAY } from "./useContractUtils";

interface UseContractState {
  loading: boolean;
  error: string | null;
  cardCount: number | null;
  projectCount: number | null;
  lastFetch: number | null;
  walrusUploading: boolean;
  walrusProgress: string;
  channels: any[];
  channelLoading: boolean;
  channelError: string | null;
}

export function useContract() {

  const [state, setState] = useState<UseContractState>({
    loading: false,
    error: null,
    cardCount: null,
    projectCount: null,
    lastFetch: null,
    walrusUploading: false,
    walrusProgress: "",
    channels: [],
    channelLoading: false,
    channelError: null,
  });

  // Initialize cache
  const { cacheRef, clearCache, getCacheStats } = useContractCache();

  // Create retry function
  const withRetry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error as Error;

          if (attempt === MAX_RETRIES) {
            throw lastError;
          }

          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
    },
    [],
  );

  // Initialize all modules
  const adminModule = useContractAdmin(cacheRef, withRetry);
  const platformModule = useContractPlatform(cacheRef, withRetry, setState);
  const walrusModule = useContractWalrus(setState);
  const projectsModule = useContractProjects(cacheRef, withRetry);
  const searchModule = useContractSearch(cacheRef);
  const cardsModule = useContractCards(cacheRef, withRetry, setState);
  const messagingModule = useContractMessaging(cacheRef);

  // Error state setter for external use
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Memoized return object to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      // State
      loading: state.loading,
      error: state.error,
      cardCount: state.cardCount,
      projectCount: state.projectCount,
      lastFetch: state.lastFetch,

      // Walrus state
      walrusUploading: state.walrusUploading,
      walrusProgress: state.walrusProgress,

      // Card functions
      getCardCount: cardsModule.getCardCount,
      getCardInfo: cardsModule.getCardInfo,
      getAllCards: cardsModule.getAllCards,
      getSampleCards: cardsModule.getSampleCards,
      getAllActiveCards: cardsModule.getAllActiveCards,
      getCardsOpenToWork: cardsModule.getCardsOpenToWork,
      getUserCards: cardsModule.getUserCards,
      isCardActive: cardsModule.isCardActive,
      isCardOpenToWork: cardsModule.isCardOpenToWork,

      // Walrus functions
      isWalrusUrl: walrusModule.isWalrusUrl,
      uploadToWalrus: walrusModule.uploadToWalrus,
      uploadUrlToWalrus: walrusModule.uploadUrlToWalrus,
      getWalrusBlob: walrusModule.getWalrusBlob,

      // Admin functions
      isAdmin: adminModule.isAdmin,
      isSuperAdmin: adminModule.isSuperAdmin,
      getSuperAdmin: adminModule.getSuperAdmin,
      getAdmins: adminModule.getAdmins,

      // Platform functions
      getPlatformFee: platformModule.getPlatformFee,
      getPlatformFeeBalance: platformModule.getPlatformFeeBalance,

      // Project functions
      getProjectInfo: projectsModule.getProjectInfo,
      getProjectApplications: projectsModule.getProjectApplications,

      // Search functions
      searchCards: searchModule.searchCards,
      searchCardsBySkill,
      searchCardsByLocation,
      searchCardsByWorkType,
      searchCardsByNiche,
      searchProjectsBySkill,
      getAvailableDevelopers,
      getOpenProjects,
      getUIUXDesigners,
      getContentCreators,
      getDevOpsProfessionals,
      getProjectManagers,
      getCommunityManagers,
      getDevelopmentDirectors,
      getProductManagers,
      getMarketingSpecialists,
      getBusinessAnalysts,
      getCustomNiches,
      getAllNichesInUse,
      getAvailableNiches,
      isCustomNiche,

      // Proposal functions
      getProposalDetails,
      getUserProposals,
      getProposalsByStatus,
      getPlatformStatistics,

      // Messaging functions (New SDK)
      createMessagingChannel: messagingModule.createMessagingChannel,
      getUserMemberships: messagingModule.getUserMemberships,
      getChannelObjects: messagingModule.getChannelObjects,
      sendMessage: messagingModule.sendMessage,
      getChannelMessages: messagingModule.getChannelMessages,

      // Additional channel management functions
      getUserChannelMemberships: messagingModule.getUserChannelMemberships,
      getChannelDetails: messagingModule.getChannelDetails,
      getChannelMembers: async (channelId: string) => {
        const tx = await messagingModule.getChannelMembersTransaction(channelId);
        return tx;
      },
      getChannelMessagesTx: async (channelId: string) => {
        const tx = await messagingModule.getChannelMessagesTransaction(channelId);
        return tx;
      },

      // Legacy messaging functions
      getConversationMessages: messagingModule.getConversationMessages,
      useMessages: async (conversationId: string, participants?: string[]) => {
        return await messagingModule.getConversationMessages(conversationId, participants);
      },
      useConnections: messagingModule.useConnections,
      useConversations: messagingModule.useConversations,

      // Connection functions
      getConnections: messagingModule.getConnections,
      isConnected,

      // Channel management functions
      createChannelTransaction: messagingModule.createChannelTransaction,
      sendMessageToChannelTransaction: messagingModule.sendMessageToChannelTransaction,
      addMemberToChannelTransaction: messagingModule.addMemberToChannelTransaction,
      removeMemberFromChannelTransaction: messagingModule.removeMemberFromChannelTransaction,
      getChannelMessagesTransaction: messagingModule.getChannelMessagesTransaction,
      getChannelMembersTransaction: messagingModule.getChannelMembersTransaction,
      getChannelMessagesFromObject: messagingModule.getChannelMessagesFromObject,

      // Cache management
      clearCache,
      updateCardInCache: cardsModule.updateCardInCache,
      addCardToUserCache: cardsModule.addCardToUserCache,
      removeCardFromCache: cardsModule.removeCardFromCache,
      getCacheStats,

      // Utility
      setError,
    }),
    [
      state,
      cardsModule,
      walrusModule,
      adminModule,
      platformModule,
      projectsModule,
      searchModule,
      messagingModule,
      clearCache,
      getCacheStats,
      setError,
    ],
  );

  return returnValue;
}
