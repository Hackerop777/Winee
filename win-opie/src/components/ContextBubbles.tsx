import React from "react";
import { LucideIcon } from "lucide-react";
import { ThemeConfig } from "../types/theme";

export interface SubAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface ContextBubblesProps {
  subActions: SubAction[];
  sectorAngle: number; // in radians
  baseRadius: number; // typically outerRadius + 50
  theme: ThemeConfig;
  visible: boolean;
}

export const ContextBubbles: React.FC<ContextBubblesProps> = ({
  subActions,
  sectorAngle,
  baseRadius,
  theme,
  visible,
}) => {
  if (!visible || subActions.length === 0) return null;

  const count = subActions.length;
  // Angular spread between sub-action bubbles
  const angularSpread = 0.32; // radians (~18 degrees)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {subActions.map((action, idx) => {
        // Calculate offset angle relative to sector center
        const offset = (idx - (count - 1) / 2) * angularSpread;
        const angle = sectorAngle + offset;
        const x = Math.cos(angle) * baseRadius;
        const y = Math.sin(angle) * baseRadius;

        return (
          <div
            key={action.id}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer"
            style={{
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out",
            }}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-xl"
              style={{
                backgroundColor: theme.bubbleBg,
                border: `1px solid ${theme.bubbleBorder}`,
                boxShadow: `
                  inset 1.5px 1.5px 1px 0 rgba(255, 255, 255, 0.65),
                  inset -1px -1px 1px 0 rgba(255, 255, 255, 0.25),
                  inset 0 0 10px 1px rgba(255, 255, 255, 0.10),
                  0 8px 24px rgba(0, 0, 0, 0.45)
                `,
                backdropFilter: "blur(28px) saturate(180%) contrast(108%)",
                WebkitBackdropFilter: "blur(28px) saturate(180%) contrast(108%)",
              }}
              title={action.label}
            >
              <action.icon
                size={18}
                className="text-white group-hover:scale-110 transition-all drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
              />
            </div>
            {/* Tooltip Label */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-semibold text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-md border border-white/10">
              {action.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
