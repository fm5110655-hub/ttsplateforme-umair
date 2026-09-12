import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import ttsRouter from "./routes/tts";
import { ensureOutputDir, OUTPUT_DIR } from "./utils/fileHelper";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Ensure output directory exists
ensureOutputDir();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static generated audio files from output directory
app.use(
  "/audio",
  express.static(OUTPUT_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Accept-Ranges", "bytes");
      }
    }
  })
);

// API Routes
app.use("/api/tts", ttsRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "tts-platform-server",
    env: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// === SERVE REACT FRONTEND IN PRODUCTION ===
// In production (Railway/cloud), serve the built React app from client/dist
if (NODE_ENV === "production") {
  const clientBuildPath = path.resolve(__dirname, "../../client/dist");

  // Serve React static assets (JS, CSS, images)
  app.use(express.static(clientBuildPath));

  // For any non-API route, serve index.html (SPA routing support)
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Start listening
app.listen(PORT, () => {
  console.log(`[TTS Server] Running at http://localhost:${PORT}`);
  console.log(`[TTS Server] Mode: ${NODE_ENV}`);
  console.log(`[TTS Server] Audio files served at /audio/`);
  if (NODE_ENV === "production") {
    console.log(`[TTS Server] Serving React frontend from client/dist`);
  }
});
