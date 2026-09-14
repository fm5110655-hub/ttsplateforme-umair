import React from "react";
import { History, Play, Download, Clock, ShieldCheck, Trash2 } from "lucide-react";
import { AudioMetadata } from "../api/ttsApi";

interface HistoryListProps {
  history: AudioMetadata[];
  onSelectHistory: (item: AudioMetadata) => void;
  onClearHistory?: () => void;
  currentFilename?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  currentFilename
}) => {
  if (history.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-center text-slate-500">
        <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-medium text-slate-400">No Generations Yet</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Your generated audios are 100% private to your browser/device.
        </p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            My Private Generations ({history.length})
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Private to you</span>
          </span>
          {onClearHistory && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
              title="Clear my private history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {history.map((item) => {
          const isCurrent = currentFilename === item.filename;

          return (
            <div
              key={item.filename}
              onClick={() => onSelectHistory(item)}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                  : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                  &ldquo;{item.textSnippet}&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                  <span className="text-indigo-400 font-mono">{item.voice.split("-").slice(-1)[0]}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(item.createdAt)}
                  </span>
                  <span>•</span>
                  <span>{formatSize(item.sizeBytes)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                <button
                  type="button"
                  className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                  title="Play"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <a
                  href={item.url}
                  download={item.filename}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
