import React, { createContext, useContext, useMemo, useReducer } from "react";

type VisibleStatus = "online" | "offline";

export type PresenceRecord = {
  visibleStatus: VisibleStatus;
  lastSeenAt?: string;
  hidden?: boolean;
};

type State = Record<string, PresenceRecord>;

type Action =
  | { type: "snapshot"; payload: Record<string, PresenceRecord> }
  | { type: "online"; userId: string; hidden?: boolean }
  | { type: "offline"; userId: string; lastSeenAt?: string; hidden?: boolean }
  | {
      type: "visibility";
      userId: string;
      visibleStatus: VisibleStatus;
      hidden?: boolean;
    }
  | { type: "lastSeen"; userId: string; lastSeenAt: string; hidden?: boolean };

const PresenceContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "snapshot": {
      return { ...state, ...action.payload };
    }
    case "online": {
      const { userId, hidden } = action;
      const existing = state[userId] ?? {};
      return {
        ...state,
        [userId]: {
          ...existing,
          visibleStatus: "online",
          lastSeenAt: undefined,
          hidden: hidden ?? false,
        },
      };
    }
    case "offline": {
      const { userId, lastSeenAt, hidden } = action;
      const existing = state[userId] ?? {};
      return {
        ...state,
        [userId]: {
          ...existing,
          visibleStatus: "offline",
          lastSeenAt,
          hidden: hidden ?? existing.hidden,
        },
      };
    }
    case "visibility": {
      const { userId, visibleStatus, hidden } = action;
      const existing = state[userId] ?? {};
      return {
        ...state,
        [userId]: {
          ...existing,
          visibleStatus,
          hidden: hidden ?? existing.hidden,
        },
      };
    }
    case "lastSeen": {
      const { userId, lastSeenAt, hidden } = action;
      const existing = state[userId] ?? {};
      return {
        ...state,
        [userId]: {
          ...existing,
          lastSeenAt,
          hidden: hidden ?? existing.hidden,
        },
      };
    }
    default:
      return state;
  }
};

export const PresenceProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, {});
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const ctx = useContext(PresenceContext);
  if (!ctx)
    throw new Error("usePresence must be used within a PresenceProvider");
  return ctx;
};
