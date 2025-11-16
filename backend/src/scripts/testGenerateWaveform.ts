import fs from "fs";
import path from "path";
import { generateWaveform } from "../utils/generateWaveform";

(async () => {
  console.log("Running generateWaveform smoke test");
  // Create a pseudo-random buffer as a stand-in for small audio file
  const buf = Buffer.alloc(20000);
  for (let i = 0; i < buf.length; i++)
    buf[i] = Math.floor(Math.sin(i / 10) * 127 + 128);

  try {
    const { waveform, duration, error } = await generateWaveform(buf);
    console.log("waveform length:", waveform.length);
    console.log("waveform sample (first 10):", waveform.slice(0, 10));
    console.log("duration:", duration, "error:", error ?? "none");
    if (waveform.length < 10 || waveform.length > 60) {
      console.error("Test failed: waveform length out of expected bounds");
      process.exit(2);
    }
    console.log("generateWaveform test passed");
    process.exit(0);
  } catch (err) {
    console.error("generateWaveform test error", err);
    process.exit(1);
  }
})();
