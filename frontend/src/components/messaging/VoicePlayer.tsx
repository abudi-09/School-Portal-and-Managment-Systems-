import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/audioUtils';
import { AnimatedWaveform } from './AnimatedWaveform';
import { downloadAudio } from '@/lib/audioDownloader';

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
  const [isLoading, setIsLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-download on mount
  useEffect(() => {
    let active = true;

    const loadAudio = async () => {
      // If it's a blob URL already (e.g. just recorded), use it directly
      if (audioUrl.startsWith('blob:')) {
        setBlobUrl(audioUrl);
        setIsLoaded(true);
        return;
      }

      setIsLoading(true);
      try {
        const blob = await downloadAudio(audioUrl);
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load audio:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      active = false;
      // Cleanup blob URL if we created one from a download
      if (blobUrl && !audioUrl.startsWith('blob:') && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [audioUrl]);

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
  }, [blobUrl]); // Re-bind when blobUrl changes

  const togglePlayPause = () => {
    if (!audioRef.current || !isLoaded) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (progress: number) => {
    if (!audioRef.current || !isLoaded) return;
    const newTime = progress * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!blobUrl) return;
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `voice-message-${Date.now()}.webm`;
    a.click();
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  // Timer Logic
  const formatTimer = () => {
    if (!isPlaying && currentTime === 0) {
      return formatDuration(duration); // Total duration (e.g. 0:45)
    }
    if (isPlaying) {
      const remaining = Math.max(0, duration - currentTime);
      return `-${formatDuration(remaining)}`; // Countdown (e.g. -0:32)
    }
    // Paused or finished
    return formatDuration(currentTime); // Current position
  };

  return (
    <div className={cn("flex items-center gap-3 min-w-[220px] max-w-[300px]", className)}>
      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="metadata" />}

      {/* Play/Pause/Loading button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 flex-shrink-0 rounded-full transition-all duration-200",
          isOwn ? "hover:bg-primary-foreground/20 text-primary-foreground" : "hover:bg-primary/10 text-primary",
          isPlaying && "scale-105 shadow-sm" // Pulse effect placeholder
        )}
        onClick={togglePlayPause}
        disabled={!isLoaded}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 ml-0.5 fill-current" />
        )}
      </Button>

      {/* Waveform and timer container */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
        {/* Waveform */}
        <div className="h-6 w-full relative">
            {isLoading ? (
                // Skeleton Loading State
                <div className="w-full h-full flex items-center gap-0.5 animate-pulse opacity-50">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div 
                            key={i} 
                            className={cn("flex-1 rounded-full bg-current", i % 2 === 0 ? "h-3" : "h-5")} 
                        />
                    ))}
                </div>
            ) : (
                <AnimatedWaveform
                    waveform={waveform.length ? waveform : Array(30).fill(0.5)} // Fallback waveform
                    progress={progress}
                    isPlaying={isPlaying}
                    isOwn={isOwn}
                    onSeek={handleSeek}
                />
            )}
        </div>
        
        {/* Timer & Meta */}
        <div className={cn(
          "flex items-center justify-between text-[11px] font-medium tabular-nums leading-none mt-1",
          isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          <span>{formatTimer()}</span>
          
          {/* Download Icon (Small) */}
          {isLoaded && (
             <button 
                onClick={handleDownload}
                className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:text-current"
                title="Download"
             >
                <Download className="h-3 w-3" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
};
