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

// Ensure output directory exists
ensureOutputDir();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static generated audio files from output directory
app.use(
  "/audio",
  express.static(OUTPUT_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    }
  })
);

// Routes
app.use("/api/tts", ttsRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "tts-platform-server",
    timestamp: new Date().toISOString()
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[TTS Server] Running at http://localhost:${PORT}`);
  console.log(`[TTS Server] Audio files served at http://localhost:${PORT}/audio/`);
});
