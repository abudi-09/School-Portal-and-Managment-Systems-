const presenceMap = new Map<string, number>();

export const markOnline = (userId: string): boolean => {
  const current = presenceMap.get(userId) ?? 0;
  presenceMap.set(userId, current + 1);
  return current === 0;
};

export const markOffline = (userId: string): boolean => {
  const current = presenceMap.get(userId) ?? 0;
  if (current <= 1) {
    presenceMap.delete(userId);
    return current > 0;
  }
  presenceMap.set(userId, current - 1);
  return false;
};

export const isOnline = (userId: string): boolean => presenceMap.has(userId);

export const getOnlineUsers = (): string[] => Array.from(presenceMap.keys());
