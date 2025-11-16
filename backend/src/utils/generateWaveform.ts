import { parseBuffer } from "music-metadata";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";

/**
 * Generate a waveform (10-60 samples, values 0-100) from an audio buffer.
 * Falls back to pseudo-random samples if decoding/amplitude extraction fails.
 */
export async function generateWaveform(
  audioBuffer: Buffer
): Promise<{ waveform: number[]; duration: number | null; error?: string }> {
  try {
    // First try: decode to PCM using ffmpeg for accurate amplitude extraction
    if (ffmpegPath) {
      try {
        const ff = spawn(ffmpegPath, [
          "-i",
          "pipe:0",
          "-f",
          "s16le",
          "-acodec",
          "pcm_s16le",
          "-ac",
          "1",
          "-ar",
          "16000",
          "pipe:1",
        ]);

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        ff.stdout.on("data", (c) => stdoutChunks.push(Buffer.from(c)));
        ff.stderr.on("data", (c) => stderrChunks.push(Buffer.from(c)));

        ff.stdin.write(audioBuffer);
        ff.stdin.end();

        const exitCode: number = (await new Promise((resolve, reject) => {
          ff.on("close", resolve);
          ff.on("error", reject);
        })) as number;

        const stderr = Buffer.concat(stderrChunks).toString("utf8");
        const pcm = Buffer.concat(stdoutChunks);
        if (exitCode === 0 && pcm.length > 0) {
          // pcm is 16-bit signed little-endian
          const samples = new Int16Array(
            pcm.buffer,
            pcm.byteOffset,
            Math.floor(pcm.length / 2)
          );
          const totalSamples = samples.length;
          const targetSamples = Math.min(
            60,
            Math.max(10, Math.round(totalSamples / 1600))
          );
          const segment = Math.max(1, Math.floor(totalSamples / targetSamples));
          const peaks: number[] = [];
          let globalMax = 0;
          for (let i = 0; i < targetSamples; i++) {
            const start = i * segment;
            const end = Math.min(totalSamples, start + segment);
            let peak = 0;
            for (let s = start; s < end; s++) {
              const v = Math.abs(samples[s]);
              if (v > peak) peak = v;
            }
            peaks.push(peak);
            if (peak > globalMax) globalMax = peak;
          }
          const normalized = peaks.map((p) =>
            Math.round((p / (globalMax || 1)) * 100)
          );
          // Smooth
          for (let k = 1; k < normalized.length - 1; k++) {
            const a = normalized[k - 1] ?? 0;
            const b = normalized[k] ?? 0;
            const c = normalized[k + 1] ?? 0;
            normalized[k] = Math.round((a + b + c) / 3);
          }
          // Try to extract duration from stderr (ffmpeg prints duration info)
          const durMatch = stderr.match(
            /Duration: (\d\d):(\d\d):(\d\d)\.(\d\d)/
          );
          const duration = durMatch
            ? Number(durMatch[1]) * 3600 +
              Number(durMatch[2]) * 60 +
              Number(durMatch[3])
            : null;
          return { waveform: normalized, duration };
        }
        // If ffmpeg produced no PCM, fall through to metadata heuristic
      } catch (ffErr: any) {
        // continue to fallback
      }
    }

    // Fallback: Attempt to parse duration using music-metadata (container level)
    const metadata = await parseBuffer(audioBuffer, undefined, {
      duration: true,
    });
    const duration = metadata.format.duration
      ? Math.round(metadata.format.duration)
      : null;

    // Simple amplitude heuristic: sample raw bytes and treat absolute deviation from 128 as amplitude (approximate for compressed formats)
    const byteData = new Uint8Array(audioBuffer);
    const targetSamples = Math.min(
      60,
      Math.max(10, Math.round(byteData.length / 4000))
    );
    const segmentSize = Math.max(
      1,
      Math.floor(byteData.length / targetSamples)
    );
    const samples: number[] = [];
    for (let i = 0; i < targetSamples; i++) {
      const start = i * segmentSize;
      const end = Math.min(byteData.length, start + segmentSize);
      if (start >= byteData.length) {
        samples.push(0);
        continue;
      }
      let peak = 0;
      for (let j = start; j < end; j += 4) {
        const v = byteData[j] ?? 128;
        const amp = Math.abs(v - 128);
        if (amp > peak) peak = amp;
      }
      const normalized = Math.min(100, Math.round((peak / 128) * 100));
      samples.push(normalized);
    }
    for (let k = 1; k < samples.length - 1; k++) {
      const a = samples[k - 1] ?? 0;
      const b = samples[k] ?? 0;
      const c = samples[k + 1] ?? 0;
      samples[k] = Math.round((a + b + c) / 3);
    }
    return { waveform: samples, duration };
  } catch (err: any) {
    // Fallback random waveform
    const fallbackCount = 10;
    const waveform = Array.from(
      { length: fallbackCount },
      () => Math.floor(Math.random() * 85) + 10
    );
    return { waveform, duration: null, error: err?.message || "decode_failed" };
  }
}
