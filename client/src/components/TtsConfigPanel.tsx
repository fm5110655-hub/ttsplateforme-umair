import React from "react";
import { Sliders, RotateCcw } from "lucide-react";

interface TtsConfigPanelProps {
  rate: number;
  pitch: number;
  volume: number;
  onRateChange: (val: number) => void;
  onPitchChange: (val: number) => void;
  onVolumeChange: (val: number) => void;
  onReset: () => void;
}

export const TtsConfigPanel: React.FC<TtsConfigPanelProps> = ({
  rate,
  pitch,
  volume,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onReset
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Voice Customization
        </h4>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
          title="Reset sliders to defaults"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Speed / Rate */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Speed (Rate)</span>
            <span className="font-mono text-indigo-400 text-[11px]">
              {rate >= 0 ? `+${rate}%` : `${rate}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={rate}
            onChange={(e) => onRateChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>Slower (-50%)</span>
            <span>Default</span>
            <span>Faster (+100%)</span>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Pitch</span>
            <span className="font-mono text-indigo-400 text-[11px]">
              {pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={pitch}
            onChange={(e) => onPitchChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>Deeper (-50Hz)</span>
            <span>Default</span>
            <span>Higher (+50Hz)</span>
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Gain (Volume)</span>
            <span className="font-mono text-indigo-400 text-[11px]">
              {volume >= 0 ? `+${volume}%` : `${volume}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>Quieter (-50%)</span>
            <span>Default</span>
            <span>Louder (+50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
