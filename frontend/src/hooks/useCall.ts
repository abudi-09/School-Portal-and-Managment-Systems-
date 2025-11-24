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
  const incomingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const callStartTsRef = useRef<number | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const processingRef = useRef(false); // Guard for idempotent actions
  const callIdRef = useRef<string>(Math.random().toString(36).substring(7));

  const log = useCallback((msg: string, data?: unknown) => {
    console.log(`CALL[${callIdRef.current}] ${msg}`, data || "");
  }, []);

  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) return; // Prevent duplicate timers
    callStartTsRef.current = Date.now();
    setCallDuration(0);
    log("TIMER_STARTED");
    callTimerRef.current = window.setInterval(() => {
      if (!callStartTsRef.current) return;
      setCallDuration(Math.floor((Date.now() - callStartTsRef.current) / 1000));
    }, 1000);
  }, [log]);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartTsRef.current = null;
    setCallDuration(0);
    console.log("useCall > call timer stopped");
  }, []);

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
      if (stream) {
        setRemoteStream(stream);
        log("AUDIO_ESTABLISHED", { streamId: stream.id });
        try {
          if (!audioElRef.current) {
            audioElRef.current = new Audio();
            audioElRef.current.autoplay = true;
          }
          // Attach stream and attempt to play (user gesture required for autoplay but Accept is a gesture)
          // Setting HTMLAudioElement.srcObject is supported in browsers
          if (audioElRef.current) {
            (
              audioElRef.current as unknown as {
                srcObject?: MediaStream | null;
              }
            ).srcObject = stream;
            audioElRef.current.play().catch((e) => {
              log("AUDIO_AUTOPLAY_FAILED", e);
              // Don't hangup, just warn. UI could show "Click to unmute"
            });
          }
        } catch (e) {
          console.warn("useCall > play remote audio failed", e);
        }
      }
    };
    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      const json = ev.candidate.toJSON();
      // Emit only after remoteDescription applied; otherwise buffer
      if (pc.remoteDescription && remoteUserId) {
        const socket = getSocket();
        try {
          socket?.emit("call:ice", { to: remoteUserId, candidate: json });
          // log("EMIT_ICE_IMMEDIATE", { sdpMid: json.sdpMid });
        } catch (err) {
          console.warn("useCall > emit ICE failed, buffering", err);
          pendingIceRef.current.push(json);
        }
      } else {
        pendingIceRef.current.push(json);
        log("BUFFER_OUTGOING_ICE", { sdpMid: json.sdpMid });
      }
    };
    pc.onconnectionstatechange = () => {
      console.log("PC > connectionStateChange", pc.connectionState);
      if (pc.connectionState === "connected") {
        startCallTimer();
      } else if (
        ["disconnected", "closed", "failed"].includes(pc.connectionState)
      ) {
        stopCallTimer();
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log("PC > iceConnectionStateChange", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        startCallTimer();
      } else if (
        ["disconnected", "closed", "failed"].includes(pc.iceConnectionState)
      ) {
        stopCallTimer();
      }
    };
    pc.onicegatheringstatechange = () => {
      console.log("PC > iceGatheringStateChange", pc.iceGatheringState);
    };
    pcRef.current = pc;
    return pc;
  }, [remoteUserId, startCallTimer, stopCallTimer, log]);

  // (flushPendingIce already defined above)

  const bufferIncomingCandidate = useCallback(
    (candidate: RTCIceCandidateInit) => {
      incomingCandidatesRef.current.push(candidate);
    },
    []
  );

  const drainIncomingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const pending = incomingCandidatesRef.current.splice(0);
    if (!pending.length) return;
    log("DRAIN_INCOMING_ICE", { count: pending.length });
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate as RTCIceCandidateInit);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const name =
          err instanceof Error && "name" in err
            ? (err as Error).name
            : "UnknownError";
        console.warn("useCall > addIceCandidate drain failed", {
          name,
          message,
        });
        // If invalid state (remoteDescription not yet set) re-buffer for later
        if (name === "InvalidStateError" || !pc.remoteDescription) {
          incomingCandidatesRef.current.push(candidate);
        }
      }
    }
  }, [log]);

  const flushPendingIce = useCallback(
    (toId: string) => {
      const socket = getSocket();
      if (!socket) return 0;
      const pending = pendingIceRef.current.splice(0);
      const count = pending.length;
      if (count === 0) return 0;
      log("FLUSH_OUTGOING_ICE", { count, to: toId });
      for (const candidate of pending) {
        try {
          socket.emit("call:ice", { to: toId, candidate });
        } catch (e) {
          console.warn("useCall > failed to emit pending ICE", e);
        }
      }
      return count;
    },
    [log]
  );

  const startCall = useCallback(
    async (peerUserId: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        // Debug log to help trace button presses
        log("startCall -> initiating call", { to: peerUserId });
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
        log("caller set local offer SDP");
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
      } finally {
        processingRef.current = false;
      }
    },
    [state, initPeer, cleanup, log]
  );

  const acceptCall = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      // Debug log for accepting
      log("ACCEPT_BEGIN", { from: inboundOffer?.from });
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
      log("REMOTE_SDP_SET");

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log("callee set local answer SDP");

      socket.emit(
        "call:answer",
        { to: inboundOffer.from, sdp: answer.sdp },
        (ack: { success: boolean; message?: string }) => {
          if (!ack?.success) {
            setError(ack?.message || "Answer failed");
            cleanup();
          } else {
            log("ANSWER_EMITTED");
          }
        }
      );
      // Flush any pending ICE gathered before remoteUserId was set
      try {
        flushPendingIce(inboundOffer.from);
      } catch (e) {
        console.warn("useCall > flushPendingIce after accept failed", e);
      }
      try {
        await drainIncomingCandidates();
      } catch (e) {
        console.warn(
          "useCall > drainIncomingCandidates after accept failed",
          e
        );
      }
      pendingIceRef.current = [];
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to accept call";
      setError(msg);
      cleanup();
    } finally {
      processingRef.current = false;
    }
  }, [
    inboundOffer,
    initPeer,
    cleanup,
    flushPendingIce,
    drainIncomingCandidates,
    log,
  ]);

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
      console.log("useCall > incoming offer from", evt.from);
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
      log("REMOTE_SDP_SET (Answer)");
      setState("in-call");
      try {
        flushPendingIce(evt.from);
      } catch (e) {
        console.warn("useCall > flushPendingIce on answer failed", e);
      }
      try {
        await drainIncomingCandidates();
      } catch (e) {
        console.warn(
          "useCall > drainIncomingCandidates after answer failed",
          e
        );
      }
    };
    const onIce = async (evt: CallIceEvent) => {
      const pc = pcRef.current;
      const candidate = evt.candidate as RTCIceCandidateInit;
      if (!pc) {
        bufferIncomingCandidate(candidate);
        return;
      }
      if (!pc.remoteDescription) {
        // Remote SDP not yet applied; buffer
        bufferIncomingCandidate(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
        // log("ADD_ICE_SUCCESS");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        const name =
          e instanceof Error && "name" in e
            ? (e as Error).name
            : "UnknownError";
        console.warn("useCall > addIceCandidate incoming failed", {
          name,
          message,
        });
        // Re-buffer only if state error
        if (name === "InvalidStateError") bufferIncomingCandidate(candidate);
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
  }, [
    state,
    remoteUserId,
    inboundOffer,
    cleanup,
    flushPendingIce,
    bufferIncomingCandidate,
    drainIncomingCandidates,
    log,
  ]);

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
