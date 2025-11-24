import React from "react";
import { UseCallResult } from "@/types/call";
import { Button } from "@/components/ui/button";

interface CallOverlayProps {
  call: UseCallResult;
  contactName?: string;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  call,
  contactName,
}) => {
  const {
    state,
    inboundOffer,
    remoteStream,
    localStream,
    isMuted,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    remoteUserId,
  } = call;

  if (state === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border rounded-lg shadow-lg w-[320px] p-4 flex flex-col gap-3">
        {state === "ringing" && inboundOffer && (
          <>
            <h3 className="font-semibold text-center">Incoming Call</h3>
            <p className="text-sm text-muted-foreground text-center">
              From {contactName || inboundOffer.from}
            </p>
            <div className="flex gap-2 justify-center mt-2">
              <Button onClick={acceptCall} variant="default">
                Accept
              </Button>
              <Button onClick={rejectCall} variant="destructive">
                Reject
              </Button>
            </div>
          </>
        )}
        {state === "calling" && (
          <>
            <h3 className="font-semibold text-center">Calling…</h3>
            <p className="text-sm text-muted-foreground text-center">
              {contactName || remoteUserId}
            </p>
            <div className="flex gap-2 justify-center mt-2">
              <Button onClick={() => endCall("cancel")} variant="secondary">
                Cancel
              </Button>
            </div>
          </>
        )}
        {state === "in-call" && (
          <>
            <h3 className="font-semibold text-center">In Call</h3>
            <p className="text-xs text-muted-foreground text-center mb-2">
              {contactName || remoteUserId}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  onClick={toggleMute}
                  variant={isMuted ? "secondary" : "default"}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => endCall("hangup")}
                  variant="destructive"
                >
                  Hang Up
                </Button>
              </div>
              <div className="text-[10px] text-center text-muted-foreground">
                Audio-only call • Experimental
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
