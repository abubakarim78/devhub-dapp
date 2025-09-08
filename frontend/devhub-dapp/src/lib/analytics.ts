export interface CardAnalytics {
  views: number;
  lastViewedAt: number | null;
  shares: number;
  toggles: {
    isActive: number;
    openToWork: number;
  };
}

const STORAGE_KEY_PREFIX = 'devhub:analytics:';

function getStorageKey(cardId: number): string {
  return `${STORAGE_KEY_PREFIX}${cardId}`;
}

function read(cardId: number): CardAnalytics {
  try {
    const raw = localStorage.getItem(getStorageKey(cardId));
    if (!raw) {
      return { views: 0, lastViewedAt: null, shares: 0, toggles: { isActive: 0, openToWork: 0 } };
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
    };
  } catch {
    return { views: 0, lastViewedAt: null, shares: 0, toggles: { isActive: 0, openToWork: 0 } };
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