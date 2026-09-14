import { Router, Request, Response } from "express";
import { edgeTtsService } from "../services/edgeTts";
import { getHistoryMetadata } from "../utils/fileHelper";

const router = Router();

/**
 * POST /api/tts
 * Synthesize text into audio file
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voice, rate, pitch, volume } = req.body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      res.status(400).json({
        success: false,
        error: "Field 'text' is required and cannot be empty."
      });
      return;
    }

    const result = await edgeTtsService.synthesize({
      text,
      voice,
      rate,
      pitch,
      volume
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("TTS generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate speech."
    });
  }
});

/**
 * GET /api/tts/voices
 * Fetch list of natural voices
 */
router.get("/voices", async (_req: Request, res: Response): Promise<void> => {
  try {
    const voices = await edgeTtsService.getVoices();
    res.status(200).json({
      success: true,
      count: voices.length,
      voices
    });
  } catch (error: any) {
    console.error("Fetch voices error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve voices."
    });
  }
});

/**
 * GET /api/tts/history
 * Protected - history is stored privately on the client device
 */
router.get("/history", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    count: 0,
    history: []
  });
});

export default router;
