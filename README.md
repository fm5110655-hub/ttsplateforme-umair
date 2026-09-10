# TTS Platform (Edge-TTS)

A full-stack Text-to-Speech (TTS) web application leveraging Microsoft Edge Neural Speech synthesis, built with **React**, **Vite**, **Express**, and **TypeScript**.

---

## Architecture Flow

```
Frontend (React + Vite)
       │
       ▼  POST /api/tts
server/routes/tts.ts
       │
       ▼
services/edgeTts.ts
       │
       ▼
Microsoft Edge-TTS
       │
       ▼
output/audio.mp3
       │
       ▼
Frontend Player (Playback, Download, Waveform & History)
```

---

## Project Structure

```
tts-platform/
│
├── client/                 # Frontend (React 18 + Vite + Tailwind CSS + TypeScript)
│   ├── src/
│   │   ├── api/            # API client (ttsApi.ts)
│   │   ├── components/     # AudioPlayer, VoiceSelector, TtsConfigPanel, HistoryList
│   │   ├── pages/          # Home.tsx workstation
│   │   ├── App.tsx         # Main application layout
│   │   ├── index.css       # Tailwind CSS directives
│   │   └── main.tsx        # React DOM render entry
│   ├── index.html
│   ├── vite.config.ts      # Proxy to backend (/api and /audio)
│   └── package.json
│
├── server/                 # Backend (Express + TypeScript + msedge-tts)
│   ├── src/
│   │   ├── routes/
│   │   │   └── tts.ts      # /api/tts routes (generate, voices, history)
│   │   ├── services/
│   │   │   └── edgeTts.ts  # Edge-TTS synthesis & voice caching
│   │   ├── utils/
│   │   │   └── fileHelper.ts # File management & metadata store
│   │   └── index.ts        # Express app entry & static /audio serving
│   ├── tsconfig.json
│   └── package.json
│
├── output/                 # Generated audio files (*.mp3)
│   ├── .gitkeep
│   ├── audio.mp3           # Latest synthesized audio
│   └── metadata.json       # Generation history metadata
│
├── .env                    # Environment variables (PORT=5000)
├── .gitignore              # Git ignore rules
├── package.json            # Root workspace scripts (dev, build, start)
└── README.md
```

---

## Features

- **300+ Microsoft Edge Neural Voices**: Natural voices in dozens of languages (English, Urdu, Hindi, Spanish, French, Arabic, etc.).
- **Custom Speech Controls**: Fine-tune speaking speed (rate), voice pitch, and audio volume.
- **Modern Audio Player**: Play/pause, seek progress bar, speed control (0.75x to 1.5x), animated waveform, volume slider, and instant MP3 download.
- **Audio History & Instant Replay**: Automatically tracks synthesized audio clips with timestamps and one-click replay.
- **Direct Stream Synthesis**: Directly streams Edge neural audio into MP3 files saved in the `output/` directory and updates `output/audio.mp3`.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Run in Development Mode
To start both the backend server and frontend client simultaneously:
```bash
npm run dev
```

Or run them in separate terminals:
```bash
# Terminal 1: Backend (http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend (http://localhost:5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start generating speech.

---

## API Reference

### 1. Synthesize Speech
- **Endpoint**: `POST /api/tts`
- **Body**:
  ```json
  {
    "text": "Hello world",
    "voice": "en-US-AriaNeural",
    "rate": 0,
    "pitch": 0,
    "volume": 0
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "filename": "audio-1726000000.mp3",
    "audioUrl": "/audio/audio-1726000000.mp3",
    "latestAudioUrl": "/audio/audio.mp3",
    "metadata": { ... }
  }
  ```

### 2. Get Available Voices
- **Endpoint**: `GET /api/tts/voices`
- **Response**: List of all neural voices with name, locale, gender, and status.

### 3. Get Generation History
- **Endpoint**: `GET /api/tts/history`
- **Response**: List of recently generated audio clips and their metadata.

### 4. Audio Streaming / Download
- **Endpoint**: `GET /audio/:filename` (e.g., `http://localhost:5000/audio/audio.mp3`)
