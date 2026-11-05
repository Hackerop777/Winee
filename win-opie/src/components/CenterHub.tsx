import React from "react";
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

  return (
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden select-none transition-all duration-200 pointer-events-auto"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        backgroundColor: theme.hubBg,
        border: `1px solid ${theme.hubBorder}`,
        boxShadow: `
          inset 2px 2px 1px 0 rgba(255, 255, 255, 0.65),
          inset -1.5px -1.5px 1px 0 rgba(255, 255, 255, 0.25),
          inset 0 0 18px 2px rgba(255, 255, 255, 0.12),
          0 0 20px ${theme.hubGlow},
          0 10px 32px rgba(0, 0, 0, 0.45)
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
          className="absolute inset-0 opacity-30 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${theme.activeSectorGlow} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Center Dynamic Label or Interactive In-Place Controls */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-1 w-full h-full">
        {isActionActive ? (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150">
            <span
              className="text-xs font-semibold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] px-1 leading-tight text-center"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "0.015em",
              }}
            >
              {activeLabel}
            </span>
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
                title="Add Slice / Sub-Menu"
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
                title="Edit Slice (Name, Thumbnail, Action)"
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
                title="Delete Selected Slice"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>

            {/* Bottom Gear: Preferences */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings?.();
              }}
              className="opacity-50 hover:opacity-100 transition-opacity p-0.5 hover:rotate-45 duration-300"
              title="Open Winee Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
