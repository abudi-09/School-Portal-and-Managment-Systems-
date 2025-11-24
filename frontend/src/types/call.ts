export type CallState = "idle" | "calling" | "ringing" | "in-call" | "ending";

export interface IncomingCallEvent {
  from: string;
  fromRole?: string;
  sdp: string;
  ts: number;
}

export interface CallAnswerEvent {
  from: string;
  sdp: string;
  ts: number;
}

export interface CallIceEvent {
  from: string;
  candidate: unknown;
}

export interface CallHangupEvent {
  from: string;
  reason?: string;
  ts: number;
}

export interface CallCancelEvent {
  from: string;
  ts: number;
}

export interface CallActions {
  startCall: (peerUserId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: (reason?: string) => void;
  toggleMute: () => void;
}

export interface UseCallResult extends CallActions {
  state: CallState;
  remoteUserId?: string;
  inboundOffer?: IncomingCallEvent | null;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  isMuted: boolean;
  error?: string;
}
