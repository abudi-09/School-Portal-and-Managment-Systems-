import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import os from "os";

// Set the ffmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.error("ffmpeg-static not found, waveform generation may fail.");
}

/**
 * Generate a waveform (100 samples, values 0-100) from an audio buffer using FFmpeg.
 * Decodes audio to raw PCM, calculates RMS amplitude for each segment.
 */
export async function generateWaveform(
  audioBuffer: Buffer
): Promise<{ waveform: number[]; duration: number | null; error?: string }> {
  const tempInputPath = path.join(
    os.tmpdir(),
    `voice-${Date.now()}-${Math.random().toString(36).substring(7)}.tmp`
  );

  try {
    // Write buffer to temp file so FFmpeg can probe it reliably
    await fs.promises.writeFile(tempInputPath, audioBuffer);

    return await new Promise((resolve) => {
      const samples: number[] = [];
      let duration: number | null = null;

      // We'll output raw PCM data: signed 16-bit little-endian, mono, 4000Hz
      // 4000Hz is enough for a visual waveform and keeps processing fast.
      const command = ffmpeg(tempInputPath)
        .noVideo()
        .audioCodec("pcm_s16le")
        .audioChannels(1)
        .audioFrequency(4000)
        .format("s16le");

      // Get duration first
      command.on("codecData", (data) => {
        if (data.duration) {
          // format is usually HH:MM:SS.ms
          const parts = data.duration.split(":");
          if (parts.length === 3) {
            duration =
              parseFloat(parts[0]!) * 3600 +
              parseFloat(parts[1]!) * 60 +
              parseFloat(parts[2]!);
          }
        }
      });

      command.on("error", (err) => {
        console.error("FFmpeg command error:", err);
        // Ensure we clean up and resolve with error if stream error didn't trigger
        fs.unlink(tempInputPath, () => {});
        resolve({ waveform: [], duration: null, error: err.message });
      });

      const stream = command.pipe();
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        const pcmBuffer = Buffer.concat(chunks);
        // Each sample is 2 bytes (16-bit)
        const totalSamples = Math.floor(pcmBuffer.length / 2);

        // We want exactly 100 bars for the waveform
        const targetBars = 100;
        const blockSize = Math.floor(totalSamples / targetBars);

        if (blockSize < 1) {
          // Audio too short, just return what we have or pad
          // For very short audio, we'll just take every sample
          for (let i = 0; i < Math.min(targetBars, totalSamples); i++) {
            const val = pcmBuffer.readInt16LE(i * 2);
            samples.push(
              Math.min(100, Math.round((Math.abs(val) / 32768) * 100))
            );
          }
        } else {
          for (let i = 0; i < targetBars; i++) {
            let sum = 0;
            const start = i * blockSize;
            const end = Math.min(start + blockSize, totalSamples);

            // Calculate RMS (Root Mean Square) for this block
            for (let j = start; j < end; j++) {
              const val = pcmBuffer.readInt16LE(j * 2);
              sum += val * val;
            }

            const rms = Math.sqrt(sum / (end - start));
            // Normalize to 0-100 (assuming 16-bit max is 32768)
            const normalized = Math.min(100, Math.round((rms / 32768) * 100));
            samples.push(normalized);
          }
        }

        // Cleanup temp file
        fs.unlink(tempInputPath, (err) => {
          if (err) console.error("Failed to delete temp file:", err);
        });

        resolve({
          waveform: samples,
          duration: duration,
        });
      });

      stream.on("error", (err) => {
        console.error("FFmpeg stream error:", err);
        // Cleanup temp file
        fs.unlink(tempInputPath, () => {});
        resolve({ waveform: [], duration: null, error: err.message });
      });
    });
  } catch (err: any) {
    console.error("Waveform generation error:", err);
    // Try cleanup
    try {
      await fs.promises.unlink(tempInputPath);
    } catch {}
    return { waveform: [], duration: null, error: err.message };
  }
}
