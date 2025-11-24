import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedWaveformProps {
  waveform: number[];
  progress: number; // 0 to 1
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

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);

    const draw = () => {
      const width = rect.width;
      const height = rect.height;
      const barCount = waveform.length;
      const barWidth = (width / barCount) * 0.6; // 60% width, 40% gap
      const gap = (width / barCount) * 0.4;
      
      ctx.clearRect(0, 0, width, height);

      waveform.forEach((amplitude, i) => {
        // Calculate x position
        const x = i * (width / barCount) + gap / 2;
        
        // Calculate bar height with minimum visibility
        // Apply a "wave" effect around the playhead if playing
        let currentAmplitude = amplitude;
        
        if (isPlaying) {
            // Calculate distance from playhead (0 to 1)
            const barProgress = i / barCount;
            const dist = Math.abs(barProgress - progress);
            
            // Wave effect: boost amplitude near playhead
            if (dist < 0.1) {
                const boost = Math.sin((1 - dist / 0.1) * Math.PI / 2) * 0.3;
                currentAmplitude = Math.min(1, currentAmplitude + boost);
            }
        }

        const barHeight = Math.max(3, currentAmplitude * height * 0.8);
        const y = (height - barHeight) / 2;

        // Determine color based on progress
        const barProgress = i / barCount;
        const isPlayed = barProgress < progress;

        // Colors
        const playedColor = isOwn ? 'rgba(255, 255, 255, 1)' : '#3b82f6'; // White or Blue
        const unplayedColor = isOwn ? 'rgba(255, 255, 255, 0.4)' : '#cbd5e1'; // Transparent White or Gray

        // Draw rounded rect
        ctx.fillStyle = isPlayed ? playedColor : unplayedColor;
        
        // Rounded rect logic
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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
    const clickProgress = Math.max(0, Math.min(1, x / rect.width));
    onSeek(clickProgress);
  };

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-full cursor-pointer touch-none", className)}
      onClick={handleClick}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
