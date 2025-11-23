import { useEffect, useRef } from 'react';
import { Mic, X, Send, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/audioUtils';

interface VoiceRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  waveformLive: number[];
  onStop: () => void;
  onCancel: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export const VoiceRecorder = ({
  isRecording,
  isPaused,
  duration,
  waveformLive,
  onStop,
  onCancel,
  onPause,
  onResume,
}: VoiceRecorderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformLive.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformLive.length;

    ctx.clearRect(0, 0, width, height);

    waveformLive.forEach((amplitude, i) => {
      const barHeight = Math.max(2, amplitude * height * 0.8);
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(x, y, barWidth - 2, barHeight);
    });
  }, [waveformLive]);

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-3 h-3 rounded-full",
          isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
        )} />
        <span className="text-sm font-medium text-muted-foreground">
          {isPaused ? 'Paused' : 'Recording'}
        </span>
      </div>

      {/* Waveform visualization */}
      <div className="flex-1 min-w-0">
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          className="w-full h-10 rounded"
        />
      </div>

      {/* Duration */}
      <div className="text-sm font-mono font-medium tabular-nums">
        {formatDuration(duration)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Pause/Resume */}
        {onPause && onResume && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={isPaused ? onResume : onPause}
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Cancel */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Send */}
        <Button
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onStop}
          disabled={duration < 1}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
