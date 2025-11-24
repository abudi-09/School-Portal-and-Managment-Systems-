import { useCallback, useEffect, useRef, useState } from "react";
import {
  ensureMessageSocket,
  getExistingMessageSocket,
} from "@/hooks/useMessageSocket";
import type {
  CallState,
  IncomingCallEvent,
  CallAnswerEvent,
  CallIceEvent,
  CallHangupEvent,
  CallCancelEvent,
  UseCallResult,
} from "@/types/call";

const STUN_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useCall = (currentUserId: string): UseCallResult => {
  const [state, setState] = useState<CallState>("idle");
  const [remoteUserId, setRemoteUserId] = useState<string | undefined>();
  const [inboundOffer, setInboundOffer] = useState<IncomingCallEvent | null>(
    null
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  // Ensure socket exists
  useEffect(() => {
    ensureMessageSocket();
  }, []);

  const getSocket = () => getExistingMessageSocket();

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setInboundOffer(null);
    setRemoteUserId(undefined);
    setState("idle");
    setIsMuted(false);
  }, [localStream]);

  const initPeer = useCallback(async () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(STUN_CONFIG);
    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) setRemoteStream(stream);
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate && remoteUserId) {
        const socket = getSocket();
        socket?.emit("call:ice", { to: remoteUserId, candidate: ev.candidate });
      }
    };
    pcRef.current = pc;
    return pc;
  }, [remoteUserId]);

  const startCall = useCallback(
    async (peerUserId: string) => {
      try {
        if (state !== "idle") throw new Error("Already in call flow");
        const socket = getSocket();
        if (!socket) throw new Error("Socket unavailable");
        setState("calling");
        setRemoteUserId(peerUserId);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setLocalStream(stream);
        const pc = await initPeer();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit(
          "call:offer",
          { to: peerUserId, sdp: offer.sdp },
          (ack: { success: boolean; message?: string }) => {
            if (!ack?.success) {
              setError(ack?.message || "Offer failed");
              cleanup();
            }
          }
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to start call";
        setError(msg);
        cleanup();
      }
    },
    [state, initPeer, cleanup]
  );

  const acceptCall = useCallback(async () => {
    try {
      if (!inboundOffer) return;
      const socket = getSocket();
      if (!socket) throw new Error("Socket unavailable");
      setState("in-call");
      setRemoteUserId(inboundOffer.from);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      const pc = await initPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const remoteDesc = new RTCSessionDescription({
        type: "offer",
        sdp: inboundOffer.sdp,
      });
      await pc.setRemoteDescription(remoteDesc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(
        "call:answer",
        { to: inboundOffer.from, sdp: answer.sdp },
        (ack: { success: boolean; message?: string }) => {
          if (!ack?.success) {
            setError(ack?.message || "Answer failed");
            cleanup();
          }
        }
      );
      // Apply any pending ICE gathered before remoteUserId was set
      pendingIceRef.current = [];
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to accept call";
      setError(msg);
      cleanup();
    }
  }, [inboundOffer, initPeer, cleanup]);

  const rejectCall = useCallback(() => {
    const socket = getSocket();
    if (inboundOffer && socket) {
      socket.emit("call:cancel", { to: inboundOffer.from });
    }
    cleanup();
  }, [inboundOffer, cleanup]);

  const endCall = useCallback(
    (reason?: string) => {
      const socket = getSocket();
      if (remoteUserId && socket) {
        socket.emit("call:hangup", { to: remoteUserId, reason });
      }
      cleanup();
    },
    [remoteUserId, cleanup]
  );

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, [localStream]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (evt: IncomingCallEvent) => {
      if (state !== "idle") {
        // Busy - auto reject by sending cancel notice? Optionally implement.
        return;
      }
      setInboundOffer(evt);
      setState("ringing");
    };
    const onAnswer = async (evt: CallAnswerEvent) => {
      if (!pcRef.current) return;
      const desc = new RTCSessionDescription({ type: "answer", sdp: evt.sdp });
      await pcRef.current.setRemoteDescription(desc);
      setState("in-call");
    };
    const onIce = async (evt: CallIceEvent) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(
          evt.candidate as RTCIceCandidateInit
        );
      } catch (e) {
        // Non-fatal: log and continue
        console.warn("ICE candidate add failed", e);
      }
    };
    const onHangup = (evt: CallHangupEvent) => {
      if (evt.from === remoteUserId) {
        cleanup();
      }
    };
    const onCancel = (evt: CallCancelEvent) => {
      if (inboundOffer && evt.from === inboundOffer.from) {
        cleanup();
      }
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:hangup", onHangup);
    socket.on("call:cancel", onCancel);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:hangup", onHangup);
      socket.off("call:cancel", onCancel);
    };
  }, [state, remoteUserId, inboundOffer, cleanup]);

  // Ensure cleanup on page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state === "calling" || state === "in-call" || state === "ringing") {
        endCall("unload");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state, endCall]);

  return {
    state,
    remoteUserId,
    inboundOffer,
    localStream,
    remoteStream,
    isMuted,
    error,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  };
};
