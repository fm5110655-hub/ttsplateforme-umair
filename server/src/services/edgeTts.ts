import fs from "fs";
import path from "path";
import { MsEdgeTTS, OUTPUT_FORMAT, Voice } from "msedge-tts";
import { ensureOutputDir, OUTPUT_DIR, AudioMetadata, saveAudioMetadata } from "../utils/fileHelper";

export interface SynthesisOptions {
  text: string;
  voice?: string;
  rate?: string | number;
  pitch?: string | number;
  volume?: string | number;
}

export interface SynthesisResult {
  success: boolean;
  filename: string;
  audioUrl: string;
  latestAudioUrl: string;
  audioBase64?: string;
  metadata: AudioMetadata;
}

/**
 * Escapes XML/SSML characters (&, <, >) to prevent WebSocket stream abortion
 */
function sanitizeForSsml(text: string): string {
  return text
    .replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Splits large scripts into manageable sentence chunks for ultra-fast parallel synthesis
 */
function splitIntoChunks(text: string, maxChunkLength = 850): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChunkLength) {
    return [trimmed];
  }

  // Split by paragraph first
  const paragraphs = trimmed.split(/\r?\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;

    if ((currentChunk + " " + p).trim().length <= maxChunkLength) {
      currentChunk = currentChunk ? currentChunk + "\n" + p : p;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      if (p.length > maxChunkLength) {
        // Split paragraph by sentence delimiters (. ! ? 。 ۔ \n)
        const sentences = p.match(/[^.!?。۔\n]+[.!?。۔\n]+|[^.!?。۔\n]+/g) || [p];
        for (const s of sentences) {
          if ((currentChunk + " " + s).trim().length <= maxChunkLength) {
            currentChunk = currentChunk ? currentChunk + " " + s.trim() : s.trim();
          } else {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = s.trim();
          }
        }
      } else {
        currentChunk = p;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

/**
 * Executes async tasks concurrently with an exact concurrency limit while preserving result order
 */
async function runConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

class EdgeTtsService {
  private cachedVoices: Voice[] | null = null;
  private voicesLastFetched: number = 0;
  private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch all available Edge TTS neural voices with in-memory caching
   */
  async getVoices(): Promise<Voice[]> {
    const now = Date.now();
    if (this.cachedVoices && now - this.voicesLastFetched < this.CACHE_TTL_MS) {
      return this.cachedVoices;
    }

    try {
      const tts = new MsEdgeTTS();
      const voices = await tts.getVoices();
      tts.close();

      this.cachedVoices = voices.sort((a, b) => {
        if (a.Locale === b.Locale) {
          return a.FriendlyName.localeCompare(b.FriendlyName);
        }
        return a.Locale.localeCompare(b.Locale);
      });
      this.voicesLastFetched = now;
      return this.cachedVoices;
    } catch (error) {
      console.error("Error fetching Edge TTS voices:", error);
      if (this.cachedVoices) {
        return this.cachedVoices;
      }
      throw error;
    }
  }

  /**
   * Synthesizes single audio chunk with automatic retry & fast cleanup
   */
  private async synthesizeChunk(
    voice: string,
    chunkText: string,
    prosody: { rate: string; pitch: string; volume: string },
    maxRetries = 2
  ): Promise<Buffer> {
    const cleanText = sanitizeForSsml(chunkText);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let tts: MsEdgeTTS | null = null;
      try {
        tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        const { audioStream } = tts.toStream(cleanText, prosody);
        const buffers: Buffer[] = [];

        const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
          audioStream.on("data", (chunk: Buffer) => buffers.push(chunk));
          audioStream.on("end", () => resolve(Buffer.concat(buffers)));
          audioStream.on("error", (err) => reject(err));
        });

        tts.close();
        return audioBuffer;
      } catch (err: any) {
        try {
          tts?.close();
        } catch {}

        if (attempt === maxRetries) {
          console.error(`Chunk synthesis failed after ${maxRetries + 1} attempts:`, err);
          throw err;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    throw new Error("Speech synthesis failed for chunk.");
  }

  /**
   * High-speed parallel synthesis for scripts of any length
   */
  async synthesize(options: SynthesisOptions): Promise<SynthesisResult> {
    const {
      text,
      voice = "en-US-AvaMultilingualNeural",
      rate = "0%",
      pitch = "0Hz",
      volume = "0%"
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error("Text content is required for speech synthesis.");
    }

    ensureOutputDir();

    const timestamp = Date.now();
    const filename = `audio-${timestamp}.mp3`;
    const targetFilePath = path.join(OUTPUT_DIR, filename);
    const latestFilePath = path.join(OUTPUT_DIR, "audio.mp3");

    // Format prosody options
    const formatRate = typeof rate === "number" ? `${rate >= 0 ? "+" : ""}${rate}%` : String(rate);
    const formatPitch = typeof pitch === "number" ? `${pitch >= 0 ? "+" : ""}${pitch}Hz` : String(pitch);
    const formatVolume = typeof volume === "number" ? `${volume >= 0 ? "+" : ""}${volume}%` : String(volume);

    const prosody = {
      rate: formatRate,
      pitch: formatPitch,
      volume: formatVolume
    };

    // Split text into chunks
    const chunks = splitIntoChunks(text, 850);

    // Run chunks concurrently (up to 4 parallel streams) for maximum speed
    const CONCURRENCY_LIMIT = 4;
    const audioBuffers = await runConcurrent(chunks, CONCURRENCY_LIMIT, async (chunk) => {
      return this.synthesizeChunk(voice, chunk, prosody);
    });

    const finalAudioBuffer = Buffer.concat(audioBuffers);

    // Write final merged MP3 directly to disk
    fs.writeFileSync(targetFilePath, finalAudioBuffer);

    // Keep output/audio.mp3 updated
    try {
      fs.copyFileSync(targetFilePath, latestFilePath);
    } catch (copyErr) {
      console.warn("Could not update latest audio.mp3:", copyErr);
    }

    const audioBase64 = `data:audio/mp3;base64,${finalAudioBuffer.toString("base64")}`;

    const metadata: AudioMetadata = {
      filename,
      url: audioBase64,
      textSnippet: text.length > 80 ? `${text.slice(0, 77)}...` : text,
      voice,
      rate: formatRate,
      pitch: formatPitch,
      volume: formatVolume,
      sizeBytes: finalAudioBuffer.length,
      createdAt: new Date(timestamp).toISOString()
    };

    saveAudioMetadata(metadata);

    return {
      success: true,
      filename,
      audioUrl: audioBase64,
      latestAudioUrl: `/audio/audio.mp3`,
      audioBase64,
      metadata
    };
  }
}

export const edgeTtsService = new EdgeTtsService();
