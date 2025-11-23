import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/audioUtils';
import { AnimatedWaveform } from './AnimatedWaveform';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    
    const handleCanPlay = () => setIsLoaded(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (progress: number) => {
    if (!audioRef.current) return;
    const newTime = progress * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice-message-${Date.now()}.webm`;
    a.click();
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className={cn("flex items-center gap-2 min-w-[200px] max-w-[350px]", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 flex-shrink-0 rounded-full transition-all",
          isOwn ? "hover:bg-primary-foreground/20" : "hover:bg-primary/10",
          isPlaying && "scale-95"
        )}
        onClick={togglePlayPause}
        disabled={!isLoaded}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
        )}
      </Button>

      {/* Waveform and timer */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {waveform.length > 0 ? (
          <AnimatedWaveform
            waveform={waveform}
            progress={progress}
            isPlaying={isPlaying}
            isOwn={isOwn}
            onSeek={handleSeek}
          />
        ) : (
          <div className="h-8 flex items-center">
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-100",
                  isOwn ? "bg-primary-foreground/60" : "bg-primary"
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        
        <div className={cn(
          "flex items-center justify-between text-[10px] font-mono tabular-nums",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {/* Elapsed time */}
          <span>{formatDuration(currentTime)}</span>
          {/* Total duration */}
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Download button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 flex-shrink-0",
          isOwn ? "hover:bg-primary-foreground/20" : "hover:bg-primary/10"
        )}
        onClick={handleDownload}
        title="Download voice message"
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
