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
  metadata: AudioMetadata;
}

/**
 * Escapes XML/SSML characters (&, <, >) to prevent WebSocket stream abortion
 */
function sanitizeForSsml(text: string): string {
  return text
    // Replace unescaped & with &amp;
    .replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Splits large scripts into manageable sentence chunks to support unlimited script length
 * without hitting WebSocket payload limits or timeout crashes.
 */
function splitIntoChunks(text: string, maxChunkLength = 700): string[] {
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
   * Synthesize single audio chunk with automatic retry & reconnection
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
        // Small backoff before retrying
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    throw new Error("Speech synthesis failed for chunk.");
  }

  /**
   * Synthesize script of ANY length (unlimited characters) into high-fidelity studio MP3
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

    // Split text into safe chunks for unlimited length scripts
    const chunks = splitIntoChunks(text);
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkBuf = await this.synthesizeChunk(voice, chunks[i], prosody);
      audioBuffers.push(chunkBuf);
    }

    const finalAudioBuffer = Buffer.concat(audioBuffers);

    // Save to disk
    fs.writeFileSync(targetFilePath, finalAudioBuffer);

    // Update output/audio.mp3
    try {
      fs.copyFileSync(targetFilePath, latestFilePath);
    } catch (copyErr) {
      console.warn("Could not update latest audio.mp3:", copyErr);
    }

    const metadata: AudioMetadata = {
      filename,
      url: `/audio/${filename}`,
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
      audioUrl: `/audio/${filename}`,
      latestAudioUrl: `/audio/audio.mp3`,
      metadata
    };
  }
}

export const edgeTtsService = new EdgeTtsService();
