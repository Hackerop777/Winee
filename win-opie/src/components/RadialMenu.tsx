import React, { useMemo } from "react";
import {
  Play,
  Pause,
  Scissors,
  VolumeX,
  Volume2,
  Volume1,
  ClipboardList,
  Image as ImageIcon,
  FileType,
  Sparkles,
  Grid,
  FileCode,
  Copy,
  FolderOpen,
  Video,
  Film,
  Music,
  Minimize2,
  Palette,
  Power,
  AppWindow,
  Maximize,
  LucideIcon,
} from "lucide-react";
import { CenterHub, MediaStateProps } from "./CenterHub";
import { ContextBubbles, SubAction } from "./ContextBubbles";
import { ThemeConfig } from "../types/theme";
import { ACTION_CATALOG, DEFAULT_WHEEL_SLOTS } from "../types/actions";

export interface SliceItem {
  id: number;
  actionId?: string;
  label: string;
  icon: LucideIcon;
  subActions?: SubAction[];
}

interface RadialMenuProps {
  originX: number;
  originY: number;
  mode: string;
  files?: string[];
  media: MediaStateProps;
  activeSliceIndex: number | null;
  isDeadzone: boolean;
  scale: number;
  theme: ThemeConfig;
  glassBlur?: number;
  glassMaterial?: "liquid" | "frosted";
  customSlots?: string[];
  isMiniPreview?: boolean;
  onSelectSlice?: (index: number, actionId?: string) => void;
  onHoverSlice?: (index: number) => void;
  onCancel?: () => void;
  onThemeToggle?: () => void;
  onSubAction?: (actionId: string) => void;
}

const R_INNER = 66; // px (radius of center hub)
const R_OUTER = 166; // px (base radius of outer disc)
const BULGE_DELTA = 18; // px (fluid droplet expansion on active sector)
const SLICE_COUNT = 8;
const WEDGE_ANGLE = (2 * Math.PI) / SLICE_COUNT;

export const RadialMenu: React.FC<RadialMenuProps> = ({
  originX,
  originY,
  mode,
  files: _files,
  media,
  activeSliceIndex,
  isDeadzone,
  scale,
  theme,
  glassBlur = 36,
  glassMaterial = "liquid",
  customSlots = DEFAULT_WHEEL_SLOTS,
  isMiniPreview = false,
  onSelectSlice,
  onHoverSlice,
  onCancel,
  onThemeToggle,
  onSubAction,
}) => {
  // Slices configuration based on mode
  const slices: SliceItem[] = useMemo(() => {
    if (mode === "image") {
      return [
        {
          id: 0,
          label: "Convert to PNG",
          icon: FileType,
          subActions: [
            { id: "compress_png", label: "Compress", icon: Minimize2, onClick: () => onSubAction?.("compress") },
            { id: "copy_data", label: "Copy Data URL", icon: Copy, onClick: () => onSubAction?.("data_url") },
          ],
        },
        { id: 1, label: "Convert to JPG", icon: ImageIcon },
        { id: 2, label: "Convert to WEBP", icon: Sparkles },
        { id: 3, label: "Convert to ICO", icon: Grid },
        { id: 4, label: "Convert to BMP", icon: FileCode },
        { id: 5, label: "Copy Data URL", icon: Copy },
        { id: 6, label: "Reveal in Folder", icon: FolderOpen },
        {
          id: 7,
          label: "Screen Snip",
          icon: Scissors,
          subActions: [
            { id: "snip_window", label: "Window Snip", icon: AppWindow, onClick: () => onSubAction?.("snip_window") },
            { id: "snip_full", label: "Full Screen", icon: Maximize, onClick: () => onSubAction?.("snip_full") },
          ],
        },
      ];
    } else if (mode === "video" || mode === "audio") {
      return [
        { id: 0, label: "Convert to MP4", icon: Video },
        { id: 1, label: "Generate GIF", icon: Film },
        { id: 2, label: "Extract MP3", icon: Music },
        { id: 3, label: "Transcode 720p", icon: Minimize2 },
        { id: 4, label: "Strip Audio", icon: VolumeX },
        { id: 5, label: "Reveal in Folder", icon: FolderOpen },
        { id: 6, label: "Screen Snip", icon: Scissors },
        { id: 7, label: "Clipboard History", icon: ClipboardList },
      ];
    } else {
      // User-customized radial wheel actions (fallback to default catalog)
      const slots = customSlots && customSlots.length === 8 ? customSlots : DEFAULT_WHEEL_SLOTS;
      return slots.map((actionId, idx) => {
        const item = ACTION_CATALOG[actionId] || ACTION_CATALOG.none;
        let label = item.label;
        let icon = item.icon;
        let subActions: SubAction[] | undefined = undefined;

        if (actionId === "media_play_pause") {
          label = media.is_playing ? "Pause" : "Play";
          icon = media.is_playing ? Pause : Play;
          subActions = [
            { id: "vol_up", label: "Volume +", icon: Volume2, onClick: () => onSubAction?.("vol_up") },
            { id: "vol_down", label: "Volume -", icon: Volume1, onClick: () => onSubAction?.("vol_down") },
          ];
        } else if (actionId === "screen_snip") {
          subActions = [
            { id: "snip_window", label: "Window Snip", icon: AppWindow, onClick: () => onSubAction?.("snip_window") },
            { id: "snip_full", label: "Full Screen", icon: Maximize, onClick: () => onSubAction?.("snip_full") },
          ];
        } else if (actionId === "settings") {
          subActions = [
            { id: "theme_toggle", label: "Switch Theme", icon: Palette, onClick: () => onThemeToggle?.() },
            { id: "autostart", label: "Startup Toggle", icon: Power, onClick: () => onSubAction?.("autostart") },
          ];
        }

        return {
          id: idx,
          actionId,
          label,
          icon,
          subActions,
        };
      });
    }
  }, [mode, customSlots, media.is_playing, onSubAction, onThemeToggle]);

  // Compute organic fluid teardrop outer boundary path with C1 continuity
  const discPath = useMemo(() => {
    const totalSteps = 72;
    const points: [number, number][] = [];
    const active = isDeadzone ? null : activeSliceIndex;

    for (let s = 0; s < totalSteps; s++) {
      const phi = (s * 2 * Math.PI) / totalSteps;
      let r = R_OUTER;

      if (active !== null) {
        const thetaI = active * WEDGE_ANGLE;
        let diff = phi - thetaI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        if (Math.abs(diff) <= WEDGE_ANGLE / 2) {
          // Tangential C1-continuous organic bulge
          r += BULGE_DELTA * Math.pow(Math.cos(4 * diff), 2);
        }
      }

      const x = r * Math.cos(phi);
      const y = r * Math.sin(phi);
      points.push([x, y]);
    }

    return (
      `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} ` +
      points
        .slice(1)
        .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)
        .join(" ") +
      " Z"
    );
  }, [activeSliceIndex, isDeadzone]);

  // Active sector wedge path for highlighting
  const activeWedgePath = useMemo(() => {
    if (isDeadzone || activeSliceIndex === null) return null;
    const mid = activeSliceIndex * WEDGE_ANGLE;
    const start = mid - WEDGE_ANGLE / 2;
    const end = mid + WEDGE_ANGLE / 2;

    const steps = 18;
    const arcPoints: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const phi = start + (i * WEDGE_ANGLE) / steps;
      const diff = phi - mid;
      const r = R_OUTER + BULGE_DELTA * Math.pow(Math.cos(4 * diff), 2);
      arcPoints.push([r * Math.cos(phi), r * Math.sin(phi)]);
    }

    const xInnerEnd = R_INNER * Math.cos(end);
    const yInnerEnd = R_INNER * Math.sin(end);
    const xInnerStart = R_INNER * Math.cos(start);
    const yInnerStart = R_INNER * Math.sin(start);

    return [
      `M ${arcPoints[0][0].toFixed(2)} ${arcPoints[0][1].toFixed(2)}`,
      arcPoints.slice(1).map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" "),
      `L ${xInnerEnd.toFixed(2)} ${yInnerEnd.toFixed(2)}`,
      `A ${R_INNER} ${R_INNER} 0 0 0 ${xInnerStart.toFixed(2)} ${yInnerStart.toFixed(2)}`,
      "Z",
    ].join(" ");
  }, [activeSliceIndex, isDeadzone]);

  const activeSlice =
    !isDeadzone && activeSliceIndex !== null && slices[activeSliceIndex]
      ? slices[activeSliceIndex]
      : null;

  const activeLabel =
    activeSlice && activeSlice.actionId !== "none"
      ? activeSlice.label
      : null;

  const activeSubActions =
    activeSlice && activeSlice.actionId !== "none"
      ? activeSlice.subActions || []
      : [];

  const activeSectorAngle =
    activeSliceIndex !== null ? activeSliceIndex * WEDGE_ANGLE : 0;

  const size = 480; // Bounding viewport
  const half = size / 2;

  return (
    <div
      className="absolute select-none pointer-events-auto will-change-transform"
      style={{
        left: `${originX}px`,
        top: `${originY}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        // Pure high-fps spring execution without competing CSS transition:
        transformOrigin: "center center",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Dynamic Glass Backing Architecture (Liquid Glass vs Frosted Glass) */}
      {glassMaterial === "liquid" ? (
        /* ========== LIQUID GLASS LAYERS (Displacement Wave Lens & Specular) ========== */
        <div
          className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
          style={{
            width: `${(R_OUTER + BULGE_DELTA + 2) * 2}px`,
            height: `${(R_OUTER + BULGE_DELTA + 2) * 2}px`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backdropFilter: `blur(${Math.min(glassBlur, 8)}px)`,
            WebkitBackdropFilter: `blur(${Math.min(glassBlur, 8)}px)`,
            filter: "url(#lg-dist)",
            isolation: "isolate",
            background: theme.glassBg,
            boxShadow: `
              inset 2px 2px 1px 0 rgba(255, 255, 255, 0.85),
              inset -1.5px -1.5px 1px 0 rgba(255, 255, 255, 0.35),
              inset 0 0 8px rgba(255, 255, 255, 0.65),
              0 6px 6px rgba(0, 0, 0, 0.2),
              0 0 24px rgba(0, 0, 0, 0.35)
            `,
            border: `1px solid ${theme.glassBorder}`,
          }}
        />
      ) : (
        /* ========== FROSTED GLASS LAYERS (Velvet Diffusion & Radial Ellipse Rim) ========== */
        <div
          className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
          style={{
            width: `${(R_OUTER + BULGE_DELTA + 2) * 2}px`,
            height: `${(R_OUTER + BULGE_DELTA + 2) * 2}px`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backdropFilter: `blur(${glassBlur || 32}px) saturate(180%) contrast(105%)`,
            WebkitBackdropFilter: `blur(${glassBlur || 32}px) saturate(180%) contrast(105%)`,
            background: theme.glassBg,
            boxShadow: `
              0 0 5px 1.5px #ffffff inset,
              0 0 20px rgba(255, 255, 255, 0.5) inset,
              0 24px 64px rgba(0, 0, 0, 0.55),
              0 4px 12px rgba(0, 0, 0, 0.25)
            `,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          {/* Top Elliptical Frosted Sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.45) 0%, rgba(238, 238, 238, 0) 70%)",
              height: "55%",
            }}
          />
          {/* Bottom Elliptical Frosted Sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center bottom, rgba(255, 255, 255, 0.3) 0%, rgba(238, 238, 238, 0) 70%)",
              top: "45%",
              height: "55%",
            }}
          />
        </div>
      )}

      <svg
        width={size}
        height={size}
        viewBox={`-${half} -${half} ${size} ${size}`}
        className="relative z-10 overflow-visible"
        style={{
          filter: "drop-shadow(0 16px 40px rgba(0, 0, 0, 0.45))",
        }}
      >
        <defs>
          {/* Liquid Glass Displacement Wave Filter from User Specification */}
          <filter id="lg-dist" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.008"
              numOctaves={2}
              seed={92}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation={2} result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale={45}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Directional 3D Specular Reflection Rim Gradient */}
          <linearGradient id="specularRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.40" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>

          {/* Translucent Pure Glass Sheen Gradient */}
          <linearGradient id="glassSheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.01" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>

          {/* Subtle Radial Glow for Active Sector */}
          {activeSliceIndex !== null && (
            <radialGradient
              id="activeSectorGlowGrad"
              cx={Math.cos(activeSliceIndex * WEDGE_ANGLE) * 120}
              cy={Math.sin(activeSliceIndex * WEDGE_ANGLE) * 120}
              r="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={theme.activeSectorGlow} stopOpacity="1" />
              <stop offset="65%" stopColor={theme.activeSectorGlow} stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          )}

          {/* Center Hub Ambient Radial Halo */}
          <radialGradient id="hubHalo" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="60%" stopColor={theme.hubGlow} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 2. Single Continuous Translucent Glass Disc Surface with Pure Glass Sheen */}
        <path
          d={discPath}
          fill="url(#glassSheenGrad)"
          stroke="url(#specularRim)"
          strokeWidth="1.5"
          style={{
            transition: "d 180ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Inner Glass Lens Bevel Ring */}
        <circle
          cx="0"
          cy="0"
          r={R_INNER}
          fill="none"
          stroke="url(#specularRim)"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* 3. Active Sector Highlight Layer with Fluid Droplet Expansion */}
        {activeWedgePath && (
          <path
            d={activeWedgePath}
            fill="url(#activeSectorGlowGrad)"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.0"
            className="animate-in fade-in duration-100"
          />
        )}

        {/* 3. Hairline Radial Separators between Sectors */}
        {Array.from({ length: SLICE_COUNT }).map((_, idx) => {
          const boundaryAngle = idx * WEDGE_ANGLE + WEDGE_ANGLE / 2;
          const x1 = R_INNER * Math.cos(boundaryAngle);
          const y1 = R_INNER * Math.sin(boundaryAngle);
          const x2 = R_OUTER * Math.cos(boundaryAngle);
          const y2 = R_OUTER * Math.sin(boundaryAngle);

          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.radialDivider}
              strokeWidth="1"
              strokeDasharray="2 3"
              strokeOpacity="0.65"
            />
          );
        })}

        {/* 4. Sector Icons & Delicate Dot Indicators */}
        {slices.map((slice, idx) => {
          const midAngle = idx * WEDGE_ANGLE;
          const isActive = !isDeadzone && activeSliceIndex === idx;

          // Icon placement radius
          const rIcon = (R_INNER + R_OUTER) * 0.52;
          const ix = rIcon * Math.cos(midAngle);
          const iy = rIcon * Math.sin(midAngle);

          // Dot indicator placement radius (subtle dot below icon like reference)
          const rDot = R_OUTER - 18;
          const dotX = rDot * Math.cos(midAngle);
          const dotY = rDot * Math.sin(midAngle);

          const IconComponent = slice.icon;
          const isNone = slice.actionId === "none";

          return (
            <g
              key={slice.id}
              onClick={() => !isNone && onSelectSlice?.(idx, slice.actionId)}
              onMouseEnter={() => !isNone && onHoverSlice?.(idx)}
              className={isNone ? "pointer-events-none opacity-20" : "cursor-pointer group"}
            >
              {/* Sector Hitbox */}
              {!isNone && (
                <circle
                  cx={ix}
                  cy={iy}
                  r="38"
                  fill="transparent"
                  className="pointer-events-auto"
                />
              )}

              {/* Centered Vector Icon */}
              {!isNone && (
                <foreignObject
                  x={ix - 18}
                  y={iy - 18}
                  width={36}
                  height={36}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      className="transition-all duration-200"
                      style={{
                        transform: isActive ? "scale(1.15)" : "scale(1.0)",
                        color: isActive ? theme.activeIconColor : theme.inactiveIconColor,
                        filter: isActive
                          ? "drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)) drop-shadow(0 2px 6px rgba(0,0,0,0.85))"
                          : "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
                      }}
                    >
                      <IconComponent size={22} />
                    </div>
                  </div>
                </foreignObject>
              )}

              {/* Indicator Dot */}
              <circle
                cx={dotX}
                cy={dotY}
                r={isNone ? 1.5 : isActive ? 3.0 : 2.0}
                fill={isActive ? theme.activeDotColor : theme.dotColor}
                fillOpacity={isNone ? 0.25 : 1}
                style={{
                  transition: "all 180ms ease-out",
                  filter: isActive && !isNone ? "drop-shadow(0 0 6px #ffffff)" : "none",
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* 5. Center Hub: Large Luminous Ring with Prominent Action Label */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-20"
        onClick={(e) => {
          e.stopPropagation();
          onCancel?.();
        }}
        title="Click or release to cancel"
      >
        <CenterHub
          media={media}
          isDeadzone={isDeadzone}
          activeLabel={activeLabel}
          radius={R_INNER}
          theme={theme}
        />
      </div>

      {/* 6. Contextual Floating Action Bubbles (Sub-actions) */}
      {!isMiniPreview && (
        <ContextBubbles
          subActions={activeSubActions}
          sectorAngle={activeSectorAngle}
          baseRadius={R_OUTER + 50}
          theme={theme}
          visible={!isDeadzone && activeSubActions.length > 0}
        />
      )}
    </div>
  );
};
