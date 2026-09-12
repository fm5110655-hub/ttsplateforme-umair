import fs from "fs";
import path from "path";

// In cloud environments (Railway, Render), use /tmp for ephemeral file writes
// In development/local, use the project's output/ folder
function resolveOutputDir(): string {
  if (process.env.OUTPUT_DIR) {
    return process.env.OUTPUT_DIR;
  }
  // On Railway (read-only filesystem), use /tmp
  if (process.env.NODE_ENV === "production") {
    return "/tmp/tts-output";
  }
  // Local development: project root output/ folder
  return path.resolve(__dirname, "../../../output");
}

export const OUTPUT_DIR = resolveOutputDir();

// Ensure directory exists
export const ensureOutputDir = (): void => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
};

export interface AudioMetadata {
  filename: string;
  url: string;
  textSnippet: string;
  voice: string;
  rate: string;
  pitch: string;
  volume: string;
  sizeBytes: number;
  createdAt: string;
}

const METADATA_FILE = path.join(OUTPUT_DIR, "metadata.json");

export const getHistoryMetadata = (): AudioMetadata[] => {
  try {
    ensureOutputDir();
    if (!fs.existsSync(METADATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(METADATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveAudioMetadata = (entry: AudioMetadata): void => {
  try {
    ensureOutputDir();
    const list = getHistoryMetadata();
    list.unshift(entry);
    const trimmed = list.slice(0, 50);
    fs.writeFileSync(METADATA_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save audio metadata:", error);
  }
};
