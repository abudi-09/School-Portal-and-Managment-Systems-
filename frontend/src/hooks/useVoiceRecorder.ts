import { useCallback, useEffect, useRef, useState } from "react";

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
  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const raw = audioBuffer.getChannelData(0); // mono channel
  const blockSize = Math.floor(raw.length / samples);
  const output: number[] = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(raw[i * blockSize + j]);
    }
    const avg = sum / blockSize; // 0..1 typically
    output.push(Number.isFinite(avg) ? Math.min(1, avg) : 0);
  }
  return output;
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
  };

  const stop = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
    } catch {}
  }, []);

  const cancel = useCallback(() => {
    chunksRef.current = [];
    setIsRecording(false);
    setDuration(0);
    setWaveformLive([]);
    cleanup();
  }, []);

  const tick = useCallback(() => {
    if (!isRecording) return;
    if (startTimeRef.current) {
      setDuration(((Date.now() - startTimeRef.current) / 1000) | 0);
    }
    if (analyserRef.current) {
      setWaveformLive(extractLiveWaveform(analyserRef.current, 32));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [isRecording]);

  const start = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (!chunksRef.current.length) {
          cancel();
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        setIsRecording(false);
        const finalDuration = startTimeRef.current
          ? (Date.now() - startTimeRef.current) / 1000
          : duration;
        startTimeRef.current = null;
        let waveform: number[] = [];
        try {
          waveform = await downsampleWaveform(blob, sampleCount);
        } catch (e) {
          // Fallback: flat waveform
          waveform = Array.from({ length: sampleCount }, () => 0.2);
          if (onError) onError(e as Error);
        }
        if (onData)
          onData(blob, Math.max(1, Math.round(finalDuration)), waveform);
      };

      recorder.start();
      tick();
    } catch (err) {
      setIsRecording(false);
      if (onError) onError(err as Error);
    }
  }, [
    cancel,
    duration,
    isRecording,
    mimeType,
    onData,
    sampleCount,
    tick,
    onError,
  ]);

  useEffect(() => {
    return () => cleanup();
  }, []);

  return { isRecording, duration, waveformLive, start, stop, cancel };
};

export default useVoiceRecorder;
