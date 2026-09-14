import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
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

// === SERVE REACT FRONTEND ===
// Serve the built React SPA from client/dist if present
const clientBuildPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientBuildPath)) {
  console.log(`[TTS Server] Serving React frontend from ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  // For any non-API route, serve index.html (SPA client routing)
  app.get("*", (req, res) => {
    // Avoid intercepting audio or api requests that 404
    if (req.path.startsWith("/api") || req.path.startsWith("/audio")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Start listening if not in Vercel serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`[TTS Server] Running at http://localhost:${PORT}`);
    console.log(`[TTS Server] Mode: ${NODE_ENV}`);
    console.log(`[TTS Server] Audio files served at /audio/`);
  });
}

export default app;
