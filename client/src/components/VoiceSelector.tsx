import React, { useState, useMemo, useEffect } from "react";
import {
  Globe,
  Mic,
  Sparkles,
  Search,
  Check,
  Award
} from "lucide-react";
import { Voice } from "../api/ttsApi";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelectVoice: (voiceShortName: string) => void;
  isLoading?: boolean;
  onCountryChange?: (countryName: string, defaultVoice: string) => void;
}

// Popular country quick-select presets with flags
const POPULAR_COUNTRIES = [
  { name: "Pakistan", flag: "🇵🇰", code: "ur-PK", samplePrompt: "السلام علیکم! مائیکروسافٹ ایج کی یہ آواز بالکل ایک حقیقی انسان کی طرح لگتی ہے۔" },
  { name: "United States", flag: "🇺🇸", code: "en-US", samplePrompt: "Hello! This voice sounds completely natural and realistic, just like a real person talking." },
  { name: "United Kingdom", flag: "🇬🇧", code: "en-GB", samplePrompt: "Good day! This British accent provides warm, human-grade speech synthesis." },
  { name: "India", flag: "🇮🇳", code: "hi-IN", samplePrompt: "नमस्ते! यह आवाज़ बहुत ही स्पष्ट और वास्तविक इंसान जैसी सुनाई देती है।" },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "ar-SA", samplePrompt: "أهلاً بك! هذا الصوت يبدو طبيعياً جداً كصوت بشري حقيقي." },
  { name: "United Arab Emirates", flag: "🇦🇪", code: "ar-AE", samplePrompt: "مرحباً بكم في منصة تحويل النص إلى صوت طبيعي بجودة عالية." },
  { name: "Canada", flag: "🇨🇦", code: "en-CA", samplePrompt: "Welcome! High fidelity Canadian English voice synthesis with studio clarity." },
  { name: "Australia", flag: "🇦🇺", code: "en-AU", samplePrompt: "G'day! Enjoy natural and conversational Australian neural speech." },
  { name: "Germany", flag: "🇩🇪", code: "de-DE", samplePrompt: "Hallo! Diese Stimme klingt vollkommen natürlich und lebendig." },
  { name: "France", flag: "🇫🇷", code: "fr-FR", samplePrompt: "Bonjour! Cette voix offre une intonation humaine et chaleureuse." },
  { name: "Türkiye", flag: "🇹🇷", code: "tr-TR", samplePrompt: "Merhaba! Bu ses tıpkı gerçek bir insan gibi doğal ve akıcıdır." }
];

// Flag emojis for known country codes or names
const COUNTRY_FLAGS: Record<string, string> = {
  Pakistan: "🇵🇰",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  India: "🇮🇳",
  "Saudi Arabia": "🇸🇦",
  "United Arab Emirates": "🇦🇪",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Germany: "🇩🇪",
  France: "🇫🇷",
  "Türkiye": "🇹🇷",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Brazil: "🇧🇷",
  Japan: "🇯🇵",
  Korea: "🇰🇷",
  China: "🇨🇳",
  Russia: "🇷🇺",
  Netherlands: "🇳🇱",
  Egypt: "🇪🇬",
  Indonesia: "🇮🇩",
  Bangladesh: "🇧🇩",
  Iran: "🇮🇷",
  Afghanistan: "🇦🇫",
  SouthAfrica: "🇿🇦",
  Mexico: "🇲🇽",
  Nigeria: "🇳🇬"
};

// Highest quality human-like voices (flagship neural models)
const HUMAN_REALISTIC_VOICES = new Set([
  // Pakistan
  "ur-PK-UzmaNeural",
  "ur-PK-AsadNeural",
  // US Flagship (Multilingual & Natural)
  "en-US-AvaMultilingualNeural",
  "en-US-AndrewMultilingualNeural",
  "en-US-EmmaMultilingualNeural",
  "en-US-BrianMultilingualNeural",
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "en-US-AriaNeural",
  // UK Flagship
  "en-GB-SoniaNeural",
  "en-GB-RyanNeural",
  "en-GB-LibbyNeural",
  // India
  "hi-IN-SwaraNeural",
  "hi-IN-MadhurNeural",
  "en-IN-NeerjaNeural",
  "en-IN-PrabhatNeural",
  // Arabic
  "ar-SA-ZariyahNeural",
  "ar-SA-HamedNeural",
  "ar-AE-FatimaNeural",
  "ar-AE-HamdanNeural",
  // France
  "fr-FR-DeniseNeural",
  "fr-FR-HenriNeural",
  // Germany
  "de-DE-KatjaNeural",
  "de-DE-KillianNeural"
]);

// Extract clean country name from LocaleName e.g. "English (United States)" -> "United States"
function getCountryFromLocale(localeName: string, localeCode: string): string {
  if (localeName) {
    const match = localeName.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      // If contains comma like "Latin, Azerbaijan" or "Mandarin, Simplified", take last part
      const parts = match[1].split(",").map((s) => s.trim());
      const candidate = parts[parts.length - 1];
      if (candidate && !candidate.toLowerCase().includes("traditional") && !candidate.toLowerCase().includes("simplified")) {
        return candidate;
      }
    }
  }

  // Fallback map based on region suffix in localeCode (e.g. "PK" -> "Pakistan")
  const region = localeCode.split("-")[1]?.toUpperCase();
  const regionMap: Record<string, string> = {
    PK: "Pakistan",
    US: "United States",
    GB: "United Kingdom",
    IN: "India",
    SA: "Saudi Arabia",
    AE: "United Arab Emirates",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    TR: "Türkiye",
    ES: "Spain",
    IT: "Italy",
    BR: "Brazil",
    JP: "Japan",
    KR: "Korea",
    CN: "China",
    RU: "Russia",
    NL: "Netherlands",
    EG: "Egypt",
    ID: "Indonesia",
    BD: "Bangladesh",
    IR: "Iran",
    AF: "Afghanistan",
    ZA: "South Africa"
  };

  if (region && regionMap[region]) {
    return regionMap[region];
  }

  return localeName || localeCode;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  isLoading = false,
  onCountryChange
}) => {
  // Selected Country filter (default to Pakistan or current voice's country)
  const [selectedCountry, setSelectedCountry] = useState<string>("Pakistan");
  const [countrySearch, setCountrySearch] = useState<string>("");
  const [voiceSearch, setVoiceSearch] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<"All" | "Female" | "Male">("All");

  // Build list of all available countries with voice counts and associated voices
  const countryList = useMemo(() => {
    const map = new Map<string, { name: string; count: number; locales: Set<string>; flag: string }>();

    voices.forEach((v) => {
      const country = getCountryFromLocale(v.LocaleName || "", v.Locale);
      if (!map.has(country)) {
        const flag = COUNTRY_FLAGS[country] || "🌐";
        map.set(country, { name: country, count: 0, locales: new Set(), flag });
      }
      const entry = map.get(country)!;
      entry.count += 1;
      entry.locales.add(v.Locale);
    });

    // Convert to sorted array
    return Array.from(map.values()).sort((a, b) => {
      // Prioritize Pakistan, US, UK, India at top of list
      const priorityOrder = ["Pakistan", "United States", "United Kingdom", "India", "Saudi Arabia", "United Arab Emirates"];
      const aIdx = priorityOrder.indexOf(a.name);
      const bIdx = priorityOrder.indexOf(b.name);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [voices]);

  const filteredCountryList = useMemo(() => {
    if (!countrySearch.trim()) return countryList;
    return countryList.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countryList, countrySearch]);

  // Synchronize country selection if current voice belongs to another country
  useEffect(() => {
    if (voices.length > 0 && selectedVoice) {
      const cur = voices.find((v) => v.ShortName === selectedVoice);
      if (cur) {
        const voiceCountry = getCountryFromLocale(cur.LocaleName || "", cur.Locale);
        if (voiceCountry && voiceCountry !== selectedCountry) {
          // If the user picked a voice outside the current country, adjust country
          setSelectedCountry(voiceCountry);
        }
      }
    }
  }, [selectedVoice, voices]);

  // Filtered voices strictly matching the SELECTED country ONLY!
  const countryVoices = useMemo(() => {
    return voices.filter((v) => {
      const country = getCountryFromLocale(v.LocaleName || "", v.Locale);
      return country.toLowerCase() === selectedCountry.toLowerCase();
    });
  }, [voices, selectedCountry]);

  // Sort country voices so Ultra-Realistic human voices appear FIRST
  const sortedCountryVoices = useMemo(() => {
    return [...countryVoices].sort((a, b) => {
      const aRealistic = HUMAN_REALISTIC_VOICES.has(a.ShortName) || a.ShortName.includes("Multilingual");
      const bRealistic = HUMAN_REALISTIC_VOICES.has(b.ShortName) || b.ShortName.includes("Multilingual");
      if (aRealistic && !bRealistic) return -1;
      if (!aRealistic && bRealistic) return 1;
      return a.FriendlyName.localeCompare(b.FriendlyName);
    });
  }, [countryVoices]);

  // Filter by gender and optional voice name search within selected country
  const displayedVoices = useMemo(() => {
    return sortedCountryVoices.filter((v) => {
      const matchesGender =
        genderFilter === "All" ? true : v.Gender.toLowerCase() === genderFilter.toLowerCase();
      const matchesSearch =
        voiceSearch.trim() === ""
          ? true
          : v.FriendlyName.toLowerCase().includes(voiceSearch.toLowerCase()) ||
            v.ShortName.toLowerCase().includes(voiceSearch.toLowerCase());
      return matchesGender && matchesSearch;
    });
  }, [sortedCountryVoices, genderFilter, voiceSearch]);

  // Handler when user picks a country
  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setVoiceSearch("");

    // Find all voices for this country
    const matching = voices.filter((v) => {
      const c = getCountryFromLocale(v.LocaleName || "", v.Locale);
      return c.toLowerCase() === countryName.toLowerCase();
    });

    if (matching.length > 0) {
      // Pick best realistic human voice as default
      const bestVoice =
        matching.find((v) => HUMAN_REALISTIC_VOICES.has(v.ShortName) || v.ShortName.includes("Multilingual")) ||
        matching[0];

      onSelectVoice(bestVoice.ShortName);

      if (onCountryChange) {
        onCountryChange(countryName, bestVoice.ShortName);
      }
    }
  };

  const currentVoiceObj = useMemo(() => {
    return voices.find((v) => v.ShortName === selectedVoice);
  }, [voices, selectedVoice]);

  const isCurrentRealistic = currentVoiceObj
    ? HUMAN_REALISTIC_VOICES.has(currentVoiceObj.ShortName) || currentVoiceObj.ShortName.includes("Multilingual")
    : false;

  const currentFlag = COUNTRY_FLAGS[selectedCountry] || "🌐";

  return (
    <div className="space-y-5">
      {/* ---------------- STEP 1: COUNTRY SELECTION ---------------- */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>1. Select Country (ملک منتخب کریں)</span>
          </label>
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span>{currentFlag}</span>
            <span>{selectedCountry}</span>
          </span>
        </div>

        {/* Quick Country Buttons with Flags */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_COUNTRIES.map((c) => {
            const isSelected = selectedCountry.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSelectCountry(c.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-105 border border-emerald-400/50"
                    : "bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
                }`}
              >
                <span className="text-sm">{c.flag}</span>
                <span>{c.name}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Country Search & Dropdown */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any country (e.g. Pakistan, Japan, Egypt, Germany)..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="relative sm:w-64">
            <select
              value={selectedCountry}
              onChange={(e) => handleSelectCountry(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none transition-colors"
            >
              {filteredCountryList.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900 py-1 text-slate-100">
                  {c.flag} {c.name} ({c.count} voices)
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
              ▼
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/60" />

      {/* ---------------- STEP 2: VOICE SELECTION (FILTERED TO SELECTED COUNTRY ONLY) ---------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span>2. Real Human Voices for {selectedCountry} ({countryVoices.length} available)</span>
          </label>

          {/* Quality Engine Badge */}
          <span className="text-[11px] font-medium text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Studio HD 96kbps • Real Human Engine</span>
          </span>
        </div>

        {/* Gender & Search within Country */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search voices in ${selectedCountry}...`}
              value={voiceSearch}
              onChange={(e) => setVoiceSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
            {(["All", "Female", "Male"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setGenderFilter(gender)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  genderFilter === gender
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Select Dropdown (Strictly Only Voices of this Country) */}
        <div className="relative">
          <select
            value={selectedVoice}
            onChange={(e) => onSelectVoice(e.target.value)}
            disabled={isLoading || displayedVoices.length === 0}
            className="w-full px-3.5 py-3 bg-slate-950 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-colors shadow-inner font-medium"
          >
            {isLoading && <option>Loading voices for {selectedCountry}...</option>}
            {displayedVoices.map((v) => {
              const isRealistic = HUMAN_REALISTIC_VOICES.has(v.ShortName) || v.ShortName.includes("Multilingual");
              const cleanName = v.FriendlyName.replace("Microsoft ", "").replace(" Online (Natural)", "");
              return (
                <option key={v.ShortName} value={v.ShortName} className="bg-slate-900 py-1.5">
                  {isRealistic ? "⭐ [Real Human Voice] " : "🎙️ "}
                  {cleanName} ({v.Gender})
                </option>
              );
            })}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
            ▼
          </div>
        </div>

        {/* Quick Voice Cards (Click to select instantly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {displayedVoices.map((v) => {
            const isSelected = selectedVoice === v.ShortName;
            const isRealistic = HUMAN_REALISTIC_VOICES.has(v.ShortName) || v.ShortName.includes("Multilingual");
            const voiceShortBase = v.ShortName.split("-").pop()?.replace("Neural", "") || v.ShortName;

            return (
              <button
                key={v.ShortName}
                type="button"
                onClick={() => onSelectVoice(v.ShortName)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/50"
                    : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {voiceShortBase}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {v.Gender}
                    </span>
                  </div>
                  {isRealistic && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5">
                      <Award className="w-2.5 h-2.5" />
                      Ultra-Realistic Human Voice
                    </span>
                  )}
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 hover:border-slate-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Voice Info Box */}
        {currentVoiceObj && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentFlag}</span>
              <div>
                <div className="font-semibold text-slate-200">
                  {currentVoiceObj.FriendlyName.replace("Microsoft ", "").replace(" Online (Natural)", "")}
                </div>
                <div className="text-[10px] text-slate-400">
                  Locale: <span className="font-mono text-indigo-400">{currentVoiceObj.Locale}</span> • Gender: {currentVoiceObj.Gender}
                </div>
              </div>
            </div>

            {isCurrentRealistic ? (
              <span className="text-[11px] font-medium text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                ⭐ Real Human Quality
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                Natural Neural
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
