import React from "react";
import { LucideIcon } from "lucide-react";

export interface SliceData {
  id: number;
  label: string;
  icon: LucideIcon;
  color?: string;
}

interface SliceProps {
  slice: SliceData;
  index: number;
  totalSlices: number;
  isActive: boolean;
  innerRadius?: number;
  outerRadius?: number;
  onSelect?: (index: number) => void;
  onHover?: (index: number) => void;
}

export const Slice: React.FC<SliceProps> = ({
  slice,
  index,
  totalSlices,
  isActive,
  innerRadius = 40,
  outerRadius = 144,
  onSelect,
  onHover,
}) => {
  const wedgeAngle = (2 * Math.PI) / totalSlices;
  const midAngle = index * wedgeAngle;
  // Angular gap between slices for macOS-style physical separation
  const gapAngle = 0.035; // radians (~2 degrees)
  const startAngle = midAngle - wedgeAngle / 2 + gapAngle;
  const endAngle = midAngle + wedgeAngle / 2 - gapAngle;

  const x1 = innerRadius * Math.cos(startAngle);
  const y1 = innerRadius * Math.sin(startAngle);

  const x2 = outerRadius * Math.cos(startAngle);
  const y2 = outerRadius * Math.sin(startAngle);

  const x3 = outerRadius * Math.cos(endAngle);
  const y3 = outerRadius * Math.sin(endAngle);

  const x4 = innerRadius * Math.cos(endAngle);
  const y4 = innerRadius * Math.sin(endAngle);

  // SVG arc path
  const pathData = [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`,
    "Z",
  ].join(" ");

  // Centroid for icon and label
  const centroidRadius = (innerRadius + outerRadius) * 0.52;
  const cx = centroidRadius * Math.cos(midAngle);
  const cy = centroidRadius * Math.sin(midAngle);

  const IconComponent = slice.icon;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(index);
      }}
      onMouseEnter={() => onHover?.(index)}
      className="cursor-pointer transition-transform duration-150 ease-out origin-center pointer-events-auto"
      style={{
        transform: isActive ? "scale(1.07)" : "scale(1)",
        filter: isActive ? "drop-shadow(0 0 16px rgba(56, 189, 248, 0.45))" : "none",
      }}
    >
      {/* Slice Background Wedge */}
      <path
        d={pathData}
        fill={isActive ? "rgba(40, 44, 62, 0.92)" : "rgba(16, 16, 24, 0.78)"}
        stroke={isActive ? "rgba(147, 197, 253, 0.85)" : "rgba(255, 255, 255, 0.16)"}
        strokeWidth={isActive ? 1.5 : 1}
        className="backdrop-blur-md"
      />

      {/* Centered Icon & Label */}
      <foreignObject
        x={cx - 38}
        y={cy - 28}
        width={76}
        height={56}
        className="pointer-events-none"
      >
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <div
            className={`transition-colors duration-150 ${
              isActive ? "text-sky-300 scale-110" : "text-neutral-200"
            }`}
          >
            <IconComponent size={20} strokeWidth={2.2} />
          </div>
          <span
            className={`text-[10px] tracking-tight font-medium mt-1 truncate max-w-full px-1 ${
              isActive ? "text-white font-semibold" : "text-neutral-300"
            }`}
          >
            {slice.label}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};
