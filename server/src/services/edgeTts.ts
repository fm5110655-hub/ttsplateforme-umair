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

      // Sort voices alphabetically by locale and friendly name
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
   * Synthesize text to speech MP3 file in output directory
   */
  async synthesize(options: SynthesisOptions): Promise<SynthesisResult> {
    const {
      text,
      voice = "en-US-AriaNeural",
      rate = "0%",
      pitch = "0Hz",
      volume = "0%"
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error("Text content is required for TTS synthesis.");
    }

    ensureOutputDir();

    const timestamp = Date.now();
    const filename = `audio-${timestamp}.mp3`;
    const targetFilePath = path.join(OUTPUT_DIR, filename);
    const latestFilePath = path.join(OUTPUT_DIR, "audio.mp3");

    const tts = new MsEdgeTTS();

    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

      // Normalize prosody parameters
      const formatRate = typeof rate === "number" ? `${rate >= 0 ? "+" : ""}${rate}%` : String(rate);
      const formatPitch = typeof pitch === "number" ? `${pitch >= 0 ? "+" : ""}${pitch}Hz` : String(pitch);
      const formatVolume = typeof volume === "number" ? `${volume >= 0 ? "+" : ""}${volume}%` : String(volume);

      const { audioStream } = tts.toStream(text.trim(), {
        rate: formatRate,
        pitch: formatPitch,
        volume: formatVolume
      });

      const writeStream = fs.createWriteStream(targetFilePath);

      await new Promise<void>((resolve, reject) => {
        audioStream.pipe(writeStream);
        audioStream.on("error", (err) => {
          writeStream.destroy();
          reject(err);
        });
        writeStream.on("finish", () => resolve());
        writeStream.on("error", (err) => reject(err));
      });

      // Keep output/audio.mp3 updated with latest audio
      try {
        fs.copyFileSync(targetFilePath, latestFilePath);
      } catch (copyErr) {
        console.warn("Could not update latest audio.mp3:", copyErr);
      }

      const stats = fs.statSync(targetFilePath);

      const metadata: AudioMetadata = {
        filename,
        url: `/audio/${filename}`,
        textSnippet: text.length > 80 ? `${text.slice(0, 77)}...` : text,
        voice,
        rate: formatRate,
        pitch: formatPitch,
        volume: formatVolume,
        sizeBytes: stats.size,
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
    } finally {
      try {
        tts.close();
      } catch {
        // Ignore close error
      }
    }
  }
}

export const edgeTtsService = new EdgeTtsService();
