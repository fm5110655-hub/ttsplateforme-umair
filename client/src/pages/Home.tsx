import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Volume2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  Zap
} from "lucide-react";
import {
  Voice,
  AudioMetadata,
  getVoices,
  generateSpeech
} from "../api/ttsApi";
import { VoiceSelector } from "../components/VoiceSelector";
import { TtsConfigPanel } from "../components/TtsConfigPanel";
import { AudioPlayer } from "../components/AudioPlayer";
import { HistoryList } from "../components/HistoryList";

const COUNTRY_SAMPLE_TEXTS: Record<string, string> = {
  Pakistan: "Hello! This voice delivers warm, conversational, and authentic human speech without any robotic artifacts.",
  "United States": "Hello! This voice sounds completely authentic and human-grade, with natural breathing pauses and conversational clarity.",
  "United Kingdom": "Good day! This British accent provides warm, natural, human-like voice delivery without any robotic artifacts.",
  India: "Welcome! This voice provides crystal-clear and authentic speech synthesis with studio clarity.",
  "Saudi Arabia": "Welcome! Experience high-fidelity natural speech synthesis with smooth conversational flow.",
  "United Arab Emirates": "Greetings! Enjoy natural, studio-quality neural speech with expressive pronunciation.",
  Canada: "Welcome! Experience realistic, human-quality voice synthesis with studio clarity.",
  Australia: "G'day! Here is a natural and authentic Australian voice that sounds just like a real person.",
  Germany: "Hello! This voice offers clear, authentic, and completely natural speech delivery.",
  France: "Welcome! Enjoy warm, natural human intonation with high-fidelity clarity.",
  "Türkiye": "Hello! This voice provides fluent, warm, and natural conversational speech."
};

export const Home: React.FC = () => {
  const [text, setText] = useState(COUNTRY_SAMPLE_TEXTS["United States"]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("en-US-AvaMultilingualNeural");
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  // Prosody controls (0 = 100% natural human speed and pitch)
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

      // Default to high-quality US natural voice or first available
      const defaultVoice = list.find((v) => v.ShortName === "en-US-AvaMultilingualNeural" || v.ShortName === "en-US-AndrewMultilingualNeural");
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.ShortName);
      } else if (list.length > 0) {
        setSelectedVoice(list[0].ShortName);
      }
    } catch (err: any) {
      console.error("Failed to load voices:", err);
      setErrorMessage("Could not connect to TTS server voices. Please ensure server is running.");
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem("umair_tts_private_history");
      if (stored) {
        const parsed: AudioMetadata[] = JSON.parse(stored);
        setHistory(parsed);
        if (parsed.length > 0 && !currentAudioUrl) {
          setCurrentAudioUrl(parsed[0].url);
          setCurrentFilename(parsed[0].filename);
          setCurrentSnippet(parsed[0].textSnippet);
          setCurrentVoiceName(parsed[0].voice);
        }
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem("umair_tts_private_history");
    setHistory([]);
  };

  const handleCountryChange = (countryName: string, defaultVoice: string) => {
    setSelectedVoice(defaultVoice);
    if (COUNTRY_SAMPLE_TEXTS[countryName]) {
      setText(COUNTRY_SAMPLE_TEXTS[countryName]);
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
      setErrorMessage("Please enter text or script to synthesize.");
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
      setSuccessMessage("Speech synthesized successfully with Studio HD Human Engine!");

      // Save to private user history on this device only
      try {
        const newEntry = response.metadata;
        const currentSaved = localStorage.getItem("umair_tts_private_history");
        const list: AudioMetadata[] = currentSaved ? JSON.parse(currentSaved) : [];
        const updated = [newEntry, ...list.filter((item) => item.filename !== newEntry.filename)].slice(0, 50);
        localStorage.setItem("umair_tts_private_history", JSON.stringify(updated));
        setHistory(updated);
      } catch (e) {
        console.error("Could not save private history:", e);
      }
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

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/20 text-white">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Edge TTS Platform — UMAIR ASHIQ
              </h1>
              <p className="text-xs text-slate-400">
                Fast, studio-grade neural speech synthesis with unlimited script support and authentic human clarity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Fast Turbo • Unlimited Script</span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-medium">
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
        {/* Left Column: Country/Voice Selection & Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Step 1 & 2: Country & Real Human Voice Selection */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                isLoading={isLoadingVoices}
                onCountryChange={handleCountryChange}
              />
            </div>

            {/* Script Text Input Section */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="tts-text"
                  className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Speech Script / Text
                </label>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{text.length} characters</span>
                </div>
              </div>

              <textarea
                id="tts-text"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your script here (supports unlimited words, long stories, and articles without limit)..."
                className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-y font-sans leading-relaxed"
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
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-violet-600 hover:from-emerald-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Studio Human Speech (Fast Mode)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Studio Human Speech</span>
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
              onClearHistory={handleClearHistory}
              currentFilename={currentFilename}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
