import React, { useState, useEffect } from "react";
import { Plus, Edit2, Minus, Settings as SettingsIcon, Move } from "lucide-react";
import { ThemeConfig } from "../types/theme";

export interface MediaStateProps {
  is_available: boolean;
  title: string;
  artist: string;
  album_title: string;
  is_playing: boolean;
  thumbnail_base64: string | null;
}

interface CenterHubProps {
  media: MediaStateProps;
  isDeadzone: boolean;
  activeLabel?: string | null;
  radius?: number;
  theme: ThemeConfig;
  onAddSlice?: () => void;
  onEditSlice?: () => void;
  onDeleteSlice?: () => void;
  onOpenSettings?: () => void;
}

export const CenterHub: React.FC<CenterHubProps> = ({
  media,
  isDeadzone,
  activeLabel,
  radius = 66,
  theme,
  onAddSlice,
  onEditSlice,
  onDeleteSlice,
  onOpenSettings,
}) => {
  const isActionActive = !isDeadzone && !!activeLabel;

  // Real-time clock and date for the Cyberpunk HUD center
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setTimeStr(`${hh}:${mm}`);

      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const day = days[now.getDay()];
      const m = months[now.getMonth()];
      const d = String(now.getDate()).padStart(2, "0");
      setDateStr(`${day}., ${d} ${m}.`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCyberpunk = theme.id === "cyberpunk";

  return (
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden select-none transition-all duration-200 pointer-events-auto"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        backgroundColor: theme.hubBg,
        border: `1.5px solid ${theme.hubBorder}`,
        boxShadow: `
          inset 2px 2px 1px 0 rgba(255, 255, 255, 0.65),
          inset -1.5px -1.5px 1px 0 rgba(255, 255, 255, 0.25),
          inset 0 0 20px 2px rgba(255, 255, 255, 0.12),
          0 0 24px ${theme.hubGlow},
          0 10px 32px rgba(0, 0, 0, 0.55)
        `,
        backdropFilter: "blur(36px) saturate(190%) contrast(108%)",
        WebkitBackdropFilter: "blur(36px) saturate(190%) contrast(108%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background Album Art or Gradient Glow */}
      {media.thumbnail_base64 ? (
        <img
          src={media.thumbnail_base64}
          alt="Album Art"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen pointer-events-none"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-40 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${theme.hubGlow} 0%, transparent 75%)`,
          }}
        />
      )}

      {/* Cyberpunk HUD Glowing Arc Ring Gauge */}
      {isCyberpunk && !isActionActive && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none animate-spin-slow"
          viewBox="0 0 100 100"
          style={{ animationDuration: "20s" }}
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(181, 38, 255, 0.25)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#b526ff"
            strokeWidth="3"
            strokeDasharray="95 180"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px #b526ff)",
            }}
          />
        </svg>
      )}

      {/* Center Dynamic Label or Interactive In-Place Controls */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-1 w-full h-full">
        {isActionActive ? (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150 px-2">
            <span
              className="text-xs font-bold tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] px-1 leading-tight text-center uppercase"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "0.03em",
                color: theme.activeDotColor || "#ffffff",
                textShadow: `0 0 12px ${theme.activeSectorGlow}`,
              }}
            >
              {activeLabel}
            </span>
          </div>
        ) : isCyberpunk ? (
          /* Cyberpunk Reference HUD Display */
          <div className="flex flex-col items-center justify-center space-y-0.5 animate-in fade-in duration-150 w-full">
            <span className="text-base font-black tracking-tight text-white font-mono leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
              {timeStr || "17:23"}
            </span>
            <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-widest uppercase leading-none">
              {dateStr || "THU., 05 NOV."}
            </span>
            <span
              className="text-sm font-extrabold font-mono leading-none pt-0.5"
              style={{
                color: "#b526ff",
                textShadow: "0 0 10px rgba(181, 38, 255, 0.8)",
              }}
            >
              47%
            </span>

            {/* Quick in-place controls row */}
            <div className="flex items-center justify-center gap-1.5 pt-1 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSlice?.();
                }}
                className="w-4 h-4 rounded-full bg-cyan-500/30 hover:bg-cyan-500/60 border border-cyan-400 text-cyan-200 flex items-center justify-center transition-transform hover:scale-110"
                title="Edit Current Sector"
              >
                <Edit2 className="w-2 h-2" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings?.();
                }}
                className="w-4 h-4 rounded-full bg-purple-500/30 hover:bg-purple-500/60 border border-purple-400 text-purple-200 flex items-center justify-center transition-transform hover:scale-110"
                title="Settings & Appearance"
              >
                <SettingsIcon className="w-2 h-2" />
              </button>
            </div>
          </div>
        ) : isDeadzone ? (
          <div className="flex flex-col items-center justify-center space-y-1.5 animate-in fade-in duration-150 w-full">
            {/* Top Reticle / Anchor */}
            <div className="opacity-40 hover:opacity-100 transition-opacity cursor-grab">
              <Move className="w-3.5 h-3.5 text-white" />
            </div>

            {/* In-Place Hub Edit Micro-Buttons (Add, Edit, Delete) */}
            <div className="flex items-center justify-center gap-1.5 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSlice?.();
                }}
                className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-md transition-transform hover:scale-115 active:scale-95"
                title="Configure Sector / Action"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSlice?.();
                }}
                className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-md transition-transform hover:scale-115 active:scale-95"
                title="Edit Sector (Title, Action, Color)"
              >
                <Edit2 className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSlice?.();
                }}
                className="w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center shadow-md transition-transform hover:scale-115 active:scale-95"
                title="Reset Sector to Empty"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>

            {/* Quick Settings Icon */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings?.();
              }}
              className="text-neutral-400 hover:text-white transition-colors pt-0.5 z-20"
              title="Open Winee Settings"
            >
              <SettingsIcon className="w-3 h-3" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
