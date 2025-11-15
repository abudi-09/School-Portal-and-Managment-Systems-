import { parseBuffer } from 'music-metadata';

/**
 * Generate a waveform (10-60 samples, values 0-100) from an audio buffer.
 * Falls back to pseudo-random samples if decoding/amplitude extraction fails.
 */
export async function generateWaveform(audioBuffer: Buffer): Promise<{ waveform: number[]; duration: number | null; error?: string }> {
  try {
    // Attempt to parse duration using music-metadata (container level)
    const metadata = await parseBuffer(audioBuffer, undefined, { duration: true });
    const duration = metadata.format.duration ? Math.round(metadata.format.duration) : null;

    // Simple amplitude heuristic: sample raw bytes and treat absolute deviation from 128 as amplitude (for compressed formats this is approximate)
    const byteData = new Uint8Array(audioBuffer);
    // Decide sample count based on size (clamped 24-48 typical, ensure within 10-60)
    const targetSamples = Math.min(60, Math.max(10, Math.round(byteData.length / 4000))); // heuristic
    const segmentSize = Math.max(1, Math.floor(byteData.length / targetSamples));
    const samples: number[] = [];
    for (let i = 0; i < targetSamples; i++) {
      const start = i * segmentSize;
      const end = Math.min(byteData.length, start + segmentSize);
      if (start >= byteData.length) {
        samples.push(0);
        continue;
      }
      let peak = 0;
      for (let j = start; j < end; j += 4) { // stride for performance
        const v = byteData[j];
        const amp = Math.abs(v - 128); // center around midpoint
        if (amp > peak) peak = amp;
      }
      // Normalize peak (0..128) to 0..100
      const normalized = Math.min(100, Math.round((peak / 128) * 100));
      samples.push(normalized);
    }
    // Smooth slight spikes by simple averaging pass
    for (let k = 1; k < samples.length - 1; k++) {
      samples[k] = Math.round((samples[k - 1] + samples[k] + samples[k + 1]) / 3);
    }

    return { waveform: samples, duration };
  } catch (err: any) {
    // Fallback random waveform
    const fallbackCount = 10;
    const waveform = Array.from({ length: fallbackCount }, () => Math.floor(Math.random() * 85) + 10);
    return { waveform, duration: null, error: err?.message || 'decode_failed' };
  }
}
