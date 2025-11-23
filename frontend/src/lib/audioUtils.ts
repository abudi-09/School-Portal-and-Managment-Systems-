/**
 * Audio utility functions for voice message processing
 */

/**
 * Generate waveform data from audio buffer
 * @param audioBuffer - Web Audio API AudioBuffer
 * @param samples - Number of samples for the waveform (default: 50)
 * @returns Array of normalized amplitude values (0-1)
 */
export const generateWaveform = (audioBuffer: AudioBuffer, samples: number = 50): number[] => {
  const rawData = audioBuffer.getChannelData(0); // Get first channel
  const blockSize = Math.floor(rawData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;
    
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j]);
    }
    
    waveform.push(sum / blockSize);
  }

  // Normalize to 0-1 range
  const max = Math.max(...waveform);
  return waveform.map(v => (max === 0 ? 0 : v / max));
};

/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "02:35")
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Validate audio file
 * @param file - File to validate
 * @returns True if valid audio file
 */
export const validateAudioFile = (file: File): boolean => {
  const validTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/mpeg'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
};

/**
 * Convert blob to base64 string
 * @param blob - Blob to convert
 * @returns Promise resolving to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Get audio duration from blob
 * @param blob - Audio blob
 * @returns Promise resolving to duration in seconds
 */
export const getAudioDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio'));
    });
    
    audio.src = url;
  });
};

/**
 * Create audio context for processing
 * @returns AudioContext instance
 */
export const createAudioContext = (): AudioContext => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
};
