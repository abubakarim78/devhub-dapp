// On-chain analytics from the contract
export interface ProfileAnalytics {
  totalViews: number;
  profileViews: number;
  contactClicks: number;
  projectApplications: number;
  totalReviews: number;
  averageRating: number;
  lastViewReset: number;
}

// Local analytics for additional tracking
export interface CardAnalytics {
  views: number;
  lastViewedAt: number | null;
  shares: number;
  toggles: {
    isActive: number;
    openToWork: number;
  };
  // Additional local tracking
  contactClicks: number;
  projectApplications: number;
  reviews: number;
  averageRating: number;
}

const STORAGE_KEY_PREFIX = 'devhub:analytics:';

function getStorageKey(cardId: number): string {
  return `${STORAGE_KEY_PREFIX}${cardId}`;
}

function read(cardId: number): CardAnalytics {
  try {
    const raw = localStorage.getItem(getStorageKey(cardId));
    if (!raw) {
      return { 
        views: 0, 
        lastViewedAt: null, 
        shares: 0, 
        toggles: { isActive: 0, openToWork: 0 },
        contactClicks: 0,
        projectApplications: 0,
        reviews: 0,
        averageRating: 0
      };
    }
    const parsed = JSON.parse(raw);
    return {
      views: Number(parsed.views) || 0,
      lastViewedAt: typeof parsed.lastViewedAt === 'number' ? parsed.lastViewedAt : null,
      shares: Number(parsed.shares) || 0,
      toggles: {
        isActive: Number(parsed?.toggles?.isActive) || 0,
        openToWork: Number(parsed?.toggles?.openToWork) || 0,
      },
      contactClicks: Number(parsed.contactClicks) || 0,
      projectApplications: Number(parsed.projectApplications) || 0,
      reviews: Number(parsed.reviews) || 0,
      averageRating: Number(parsed.averageRating) || 0,
    };
  } catch {
    return { 
      views: 0, 
      lastViewedAt: null, 
      shares: 0, 
      toggles: { isActive: 0, openToWork: 0 },
      contactClicks: 0,
      projectApplications: 0,
      reviews: 0,
      averageRating: 0
    };
  }
}

function write(cardId: number, data: CardAnalytics): void {
  try {
    localStorage.setItem(getStorageKey(cardId), JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function getCardAnalytics(cardId: number): CardAnalytics {
  return read(cardId);
}

export function incrementView(cardId: number): CardAnalytics {
  const current = read(cardId);
  const now = Date.now();
  
  // Prevent double-incrementing in development (React StrictMode)
  // Only increment if more than 1 second has passed since last view
  if (current.lastViewedAt && (now - current.lastViewedAt) < 1000) {
    console.log('🚫 Skipping view increment - too soon after last view (React StrictMode protection)');
    return current;
  }
  
  const updated: CardAnalytics = {
    ...current,
    views: current.views + 1,
    lastViewedAt: now,
  };
  write(cardId, updated);
  return updated;
}

export function incrementShare(cardId: number): CardAnalytics {
  const current = read(cardId);
  const updated: CardAnalytics = { ...current, shares: current.shares + 1 };
  write(cardId, updated);
  return updated;
}

export function recordToggle(cardId: number, field: 'isActive' | 'openToWork'): CardAnalytics {
  const current = read(cardId);
  const updated: CardAnalytics = {
    ...current,
    toggles: { ...current.toggles, [field]: (current.toggles[field] || 0) + 1 },
  } as CardAnalytics;
  write(cardId, updated);
  return updated;
}

// New functions for enhanced analytics tracking
export function incrementContactClick(cardId: number): CardAnalytics {
  const current = read(cardId);
  const updated: CardAnalytics = { ...current, contactClicks: current.contactClicks + 1 };
  write(cardId, updated);
  return updated;
}

export function incrementProjectApplication(cardId: number): CardAnalytics {
  const current = read(cardId);
  const updated: CardAnalytics = { ...current, projectApplications: current.projectApplications + 1 };
  write(cardId, updated);
  return updated;
}

export function addReview(cardId: number, rating: number): CardAnalytics {
  const current = read(cardId);
  const totalRating = (current.averageRating * current.reviews) + rating;
  const newReviewCount = current.reviews + 1;
  const newAverageRating = totalRating / newReviewCount;
  
  const updated: CardAnalytics = {
    ...current,
    reviews: newReviewCount,
    averageRating: Math.round(newAverageRating * 100) / 100, // Round to 2 decimal places
  };
  write(cardId, updated);
  return updated;
}

// Utility function to merge on-chain and local analytics
export function mergeAnalytics(
  onChainAnalytics: ProfileAnalytics,
  localAnalytics: CardAnalytics
): CardAnalytics & { onChain: ProfileAnalytics } {
  return {
    ...localAnalytics,
    onChain: onChainAnalytics,
  };
}

// Function to sync local analytics with on-chain data
export function syncWithOnChainAnalytics(
  cardId: number,
  onChainAnalytics: ProfileAnalytics
): CardAnalytics {
  const current = read(cardId);
  
  // Update local analytics with on-chain data where appropriate
  const updated: CardAnalytics = {
    ...current,
    contactClicks: Math.max(current.contactClicks, onChainAnalytics.contactClicks),
    projectApplications: Math.max(current.projectApplications, onChainAnalytics.projectApplications),
    reviews: Math.max(current.reviews, onChainAnalytics.totalReviews),
    averageRating: onChainAnalytics.averageRating > 0 ? onChainAnalytics.averageRating : current.averageRating,
  };
  
  write(cardId, updated);
  return updated;
}

// Function to get comprehensive analytics
export function getComprehensiveAnalytics(
  cardId: number,
  onChainAnalytics?: ProfileAnalytics
): CardAnalytics & { onChain?: ProfileAnalytics; combined: CardAnalytics } {
  const local = read(cardId);
  
  if (onChainAnalytics) {
    const synced = syncWithOnChainAnalytics(cardId, onChainAnalytics);
    return {
      ...synced,
      onChain: onChainAnalytics,
      combined: {
        ...synced,
        views: Math.max(synced.views, onChainAnalytics.totalViews),
        // Use on-chain data for official metrics
        contactClicks: onChainAnalytics.contactClicks,
        projectApplications: onChainAnalytics.projectApplications,
        reviews: onChainAnalytics.totalReviews,
        averageRating: onChainAnalytics.averageRating,
      },
    };
  }
  
  return {
    ...local,
    combined: local,
  };
}