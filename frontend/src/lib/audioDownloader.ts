/**
 * Audio Downloader Utility
 * Handles downloading and caching of audio blobs to prevent re-fetching.
 */

const audioCache = new Map<string, Blob>();
const activeDownloads = new Map<string, Promise<Blob>>();

/**
 * Downloads audio from a URL or retrieves it from cache.
 * @param url The URL of the audio file.
 * @returns A Promise resolving to the audio Blob.
 */
export const downloadAudio = async (url: string): Promise<Blob> => {
  // Check cache first
  if (audioCache.has(url)) {
    return audioCache.get(url)!;
  }

  // Check if already downloading
  if (activeDownloads.has(url)) {
    return activeDownloads.get(url)!;
  }

  // Start new download
  const downloadPromise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
      const blob = await response.blob();
      audioCache.set(url, blob);
      return blob;
    } finally {
      activeDownloads.delete(url);
    }
  })();

  activeDownloads.set(url, downloadPromise);
  return downloadPromise;
};

/**
 * Synchronously gets the cached blob if it exists.
 */
export const getCachedAudio = (url: string): Blob | undefined => {
  return audioCache.get(url);
};

/**
 * Manually cache a blob for a specific URL (e.g. after recording).
 */
export const cacheAudio = (url: string, blob: Blob): void => {
  audioCache.set(url, blob);
};

/**
 * Clears the audio cache.
 */
export const clearCache = (): void => {
  audioCache.clear();
};
