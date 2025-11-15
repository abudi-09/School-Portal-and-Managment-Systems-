const presenceMap = new Map<string, number>(); // active session counts per user
const hiddenUsers = new Set<string>();
const lastSeenMap = new Map<string, string>();
const offlineTimers = new Map<string, NodeJS.Timeout>(); // graceful offline scheduling

// 12s grace period (Telegram-style flicker prevention)
const OFFLINE_GRACE_MS = 12000; // Could be externalized to env later

export interface PresenceEntry {
  visibleStatus: "online" | "offline";
  hidden: boolean;
  lastSeenAt?: string;
}

/**
 * Marks a user as hidden (appear offline). When hidden, their visible status is offline
 * even if they are actually online.
 */
export const setHidden = (userId: string, hidden: boolean) => {
  if (hidden) hiddenUsers.add(userId);
  else hiddenUsers.delete(userId);
};

export const isHidden = (userId: string): boolean => hiddenUsers.has(userId);

/**
 * Increment session count. Cancels any pending offline timer.
 * Returns true if this transition represents first visible online session (for non-hidden broadcast logic).
 */
export const markOnline = (userId: string): boolean => {
  const current = presenceMap.get(userId) ?? 0;
  // Cancel pending offline timer (network blip recovery)
  const pending = offlineTimers.get(userId);
  if (pending) {
    clearTimeout(pending);
    offlineTimers.delete(userId);
  }
  presenceMap.set(userId, current + 1);
  if (current === 0) {
    // User just became online again; remove stale lastSeen so snapshot doesn't show offline
    lastSeenMap.delete(userId);
  }
  return current === 0;
};

/**
 * Decrement session count. Schedules graceful offline if this was last session.
 * onOffline callback fires AFTER grace period if user did not reconnect.
 */
export const markOffline = (
  userId: string,
  onOffline: (userId: string, iso: string) => void
): void => {
  const current = presenceMap.get(userId) ?? 0;
  if (current <= 1) {
    presenceMap.delete(userId);
    // Schedule offline marking with grace period to prevent flicker
    const existing = offlineTimers.get(userId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      // If user did NOT reconnect during grace period, finalize offline
      if (!presenceMap.has(userId)) {
        const iso = new Date().toISOString();
        setLastSeen(userId, iso);
        onOffline(userId, iso);
      }
      offlineTimers.delete(userId);
    }, OFFLINE_GRACE_MS);
    offlineTimers.set(userId, timer);
    return;
  }
  // Still has other active sessions; just decrement
  presenceMap.set(userId, current - 1);
};

export const isOnline = (userId: string): boolean => presenceMap.has(userId);

export const getOnlineUsers = (): string[] => Array.from(presenceMap.keys());

/** Visible status honors hidden mode. */
export const isVisibleOnline = (userId: string): boolean =>
  isOnline(userId) && !isHidden(userId);

export const setLastSeen = (userId: string, iso: string) => {
  lastSeenMap.set(userId, iso);
};

export const getLastSeen = (userId: string): string | undefined =>
  lastSeenMap.get(userId);

export const getPresenceForUser = (userId: string): PresenceEntry => {
  const hidden = isHidden(userId);
  const online = isVisibleOnline(userId);
  const lastSeenAt = lastSeenMap.get(userId);
  const entry: PresenceEntry = {
    visibleStatus: hidden ? "offline" : online ? "online" : "offline",
    hidden,
  };
  if (lastSeenAt) {
    entry.lastSeenAt = lastSeenAt;
  }
  return entry;
};

export const getPresenceSnapshot = (): Record<string, PresenceEntry> => {
  const snapshot: Record<string, PresenceEntry> = {};

  presenceMap.forEach((_, userId) => {
    const entry = getPresenceForUser(userId);
    if (!entry.hidden) {
      snapshot[userId] = entry;
    }
  });

  lastSeenMap.forEach((iso, userId) => {
    const hidden = isHidden(userId);
    if (!hidden) {
      const existing = snapshot[userId] ?? {
        visibleStatus: "offline" as const,
        hidden: false,
      };
      snapshot[userId] = {
        ...existing,
        hidden: false,
        lastSeenAt: iso,
      };
    }
  });

  return snapshot;
};
