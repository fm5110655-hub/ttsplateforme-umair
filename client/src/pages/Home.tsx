import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Volume2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText
} from "lucide-react";
import {
  Voice,
  AudioMetadata,
  getVoices,
  generateSpeech,
  getHistory
} from "../api/ttsApi";
import { VoiceSelector } from "../components/VoiceSelector";
import { TtsConfigPanel } from "../components/TtsConfigPanel";
import { AudioPlayer } from "../components/AudioPlayer";
import { HistoryList } from "../components/HistoryList";

const SAMPLE_PROMPTS = [
  {
    label: "English Narration",
    voice: "en-US-AriaNeural",
    text: "Welcome to our Edge TTS voice platform. This audio was synthesized using Microsoft Edge high-fidelity neural voices in real-time."
  },
  {
    label: "Urdu Storytelling",
    voice: "ur-PK-GulNeural",
    text: "خوش آمدید! یہ آواز مائیکروسافٹ ایج کی نیورل ٹیکنالوجی کے ذریعے تیار کی گئی ہے۔"
  },
  {
    label: "Tech Podcast",
    voice: "en-US-GuyNeural",
    text: "Artificial intelligence and neural text-to-speech are completely changing how humans interact with digital media and interactive agents."
  },
  {
    label: "Hindi Announcement",
    voice: "hi-IN-SwaraNeural",
    text: "नमस्ते! इस मंच पर आपका स्वागत है। आप अपनी आवाज़ की गति और पिच को भी बदल सकते हैं।"
  }
];

export const Home: React.FC = () => {
  const [text, setText] = useState(SAMPLE_PROMPTS[0].text);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("en-US-AriaNeural");
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  // Prosody controls
  const [rate, setRate] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(0);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active audio
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>("audio.mp3");
  const [currentSnippet, setCurrentSnippet] = useState<string>("");
  const [currentVoiceName, setCurrentVoiceName] = useState<string>("");

  // History
  const [history, setHistory] = useState<AudioMetadata[]>([]);

  useEffect(() => {
    loadVoices();
    loadHistory();
  }, []);

  const loadVoices = async () => {
    try {
      setIsLoadingVoices(true);
      const list = await getVoices();
      setVoices(list);
      if (list.length > 0 && !list.find((v) => v.ShortName === selectedVoice)) {
        setSelectedVoice(list[0].ShortName);
      }
    } catch (err: any) {
      console.error("Failed to load voices:", err);
      setErrorMessage("Could not connect to TTS server voices. Please ensure server is running.");
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await getHistory();
      setHistory(hist);
      if (hist.length > 0 && !currentAudioUrl) {
        // Pre-load latest audio into player
        setCurrentAudioUrl(hist[0].url);
        setCurrentFilename(hist[0].filename);
        setCurrentSnippet(hist[0].textSnippet);
        setCurrentVoiceName(hist[0].voice);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleResetSliders = () => {
    setRate(0);
    setPitch(0);
    setVolume(0);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMessage("Please enter text to synthesize.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGenerating(true);

    try {
      const response = await generateSpeech({
        text,
        voice: selectedVoice,
        rate,
        pitch,
        volume
      });

      setCurrentAudioUrl(response.audioUrl);
      setCurrentFilename(response.filename);
      setCurrentSnippet(response.metadata.textSnippet);
      setCurrentVoiceName(response.metadata.voice);
      setSuccessMessage("Audio synthesized successfully!");

      // Refresh history
      loadHistory();
    } catch (err: any) {
      console.error("TTS generation error:", err);
      setErrorMessage(err.message || "Failed to generate speech. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistoryItem = (item: AudioMetadata) => {
    setCurrentAudioUrl(item.url);
    setCurrentFilename(item.filename);
    setCurrentSnippet(item.textSnippet);
    setCurrentVoiceName(item.voice);
    setSelectedVoice(item.voice);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20 text-white">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Edge TTS Platform
              </h1>
              <p className="text-xs text-slate-400">
                Generate high-quality Microsoft Edge neural speech with real-time controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {voices.length > 0 ? `${voices.length} Voices Online` : "Connecting..."}
          </span>
        </div>
      </header>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Text Input Section */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="tts-text"
                  className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Speech Text
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {text.length} characters
                </span>
              </div>

              <textarea
                id="tts-text"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste the text you want to convert to speech..."
                className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-sans"
              />

              {/* Sample Prompts */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-500 block mb-1.5">Try sample texts:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setText(sample.text);
                        setSelectedVoice(sample.voice);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-colors"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                isLoading={isLoadingVoices}
              />
            </div>

            {/* Prosody Customization Panel */}
            <TtsConfigPanel
              rate={rate}
              pitch={pitch}
              volume={volume}
              onRateChange={setRate}
              onPitchChange={setPitch}
              onVolumeChange={setVolume}
              onReset={handleResetSliders}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !text.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Audio via Edge-TTS...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Audio</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Audio Player & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Audio Player */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Audio Player
            </h2>
            <AudioPlayer
              audioUrl={currentAudioUrl}
              filename={currentFilename}
              textSnippet={currentSnippet}
              voiceName={currentVoiceName}
            />
          </div>

          {/* History List */}
          <div>
            <HistoryList
              history={history}
              onSelectHistory={handleSelectHistoryItem}
              currentFilename={currentFilename}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
