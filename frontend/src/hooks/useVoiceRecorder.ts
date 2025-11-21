import { useCallback, useEffect, useRef, useState } from "react";

type RecorderWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const getRecorderWindow = (): RecorderWindow | undefined =>
  typeof window !== "undefined" ? (window as RecorderWindow) : undefined;

const DEFAULT_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4;codecs=opus",
];

const pickSupportedMimeType = (preferred?: string) => {
  const recorderWindow = getRecorderWindow();
  const MediaRecorderCtor = recorderWindow?.MediaRecorder;
  if (!recorderWindow || !MediaRecorderCtor) {
    return preferred;
  }
  const candidates = [
    ...(preferred ? [preferred] : []),
    ...DEFAULT_MIME_CANDIDATES,
  ];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      if (MediaRecorderCtor.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch (_error) {
      // ignore unsupported mime exceptions
    }
  }
  return preferred;
};

interface UseVoiceRecorderOptions {
  onData?: (blob: Blob, duration: number, waveform: number[]) => void;
  sampleCount?: number; // number of waveform samples
  mimeType?: string; // preferred mime type
  onError?: (err: Error) => void;
}

interface UseVoiceRecorderResult {
  isRecording: boolean;
  duration: number; // seconds
  waveformLive: number[]; // live analyzer samples 0..1
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => void;
}

// Utility: format analyser data to 0..1 values
const extractLiveWaveform = (
  analyser: AnalyserNode,
  samples = 32
): number[] => {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  const bucketSize = Math.floor(data.length / samples);
  const result: number[] = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < bucketSize; j++) {
      const v = data[i * bucketSize + j];
      sum += Math.abs(v - 128); // center at 128
    }
    const avg = sum / bucketSize / 128; // normalize 0..1
    result.push(Number.isFinite(avg) ? Math.min(1, avg) : 0);
  }
  return result;
};

const downsampleWaveform = async (
  blob: Blob,
  samples: number
): Promise<number[]> => {
  const arrayBuffer = await blob.arrayBuffer();
  const recorderWindow = getRecorderWindow();
  const AudioContextCtor =
    recorderWindow?.AudioContext ?? recorderWindow?.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("AudioContext is not supported in this environment");
  }
  const audioCtx = new AudioContextCtor();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const raw = audioBuffer.getChannelData(0); // mono channel
    const blockSize = Math.floor(raw.length / samples) || 1;
    const output: number[] = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(raw[blockStart + j] ?? 0);
      }
      const avg = sum / blockSize; // 0..1 typically
      output.push(Number.isFinite(avg) ? Math.min(1, avg) : 0);
    }
    return output;
  } finally {
    await audioCtx.close().catch(() => {});
  }
};

export const useVoiceRecorder = (
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderResult => {
  const {
    onData,
    sampleCount = 48,
    mimeType = "audio/webm",
    onError,
  } = options;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderMimeTypeRef = useRef<string | undefined>(undefined);
  const isRecordingRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformLive, setWaveformLive] = useState<number[]>([]);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    isRecordingRef.current = false;
    startTimeRef.current = null;
    recorderMimeTypeRef.current = undefined;
  };

  const stop = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
    } catch (_error) {
      // MediaRecorder throws if already stopped; safe to ignore
    }
  }, []);

  const cancel = useCallback(() => {
    chunksRef.current = [];
    setIsRecording(false);
    setDuration(0);
    setWaveformLive([]);
    isRecordingRef.current = false;
    cleanup();
  }, []);

  const tick = useCallback(() => {
    if (!isRecordingRef.current) return;
    if (startTimeRef.current !== null) {
      const elapsed = Math.max(0, performance.now() - startTimeRef.current);
      setDuration(Math.max(0, Math.round(elapsed / 1000)));
    }
    if (analyserRef.current) {
      setWaveformLive(extractLiveWaveform(analyserRef.current, 32));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (isRecordingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorderWindow = getRecorderWindow();
      const AudioContextCtor =
        recorderWindow?.AudioContext ?? recorderWindow?.webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("AudioContext is not supported in this environment");
      }
      const audioCtx = new AudioContextCtor();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const selectedMime = pickSupportedMimeType(mimeType) ?? undefined;
      recorderMimeTypeRef.current = selectedMime;
      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = performance.now();
      setIsRecording(true);
      isRecordingRef.current = true;
      setDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const stopTimestamp = performance.now();
        const recordingStartedAt = startTimeRef.current;
        if (!chunksRef.current.length) {
          cancel();
          return;
        }
        isRecordingRef.current = false;
        const firstChunk = chunksRef.current[0] as Blob | undefined;
        const effectiveType =
          (firstChunk && firstChunk.type) ||
          recorderMimeTypeRef.current ||
          mimeType;
        const blob = new Blob(
          chunksRef.current,
          effectiveType ? { type: effectiveType } : undefined
        );
        cleanup();
        setIsRecording(false);
        if (blob.size === 0) {
          chunksRef.current = [];
          if (onError) onError(new Error("Empty recording"));
          return;
        }
        const elapsedSeconds = (() => {
          if (typeof recordingStartedAt === "number") {
            const elapsedMs = Math.max(0, stopTimestamp - recordingStartedAt);
            return elapsedMs / 1000;
          }
          return duration;
        })();
        startTimeRef.current = null;
        setDuration(Math.max(0, Math.round(elapsedSeconds)));
        let waveform: number[] = [];
        try {
          waveform = await downsampleWaveform(blob, sampleCount);
        } catch (e) {
          // Fallback: flat waveform
          waveform = Array.from({ length: sampleCount }, () => 0.2);
          if (onError) onError(e as Error);
        }
        if (onData)
          onData(blob, Math.max(1, Math.round(elapsedSeconds)), waveform);
        chunksRef.current = [];
      };

      recorder.start();
      tick();
    } catch (err) {
      setIsRecording(false);
      isRecordingRef.current = false;
      if (onError) onError(err as Error);
    }
  }, [cancel, duration, mimeType, onData, sampleCount, tick, onError]);

  useEffect(() => {
    return () => cleanup();
  }, []);

  return { isRecording, duration, waveformLive, start, stop, cancel };
};

export default useVoiceRecorder;
