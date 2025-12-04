import { useCallback } from "react";
import {
  searchCardsBySkill,
  searchCardsByLocation,
  searchCardsByWorkType,
  searchCardsByNiche,
} from "../lib/suiClient";
import type { ContractCacheRef } from "./useContractCache";
import { isCacheValid, setCacheEntry } from "./useContractUtils";

export const useContractSearch = (
  cacheRef: React.MutableRefObject<ContractCacheRef>,
) => {
  const searchCards = useCallback(
    async (
      searchType: 'skill' | 'location' | 'workType' | 'niche',
      query: string,
      minProficiency?: number,
      forceRefresh: boolean = false
    ): Promise<number[]> => {
      const cacheKey = `${searchType}:${query}:${minProficiency || 0}`;
      const cached = cacheRef.current.searchResults.get(cacheKey) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        let results: number[];
        switch (searchType) {
          case 'skill':
            results = await searchCardsBySkill(query, minProficiency || 1);
            break;
          case 'location':
            results = await searchCardsByLocation(query);
            break;
          case 'workType':
            results = await searchCardsByWorkType(query);
            break;
          case 'niche':
            results = await searchCardsByNiche(query);
            break;
          default:
            results = [];
        }

        cacheRef.current.searchResults.set(cacheKey, setCacheEntry(results));
        return results;
      } catch (err) {
        console.error(`Error searching cards by ${searchType}:`, err);
        return [];
      }
    },
    [cacheRef],
  );

  return {
    searchCards,
  };
};

