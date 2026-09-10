import React, { useState, useMemo } from "react";
import { Search, Globe, Mic } from "lucide-react";
import { Voice } from "../api/ttsApi";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelectVoice: (voiceShortName: string) => void;
  isLoading?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"All" | "Female" | "Male">("All");

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const matchesSearch =
        v.FriendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.ShortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.Locale.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender =
        genderFilter === "All" ? true : v.Gender.toLowerCase() === genderFilter.toLowerCase();

      return matchesSearch && matchesGender;
    });
  }, [voices, searchTerm, genderFilter]);

  const currentVoiceObj = useMemo(() => {
    return voices.find((v) => v.ShortName === selectedVoice);
  }, [voices, selectedVoice]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-indigo-400" />
          Neural Voice Selection
        </label>
        {currentVoiceObj && (
          <span className="text-xs text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/30">
            {currentVoiceObj.Gender} • {currentVoiceObj.Locale}
          </span>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search language or voice (e.g. English, Urdu, Aria)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
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

      {/* Voice Select Menu */}
      <div className="relative">
        <select
          value={selectedVoice}
          onChange={(e) => onSelectVoice(e.target.value)}
          disabled={isLoading || voices.length === 0}
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-colors"
        >
          {isLoading && <option>Loading available voices...</option>}
          {filteredVoices.map((v) => (
            <option key={v.ShortName} value={v.ShortName} className="bg-slate-900 py-1">
              {v.FriendlyName} ({v.Locale})
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
          ▼
        </div>
      </div>

      {/* Popular Quick-Select Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Globe className="w-3 h-3" /> Quick select:
        </span>
        {[
          { label: "US Aria", name: "en-US-AriaNeural" },
          { label: "US Guy", name: "en-US-GuyNeural" },
          { label: "UK Sonia", name: "en-GB-SoniaNeural" },
          { label: "Urdu Gul", name: "ur-PK-GulNeural" },
          { label: "Urdu Asad", name: "ur-PK-AsadNeural" },
          { label: "Hindi Swara", name: "hi-IN-SwaraNeural" },
          { label: "French Denise", name: "fr-FR-DeniseNeural" },
          { label: "Spanish Elvira", name: "es-ES-ElviraNeural" },
          { label: "Arabic Salma", name: "ar-EG-SalmaNeural" }
        ].map((chip) => (
          <button
            key={chip.name}
            type="button"
            onClick={() => onSelectVoice(chip.name)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              selectedVoice === chip.name
                ? "bg-indigo-600 border-indigo-500 text-white font-medium"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
