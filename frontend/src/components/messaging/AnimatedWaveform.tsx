import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedWaveformProps {
  waveform: number[];
  progress: number; // 0-1
  isPlaying: boolean;
  isOwn: boolean;
  onSeek: (progress: number) => void;
  className?: string;
}

export const AnimatedWaveform = ({
  waveform,
  progress,
  isPlaying,
  isOwn,
  onSeek,
  className,
}: AnimatedWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / waveform.length;
      const barGap = 1;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      waveform.forEach((amplitude, i) => {
        const barHeight = Math.max(3, amplitude * height * 0.75);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        // Determine if this bar has been played
        const barProgress = i / waveform.length;
        const isPlayed = barProgress < progress;

        // Create gradient for smooth transition
        const transitionZone = 0.02; // 2% transition zone
        const isInTransition = 
          barProgress >= progress - transitionZone && 
          barProgress <= progress + transitionZone;

        if (isInTransition && isPlaying) {
          // Smooth gradient transition at playhead
          const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
          const localProgress = (progress - barProgress) / transitionZone;
          
          if (isOwn) {
            gradient.addColorStop(0, isPlayed ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.35)');
            gradient.addColorStop(1, isPlayed ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.35)');
          } else {
            gradient.addColorStop(0, isPlayed ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.25)');
            gradient.addColorStop(1, isPlayed ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.25)');
          }
          ctx.fillStyle = gradient;
        } else {
          // Regular coloring
          if (isOwn) {
            ctx.fillStyle = isPlayed 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(255, 255, 255, 0.35)';
          } else {
            ctx.fillStyle = isPlayed 
              ? 'hsl(var(--primary))' 
              : 'hsl(var(--muted-foreground) / 0.25)';
          }
        }

        // Draw rounded rectangle for bar
        const radius = Math.min(barWidth / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - barGap, barHeight, radius);
        ctx.fill();
      });

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [waveform, progress, isPlaying, isOwn]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / rect.width;
    onSeek(Math.max(0, Math.min(1, clickProgress)));
  };

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={32}
      className={cn(
        "w-full h-8 cursor-pointer transition-opacity hover:opacity-80",
        className
      )}
      onClick={handleClick}
      style={{ imageRendering: 'auto' }}
    />
  );
};
