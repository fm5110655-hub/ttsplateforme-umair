export interface Voice {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  SuggestedCodec: string;
  FriendlyName: string;
  Status: string;
}

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

export interface GenerateTtsRequest {
  text: string;
  voice: string;
  rate?: number; // percentage (-50 to +100)
  pitch?: number; // Hz or percentage (-50 to +50)
  volume?: number; // percentage (-50 to +50)
}

export interface GenerateTtsResponse {
  success: boolean;
  filename: string;
  audioUrl: string;
  latestAudioUrl: string;
  metadata: AudioMetadata;
  error?: string;
}

const API_BASE = ""; // Uses Vite proxy in development, direct path in production

export async function getVoices(): Promise<Voice[]> {
  const response = await fetch(`${API_BASE}/api/tts/voices`);
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }
  const data = await response.json();
  return data.voices || [];
}

export async function generateSpeech(req: GenerateTtsRequest): Promise<GenerateTtsResponse> {
  const response = await fetch(`${API_BASE}/api/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Speech generation failed.");
  }
  return data;
}

export async function getHistory(): Promise<AudioMetadata[]> {
  try {
    const response = await fetch(`${API_BASE}/api/tts/history`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.history || [];
  } catch {
    return [];
  }
}
