import React, { createContext, useContext, ReactNode } from "react";
import { useCall } from "@/hooks/useCall";
import { UseCallResult } from "@/types/call";
import { useAuth } from "@/contexts/useAuth";

const CallContext = createContext<UseCallResult | null>(null);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  // Only initialize hook if user is logged in; otherwise it might be idle
  const call = useCall(user?.id || "");

  return <CallContext.Provider value={call}>{children}</CallContext.Provider>;
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
};
