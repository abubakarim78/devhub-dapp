import { useCallback } from "react";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  DEVHUB_OBJECT_ID,
  PACKAGE_ID,
  CONTRACT_FUNCTIONS,
  DevCardData,
  FeaturedProject,
  SocialLinks,
  getCardSkills,
  getCardReviews,
  getWorkPreferences,
  getSocialLinks,
  getLanguages,
  getDetailedAnalytics,
} from "../lib/suiClient";
import { WalrusService } from "../services/walrus";
import type { ContractCacheRef } from "./useContractCache";
import { localStorageCache, CacheKeys, CacheTTL } from "../lib/cache/localStorageCache";
import {
  isCacheValid,
  setCacheEntry,
  bytesToHexAddress,
  safeDecodeText,
  cleanAboutText,
  safeDecodeUrl,
  parseMoveBool,
  BATCH_SIZE,
} from "./useContractUtils";

export const useContractCards = (
  cacheRef: React.MutableRefObject<ContractCacheRef>,
  withRetry: <T>(operation: () => Promise<T>) => Promise<T>,
  setState: React.Dispatch<React.SetStateAction<any>>,
) => {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  const getCardCount = useCallback(
    async (forceRefresh: boolean = false): Promise<number> => {
      const cached = cacheRef.current.cardCount;

      if (!forceRefresh && isCacheValid(cached)) {
        console.log(`📋 Using cached card count: ${cached.data}`);
        return cached.data;
      }

      try {
        console.log(`🔢 Fetching card count...`);

        const count = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID)],
          });

          console.log(
            `📤 Card count transaction target: ${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_COUNT}`,
          );

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender:
              currentAccount?.address ||
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          });

          console.log(`📥 Card count raw result:`, result);

          if (result.results?.[0]?.returnValues?.[0]) {
            const [bytes] = result.results[0].returnValues[0];
            const count = parseInt(bytes.toString());
            console.log(`📊 Parsed card count: ${count}`);
            return count;
          }

          console.log(`⚠️ No card count data found, returning 0`);
          return 0;
        });

        cacheRef.current.cardCount = setCacheEntry(count);
        setState((prev: any) => ({ ...prev, cardCount: count }));
        console.log(`✅ Final card count: ${count}`);
        return count;
      } catch (err) {
        console.error("❌ Error getting card count:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get card count";
        setState((prev: any) => ({ ...prev, error: errorMessage }));
        return 0;
      }
    },
    [client, currentAccount, cacheRef, withRetry, setState],
  );

  const getCardInfo = useCallback(
    async (
      cardId: number,
      forceRefresh: boolean = false,
    ): Promise<DevCardData | null> => {
      const cached = cacheRef.current.cards.get(cardId) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        console.log(`🔍 Fetching card info for ID: ${cardId}`);

        const cardData = await withRetry(async () => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
            arguments: [tx.object(DEVHUB_OBJECT_ID), tx.pure.u64(cardId)],
          });

          console.log(
            `📤 Transaction target: ${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CARD_INFO}`,
          );
          console.log(`📤 DevHub Object ID: ${DEVHUB_OBJECT_ID}`);
          console.log(`📤 Sender address: ${currentAccount?.address || "0x0"}`);

          const result = await client.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender:
              currentAccount?.address ||
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          });

          console.log(`📥 Raw result for card ${cardId}:`, result);

          if (result.results?.[0]?.returnValues) {
            const values = result.results[0].returnValues;
            console.log(`📊 Return values for card ${cardId}:`, values);

            const name = safeDecodeText(values[0]?.[0]);
            const owner = bytesToHexAddress(values[1]?.[0]);
            const niche = safeDecodeText(values[2]?.[0]);
            let imageUrl = safeDecodeUrl(values[3]?.[0]);
            const descriptionRaw = safeDecodeText(values[4]?.[0]);
            const description = cleanAboutText(descriptionRaw);
            const yearsOfExperience = values[5]?.[0]
              ? parseInt(values[5][0].toString())
              : 0;
            const technologies = safeDecodeText(values[6]?.[0]);
            const portfolio = safeDecodeUrl(values[7]?.[0]);
            const contact = safeDecodeText(values[8]?.[0]);
            const openToWork = parseMoveBool(values[9]?.[0]);
            const featuredProjectsRaw = values[10];
            const totalViews = values[11]?.[0] ? parseInt(values[11][0].toString()) : 0;
            const isActive = true;
            const walrusBlobIdRaw = values[12]?.[0];
            const walrusBlobId = safeDecodeText(walrusBlobIdRaw);

            const parseU64Timestamp = (value: any): number => {
              if (!value) return Date.now();
              if (typeof value === 'number') return value;
              if (typeof value === 'string') {
                const parsed = Number(value);
                if (!isNaN(parsed)) return parsed;
              }
              if (Array.isArray(value) && value.length === 8 && typeof value[0] === 'number') {
                let u64Value = 0n;
                for (let i = 0; i < 8; i++) {
                  u64Value += BigInt(value[i] || 0) << BigInt(i * 8);
                }
                return Number(u64Value);
              }
              if (Array.isArray(value) && value.length === 2 && Array.isArray(value[0]) && value[0].length === 8) {
                let u64Value = 0n;
                for (let i = 0; i < 8; i++) {
                  u64Value += BigInt(value[0][i] || 0) << BigInt(i * 8);
                }
                return Number(u64Value);
              }
              if (Array.isArray(value) && value.length === 2 && value[0] === 0) {
                if (typeof value[1] === 'number') return value[1];
                if (typeof value[1] === 'string') {
                  const parsed = Number(value[1]);
                  if (!isNaN(parsed)) return parsed;
                }
              }
              return Date.now();
            };

            const createdAt = values[13]?.[0] ? parseU64Timestamp(values[13][0]) : Date.now();
            const lastUpdated = values[14]?.[0] ? parseU64Timestamp(values[14][0]) : Date.now();
            if ((!imageUrl || imageUrl.trim() === "") && walrusBlobId) {
              imageUrl = WalrusService.getBlobUrl(walrusBlobId);
            }

            let featuredProjects: FeaturedProject[] = [];
            let actualData: any = featuredProjectsRaw;
            if (Array.isArray(featuredProjectsRaw) && featuredProjectsRaw.length === 2) {
              const [bcsBytes] = featuredProjectsRaw;
              actualData = bcsBytes;
            }

            const isByteArray = Array.isArray(actualData) &&
              actualData.length > 0 &&
              typeof actualData[0] === 'number' &&
              actualData.length > 10;

            if (isByteArray) {
              const byteArray = actualData as number[];
              let index = 0;
              let vectorLength = 0;
              let shift = 0;
              while (index < byteArray.length) {
                const byte = byteArray[index++];
                vectorLength |= (byte & 0x7F) << shift;
                if ((byte & 0x80) === 0) break;
                shift += 7;
              }

              for (let i = 0; i < vectorLength && index < byteArray.length; i++) {
                let strLength = 0;
                shift = 0;
                while (index < byteArray.length) {
                  const byte = byteArray[index++];
                  strLength |= (byte & 0x7F) << shift;
                  if ((byte & 0x80) === 0) break;
                  shift += 7;
                }

                if (index + strLength > byteArray.length) break;
                const textBytes = byteArray.slice(index, index + strLength);
                const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(textBytes));
                const trimmed = decoded.trim();
                if (trimmed.length > 0 && !trimmed.includes('vector') && !trimmed.includes('String')) {
                  try {
                    const parsed = JSON.parse(trimmed) as FeaturedProject;
                    featuredProjects.push(parsed);
                  } catch (parseError) {
                    console.warn(`⚠️ Failed to parse featured project JSON: "${trimmed}"`, parseError);
                  }
                }
                index += strLength;
              }
            } else {
              let vectorData: any = null;
              if (Array.isArray(actualData) && actualData.length === 2) {
                vectorData = actualData[1];
              } else if (Array.isArray(actualData)) {
                vectorData = actualData;
              } else if (actualData && typeof actualData === 'object') {
                if (Array.isArray(actualData[0])) {
                  vectorData = actualData[0];
                } else {
                  vectorData = actualData;
                }
              }

              if (vectorData && Array.isArray(vectorData)) {
                if (vectorData.length > 0 && Array.isArray(vectorData[0])) {
                  featuredProjects = vectorData
                    .map((p: any) => {
                      let decoded: string;
                      if (Array.isArray(p)) {
                        decoded = safeDecodeText(p);
                      } else if (typeof p === 'string') {
                        decoded = p.trim();
                      } else {
                        decoded = safeDecodeText(p);
                      }
                      return decoded;
                    })
                    .filter((p: string) => p && p.trim().length > 0 && !p.includes('vector') && !p.includes('String'))
                    .map((jsonStr: string) => {
                      try {
                        return JSON.parse(jsonStr) as FeaturedProject;
                      } catch (parseError) {
                        console.warn(`⚠️ Failed to parse featured project JSON: "${jsonStr}"`, parseError);
                        return null;
                      }
                    })
                    .filter((p: FeaturedProject | null): p is FeaturedProject => p !== null);
                } else {
                  featuredProjects = vectorData
                    .map((p: any) => {
                      let decoded: string;
                      if (typeof p === 'string') {
                        decoded = p.trim();
                      } else if (Array.isArray(p)) {
                        decoded = safeDecodeText(p);
                      } else {
                        decoded = safeDecodeText(p);
                      }
                      return decoded;
                    })
                    .filter((p: string) => p && p.trim().length > 0 && !p.includes('vector') && !p.includes('String'))
                    .map((jsonStr: string) => {
                      try {
                        return JSON.parse(jsonStr) as FeaturedProject;
                      } catch (parseError) {
                        console.warn(`⚠️ Failed to parse featured project JSON: "${jsonStr}"`, parseError);
                        return null;
                      }
                    })
                    .filter((p: FeaturedProject | null): p is FeaturedProject => p !== null);
                }
              } else if (typeof vectorData === 'string') {
                if (!vectorData.includes('vector') && !vectorData.includes('String')) {
                  try {
                    const parsed = JSON.parse(vectorData.trim()) as FeaturedProject;
                    featuredProjects = [parsed];
                  } catch (parseError) {
                    console.warn(`⚠️ Failed to parse featured project JSON: "${vectorData}"`, parseError);
                    featuredProjects = [];
                  }
                }
              }
            }

            const [skills, reviews, workPrefs, socialLinks, languages, analytics] = await Promise.all([
              getCardSkills(cardId).catch(() => []),
              getCardReviews(cardId).catch(() => []),
              getWorkPreferences(cardId).catch(() => null),
              getSocialLinks(cardId).catch(() => null),
              getLanguages(cardId).catch(() => []),
              getDetailedAnalytics(cardId).catch(() => null),
            ]);

            let parsedSkills: Array<{ skill: string; proficiency: number; yearsExperience: number }> = [];
            if (Array.isArray(skills)) {
              parsedSkills = skills.map((skill: any) => {
                if (typeof skill === 'object' && skill !== null) {
                  const skillName = skill.skill || skill.name || '';
                  const skillText = typeof skillName === 'string' ? skillName : safeDecodeText(skillName);
                  return {
                    skill: skillText,
                    proficiency: Number(skill.proficiency || skill.level || 0),
                    yearsExperience: Number(skill.years_experience || skill.yearsExperience || skill.years || 0),
                  };
                }
                return { skill: '', proficiency: 0, yearsExperience: 0 };
              }).filter(s => s.skill);
            }

            let parsedReviews: Array<{ reviewer: string; rating: number; review_text?: string; timestamp: number }> = [];
            if (Array.isArray(reviews) && reviews.length > 0) {
              parsedReviews = reviews.map((review: any) => {
                if (review && typeof review === 'object' && review.reviewer && review.rating) {
                  return {
                    reviewer: typeof review.reviewer === 'string' ? review.reviewer : bytesToHexAddress(review.reviewer),
                    rating: Number(review.rating),
                    review_text: review.review_text,
                    timestamp: Number(review.timestamp || 0),
                  };
                }
                if (typeof review === 'object' && review !== null) {
                  const reviewerAddr = review.reviewer
                    ? (typeof review.reviewer === 'string' ? review.reviewer : bytesToHexAddress(review.reviewer))
                    : '';
                  let reviewText: string | undefined = undefined;
                  if (review.review_text) {
                    if (typeof review.review_text === 'object' && review.review_text !== null) {
                      if (review.review_text.Some !== undefined) {
                        reviewText = typeof review.review_text.Some === 'string'
                          ? review.review_text.Some
                          : safeDecodeText(review.review_text.Some);
                      }
                    } else if (typeof review.review_text === 'string') {
                      reviewText = review.review_text;
                    }
                  }
                  return {
                    reviewer: reviewerAddr || '',
                    rating: Number(review.rating || 0),
                    review_text: reviewText,
                    timestamp: Number(review.timestamp || review.time || Date.now()),
                  };
                }
                return { reviewer: '', rating: 0, timestamp: Date.now() };
              }).filter(r => r.reviewer && r.rating > 0 && r.rating <= 5);
            }

            const parseOptionU64 = (value: any): number | undefined => {
              if (!value) return undefined;
              if (typeof value === 'object' && value !== null) {
                if (value.Some !== undefined) {
                  return Number(value.Some);
                }
                if (value.None !== undefined) return undefined;
              }
              if (typeof value === 'number') return value;
              const parsed = Number(value);
              return isNaN(parsed) ? undefined : parsed;
            };

            const parsedWorkPrefs = workPrefs && typeof workPrefs === 'object' ? {
              workTypes: Array.isArray((workPrefs as any).work_types)
                ? (workPrefs as any).work_types.map((wt: any) => typeof wt === 'string' ? wt : safeDecodeText(wt))
                : Array.isArray(workPrefs.workTypes) ? workPrefs.workTypes : [],
              locationPreference: (workPrefs as any).location_preference
                ? (typeof (workPrefs as any).location_preference === 'string' ? (workPrefs as any).location_preference : safeDecodeText((workPrefs as any).location_preference))
                : workPrefs.locationPreference || '',
              availability: workPrefs.availability
                ? (typeof workPrefs.availability === 'string' ? workPrefs.availability : safeDecodeText(workPrefs.availability))
                : '',
              hourlyRate: parseOptionU64((workPrefs as any).hourly_rate || workPrefs.hourlyRate),
            } : {
              workTypes: [],
              locationPreference: "",
              availability: "",
            };

            const parseOptionString = (value: any): string => {
              if (!value) return '';
              if (typeof value === 'object' && value !== null) {
                if (value.Some !== undefined) {
                  const val = value.Some;
                  if (typeof val === 'string') return val.trim();
                  if (Array.isArray(val)) {
                    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(val)).trim();
                  }
                  return safeDecodeText(val);
                }
                if (value.None !== undefined) return '';
                if (Array.isArray(value) && value.length > 0) {
                  if (value[0] === 0 && value.length > 1) {
                    const val = value[1];
                    if (typeof val === 'string') return val.trim();
                    if (Array.isArray(val)) {
                      return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(val)).trim();
                    }
                    return safeDecodeText(val);
                  }
                  if (value[0] === 1) {
                    return '';
                  }
                }
                if (typeof value === 'string') return value.trim();
              }
              if (typeof value === 'string') return value.trim();
              if (Array.isArray(value)) {
                return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(value)).trim();
              }
              return safeDecodeText(value);
            };

            let parsedSocialLinks: SocialLinks;
            if (socialLinks && typeof socialLinks === 'object') {
              const socialLinksAny = socialLinks as any;
              const hasStringProperties =
                (socialLinks.github === undefined || typeof socialLinks.github === 'string') &&
                (socialLinks.linkedin === undefined || typeof socialLinks.linkedin === 'string') &&
                (socialLinks.twitter === undefined || typeof socialLinks.twitter === 'string') &&
                (socialLinks.personalWebsite === undefined || typeof socialLinks.personalWebsite === 'string') &&
                (socialLinksAny.personal_website === undefined || typeof socialLinksAny.personal_website === 'string');

              if (hasStringProperties) {
                parsedSocialLinks = {
                  github: socialLinks.github || '',
                  linkedin: socialLinks.linkedin || '',
                  twitter: socialLinks.twitter || '',
                  personalWebsite: socialLinks.personalWebsite || socialLinksAny.personal_website || '',
                };
              } else {
                parsedSocialLinks = {
                  github: parseOptionString(socialLinks.github || socialLinksAny[0]),
                  linkedin: parseOptionString(socialLinks.linkedin || socialLinksAny[1]),
                  twitter: parseOptionString(socialLinks.twitter || socialLinksAny[2]),
                  personalWebsite: parseOptionString(socialLinksAny.personal_website || socialLinks.personalWebsite || socialLinksAny[3]),
                };
              }
            } else {
              parsedSocialLinks = {
                github: "",
                linkedin: "",
                twitter: "",
                personalWebsite: "",
              };
            }

            let parsedLanguages: string[] = [];
            if (languages && Array.isArray(languages)) {
              if (languages.length > 0 && Array.isArray(languages[0])) {
                parsedLanguages = languages
                  .map((lang: any) => {
                    if (Array.isArray(lang)) {
                      return safeDecodeText(lang);
                    }
                    if (typeof lang === 'string') return lang.trim();
                    return safeDecodeText(lang);
                  })
                  .filter((lang: string) => lang && lang.trim().length > 0);
              } else {
                parsedLanguages = languages
                  .map((lang: any) => {
                    if (typeof lang === 'string') {
                      return lang.trim();
                    }
                    if (Array.isArray(lang)) {
                      return safeDecodeText(lang);
                    }
                    return safeDecodeText(lang);
                  })
                  .filter((lang: string) => lang && lang.trim().length > 0);
              }
            }

            const analyticsAny = analytics as any;
            const parsedAnalytics = analytics ? {
              totalViews: Number(analyticsAny.total_views || analytics.totalViews || totalViews || 0),
              profileViews: Number(analyticsAny.profile_views || analytics.profileViews || 0),
              monthlyViews: Number(analyticsAny.monthly_views || (analytics as any).monthlyViews || 0),
              contactClicks: Number(analyticsAny.contact_clicks || analytics.contactClicks || 0),
              projectApplications: Number(analyticsAny.project_applications || analytics.projectApplications || 0),
              totalReviews: Number(analyticsAny.total_reviews || analytics.totalReviews || parsedReviews.length || 0),
              averageRating: Number(analyticsAny.average_rating || analytics.averageRating || 0),
              lastViewReset: Number(analyticsAny.last_view_reset || (analytics as any).lastViewReset || 0),
            } : {
              totalViews: totalViews || 0,
              profileViews: 0,
              monthlyViews: 0,
              contactClicks: 0,
              projectApplications: 0,
              totalReviews: parsedReviews.length,
              averageRating: parsedReviews.length > 0
                ? Math.round((parsedReviews.reduce((sum, r) => sum + r.rating, 0) / parsedReviews.length) * 100)
                : 0,
              lastViewReset: 0,
            };

            const cardData: DevCardData = {
              id: cardId,
              name,
              owner,
              niche,
              description,
              imageUrl,
              skills: parsedSkills,
              yearsOfExperience,
              technologies,
              workPreferences: parsedWorkPrefs,
              contact,
              socialLinks: parsedSocialLinks,
              portfolio,
              featuredProjects,
              languages: parsedLanguages,
              openToWork,
              isActive,
              verified: false,
              reviews: parsedReviews,
              createdAt: createdAt,
              lastUpdated: lastUpdated,
              analytics: parsedAnalytics,
            };

            if (!cardData.name || !cardData.owner) {
              throw new Error(`Invalid card data for ID ${cardId}`);
            }

            return cardData;
          }
          throw new Error(`No data found for card ID ${cardId}`);
        });

        cacheRef.current.cards.set(cardId, setCacheEntry(cardData));
        return cardData;
      } catch (err) {
        console.error(`❌ Error getting card info for ID ${cardId}:`, err);
        return null;
      }
    },
    [client, currentAccount, cacheRef, withRetry],
  );

  const batchFetchCards = useCallback(
    async (
      cardIds: number[],
      forceRefresh: boolean = false,
    ): Promise<DevCardData[]> => {
      const results: DevCardData[] = [];
      const uncachedIds: number[] = [];

      for (const cardId of cardIds) {
        const cached = cacheRef.current.cards.get(cardId) || null;
        if (!forceRefresh && isCacheValid(cached)) {
          results.push(cached.data);
        } else {
          uncachedIds.push(cardId);
        }
      }

      if (uncachedIds.length === 0) {
        return results.sort((a, b) => a.id - b.id);
      }

      const batchPromises: Promise<DevCardData[]>[] = [];

      for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
        const batch = uncachedIds.slice(i, i + BATCH_SIZE);

        const batchPromise = Promise.all(
          batch.map((id) => getCardInfo(id, forceRefresh)),
        ).then((batchResults) =>
          batchResults.filter((card): card is DevCardData => card !== null),
        );

        batchPromises.push(batchPromise);
      }

      try {
        const batchResults = await Promise.all(batchPromises);
        const newCards = batchResults.flat();
        results.push(...newCards);

        return results.sort((a, b) => a.id - b.id);
      } catch (err) {
        console.error("Error in batch fetch:", err);
        throw err;
      }
    },
    [getCardInfo, cacheRef],
  );

  const getAllCards = useCallback(
    async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev: any) => ({ ...prev, loading: true, error: null }));

      try {
        const count = await getCardCount(forceRefresh);
        if (count === 0) {
          setState((prev: any) => ({ ...prev, loading: false }));
          return [];
        }

        const cardIds = Array.from({ length: count }, (_, i) => i + 1);
        const cards = await batchFetchCards(cardIds, forceRefresh);

        setState((prev: any) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        // Cache to localStorage
        localStorageCache.set(CacheKeys.allCards(), cards, CacheTTL.medium);

        return cards;
      } catch (err) {
        console.error("Error getting all cards:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get all cards";
        setState((prev: any) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getCardCount, batchFetchCards, setState],
  );

  /**
   * Lightweight helper for pages that only need a sample of cards (e.g. suggestions),
   * to avoid scanning the entire table and triggering many devInspect calls.
   */
  const getSampleCards = useCallback(
    async (limit: number = 50, forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev: any) => ({ ...prev, loading: true, error: null }));

      try {
        const count = await getCardCount(forceRefresh);
        if (count === 0) {
          setState((prev: any) => ({ ...prev, loading: false }));
          return [];
        }

        const effectiveLimit = Math.max(1, Math.min(limit, count));
        const cardIds = Array.from({ length: effectiveLimit }, (_, i) => i + 1);
        const cards = await batchFetchCards(cardIds, forceRefresh);

        setState((prev: any) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        return cards;
      } catch (err) {
        console.error("Error getting sample cards:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get sample cards";
        setState((prev: any) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getCardCount, batchFetchCards, setState],
  );

  const getAllActiveCards = useCallback(
    async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev: any) => ({ ...prev, loading: true, error: null }));

      try {
        const allCards = await getAllCards(forceRefresh);
        const activeCards = allCards.filter((card) => card.isActive);

        setState((prev: any) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        return activeCards;
      } catch (err) {
        console.error("Error getting active cards:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get active cards";
        setState((prev: any) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getAllCards, setState],
  );

  const getCardsOpenToWork = useCallback(
    async (forceRefresh: boolean = false): Promise<DevCardData[]> => {
      setState((prev: any) => ({ ...prev, loading: true, error: null }));

      try {
        const allCards = await getAllCards(forceRefresh);
        const openToWorkCards = allCards.filter(
          (card) => card.openToWork && card.isActive,
        );

        setState((prev: any) => ({
          ...prev,
          loading: false,
          lastFetch: Date.now(),
          error: null,
        }));

        return openToWorkCards;
      } catch (err) {
        console.error("Error getting cards open to work:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get cards open to work";
        setState((prev: any) => ({ ...prev, loading: false, error: errorMessage }));
        return [];
      }
    },
    [getAllCards, setState],
  );

  const getUserCards = useCallback(
    async (
      userAddress: string,
      forceRefresh: boolean = false,
    ): Promise<DevCardData[]> => {
      if (!userAddress) return [];

      const cached = cacheRef.current.userCards.get(userAddress) || null;
      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const count = await getCardCount(forceRefresh);
        if (count === 0) return [];

        const CHUNK_SIZE = 3;
        const MAX_CONCURRENT = 2;

        const userCards: DevCardData[] = [];
        const totalChunks = Math.ceil(count / CHUNK_SIZE);

        const processCardChunk = async (
          startId: number,
          endId: number,
          userAddress: string,
          forceRefresh: boolean,
        ): Promise<DevCardData[]> => {
          const cardIds = Array.from(
            { length: endId - startId + 1 },
            (_, i) => startId + i,
          );

          try {
            const cardPromises = cardIds.map((id) => getCardInfo(id, forceRefresh));
            const cards = await Promise.all(cardPromises);

            return cards
              .filter((card): card is DevCardData => card !== null)
              .filter(
                (card) => card.owner.toLowerCase() === userAddress.toLowerCase(),
              );
          } catch (error) {
            console.warn(`Error processing chunk ${startId}-${endId}:`, error);
            return [];
          }
        };

        for (let i = 0; i < totalChunks; i += MAX_CONCURRENT) {
          const chunkPromises = [];

          for (let j = 0; j < MAX_CONCURRENT && i + j < totalChunks; j++) {
            const chunkIndex = i + j;
            const startId = chunkIndex * CHUNK_SIZE + 1;
            const endId = Math.min(startId + CHUNK_SIZE - 1, count);

            const chunkPromise = processCardChunk(
              startId,
              endId,
              userAddress,
              forceRefresh,
            );
            chunkPromises.push(chunkPromise);
          }

          const results = await Promise.allSettled(chunkPromises);
          results.forEach((result) => {
            if (result.status === "fulfilled") {
              userCards.push(...result.value);
            }
          });
        }

        const sortedCards = userCards.sort((a, b) => a.id - b.id);
        cacheRef.current.userCards.set(userAddress, setCacheEntry(sortedCards));
        return sortedCards;
      } catch (err) {
        console.error("❌ Error getting user cards:", err);
        return [];
      }
    },
    [getCardCount, getCardInfo, cacheRef],
  );

  const isCardActive = useCallback(
    async (cardId: number, forceRefresh: boolean = false): Promise<boolean> => {
      try {
        const cached = cacheRef.current.cards.get(cardId);
        if (!forceRefresh && cached && isCacheValid(cached)) {
          return cached.data.isActive;
        }

        const cardData = await getCardInfo(cardId, forceRefresh);
        return cardData?.isActive || false;
      } catch (err) {
        console.error(`Error checking if card ${cardId} is active:`, err);
        return false;
      }
    },
    [getCardInfo, cacheRef],
  );

  const isCardOpenToWork = useCallback(
    async (cardId: number, forceRefresh: boolean = false): Promise<boolean> => {
      try {
        const cached = cacheRef.current.cards.get(cardId);
        if (!forceRefresh && cached && isCacheValid(cached)) {
          return cached.data.openToWork;
        }

        const cardData = await getCardInfo(cardId, forceRefresh);
        return cardData?.openToWork || false;
      } catch (err) {
        console.error(`Error checking if card ${cardId} is open to work:`, err);
        return false;
      }
    },
    [getCardInfo, cacheRef],
  );

  const updateCardInCache = useCallback(
    (cardId: number, updatedCard: DevCardData) => {
      cacheRef.current.cards.set(cardId, setCacheEntry(updatedCard));

      cacheRef.current.userCards.forEach((entry, userAddress) => {
        if (isCacheValid(entry)) {
          const updatedUserCards = entry.data.map((card) =>
            card.id === cardId ? updatedCard : card,
          );
          cacheRef.current.userCards.set(
            userAddress,
            setCacheEntry(updatedUserCards),
          );
        }
      });
    },
    [cacheRef],
  );

  const addCardToUserCache = useCallback(
    (userAddress: string, newCard: DevCardData) => {
      cacheRef.current.cards.set(newCard.id, setCacheEntry(newCard));

      const userCacheEntry = cacheRef.current.userCards.get(userAddress);
      if (userCacheEntry && isCacheValid(userCacheEntry)) {
        const updatedUserCards = [...userCacheEntry.data, newCard].sort(
          (a, b) => a.id - b.id,
        );
        cacheRef.current.userCards.set(
          userAddress,
          setCacheEntry(updatedUserCards),
        );
      }

      cacheRef.current.cardCount = null;
    },
    [cacheRef],
  );

  const removeCardFromCache = useCallback(
    (cardId: number, userAddress: string) => {
      cacheRef.current.cards.delete(cardId);

      const userCacheEntry = cacheRef.current.userCards.get(userAddress);
      if (userCacheEntry && isCacheValid(userCacheEntry)) {
        const filteredUserCards = userCacheEntry.data.filter(
          (card) => card.id !== cardId,
        );
        cacheRef.current.userCards.set(
          userAddress,
          setCacheEntry(filteredUserCards),
        );
      }

      cacheRef.current.cardCount = null;
    },
    [cacheRef],
  );

  return {
    getCardCount,
    getCardInfo,
    batchFetchCards,
    getAllCards,
    getSampleCards,
    getAllActiveCards,
    getCardsOpenToWork,
    getUserCards,
    isCardActive,
    isCardOpenToWork,
    updateCardInCache,
    addCardToUserCache,
    removeCardFromCache,
  };
};

