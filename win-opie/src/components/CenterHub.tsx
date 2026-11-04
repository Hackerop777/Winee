import React from "react";
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
}

export const CenterHub: React.FC<CenterHubProps> = ({
  media,
  isDeadzone,
  activeLabel,
  radius = 66,
  theme,
}) => {
  const isActionActive = !isDeadzone && !!activeLabel;

  return (
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden select-none transition-all duration-200"
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
    >
      {/* Background Album Art or Gradient Glow */}
      {media.thumbnail_base64 ? (
        <img
          src={media.thumbnail_base64}
          alt="Album Art"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${theme.activeSectorGlow} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Center Dynamic Label or Status */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 w-full">
        {isActionActive ? (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150">
            <span
              className="text-sm font-semibold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] px-1 leading-tight text-center"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "0.015em",
              }}
            >
              {activeLabel}
            </span>
          </div>
        ) : isDeadzone ? (
          <div className="flex flex-col items-center justify-center space-y-1 animate-in fade-in duration-150">
            {media.is_playing ? (
              <div className="flex flex-col items-center">
                <div className="flex items-end space-x-0.5 h-3 mb-1">
                  <span className="w-0.5 bg-white/90 rounded-full animate-bounce [animation-duration:600ms] h-2.5" />
                  <span className="w-0.5 bg-white/90 rounded-full animate-bounce [animation-duration:450ms] h-3" />
                  <span className="w-0.5 bg-white/90 rounded-full animate-bounce [animation-duration:750ms] h-2" />
                </div>
                <span className="text-[10px] font-semibold text-white/95 truncate max-w-[90px] leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {media.title}
                </span>
                <span className="text-[8px] text-white/60 truncate max-w-[80px]">
                  {media.artist}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <svg
                  className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-90 transition-transform duration-300 hover:rotate-45"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.activeIconColor}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.4" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeOpacity="0.8" />
                </svg>
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/70 mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                  Winee
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
