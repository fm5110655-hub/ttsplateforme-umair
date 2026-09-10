import fs from "fs";
import path from "path";

// Resolves output directory relative to project root
export const OUTPUT_DIR = path.resolve(__dirname, "../../../output");

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
    // Keep last 50 entries
    const trimmed = list.slice(0, 50);
    fs.writeFileSync(METADATA_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save audio metadata:", error);
  }
};
