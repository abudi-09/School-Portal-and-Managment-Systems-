import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/audioUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VoicePlayerProps {
  audioUrl: string;
  duration: number;
  waveform?: number[];
  isOwn?: boolean;
  className?: string;
}

export const VoicePlayer = ({
  audioUrl,
  duration,
  waveform = [],
  isOwn = false,
  className,
}: VoicePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveform.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    waveform.forEach((amplitude, i) => {
      const barHeight = Math.max(2, amplitude * height * 0.7);
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      const isPlayed = i / waveform.length < progress;
      ctx.fillStyle = isPlayed
        ? isOwn ? 'rgba(255, 255, 255, 0.9)' : 'hsl(var(--primary))'
        : isOwn ? 'rgba(255, 255, 255, 0.4)' : 'hsl(var(--muted-foreground) / 0.3)';
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [waveform, currentTime, duration, isOwn]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice-message-${Date.now()}.webm`;
    a.click();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2 min-w-[250px]", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 flex-shrink-0 rounded-full",
          isOwn ? "hover:bg-primary-foreground/20" : ""
        )}
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
        )}
      </Button>

      {/* Waveform and progress */}
      <div className="flex-1 min-w-0 space-y-1">
        {waveform.length > 0 ? (
          <canvas
            ref={canvasRef}
            width={200}
            height={30}
            className="w-full h-[30px] cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = (x / rect.width) * 100;
              handleSeek([percent]);
            }}
          />
        ) : (
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        )}
        
        <div className="flex items-center justify-between text-[10px] opacity-70">
          <span className="font-mono tabular-nums">
            {formatDuration(currentTime)}
          </span>
          <span className="font-mono tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Speed control */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px] font-medium",
              isOwn ? "hover:bg-primary-foreground/20" : ""
            )}
          >
            {playbackRate}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <DropdownMenuItem
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={playbackRate === rate ? 'bg-accent' : ''}
            >
              {rate}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Additional controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6",
            isOwn ? "hover:bg-primary-foreground/20" : ""
          )}
          onClick={handleRestart}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6",
            isOwn ? "hover:bg-primary-foreground/20" : ""
          )}
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
