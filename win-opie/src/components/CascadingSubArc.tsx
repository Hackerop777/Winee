import React from "react";
import { ActionNode, getNodeIcon } from "../types/actions";
import { ThemeConfig } from "../types/theme";

interface CascadingSubArcProps {
  parentMidAngle: number;
  items: ActionNode[];
  innerRadius: number;
  outerRadius: number;
  activeChildIndex: number | null;
  theme: ThemeConfig;
  tier: 2 | 3;
  onSelectChild?: (index: number, node: ActionNode) => void;
  onHoverChild?: (index: number) => void;
}

export function createAnnularSectorPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + rOut * Math.cos(startAngle);
  const y1 = cy + rOut * Math.sin(startAngle);
  const x2 = cx + rOut * Math.cos(endAngle);
  const y2 = cy + rOut * Math.sin(endAngle);
  const x3 = cx + rIn * Math.cos(endAngle);
  const y3 = cy + rIn * Math.sin(endAngle);
  const x4 = cx + rIn * Math.cos(startAngle);
  const y4 = cy + rIn * Math.sin(startAngle);

  const angleDiff = endAngle - startAngle;
  const largeArcFlag = Math.abs(angleDiff) > Math.PI ? 1 : 0;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

export const CascadingSubArc: React.FC<CascadingSubArcProps> = ({
  parentMidAngle,
  items,
  innerRadius,
  outerRadius,
  activeChildIndex,
  theme,
  tier: _tier,
  onSelectChild,
  onHoverChild,
}) => {
  if (!items || items.length === 0) return null;

  const count = items.length;
  // Arc width per child ~28deg, capped so total span doesn't exceed 150deg
  const anglePerItem = Math.min((30 * Math.PI) / 180, (150 * Math.PI) / (180 * Math.max(1, count)));
  const totalSpan = count * anglePerItem;
  const startAngle = parentMidAngle - totalSpan / 2;

  const rMid = (innerRadius + outerRadius) * 0.5;

  return (
    <g className="animate-in fade-in zoom-in-95 duration-200">
      {items.map((child, idx) => {
        const a1 = startAngle + idx * anglePerItem + 0.018; // fine gap separator
        const a2 = startAngle + (idx + 1) * anglePerItem - 0.018;
        const aMid = (a1 + a2) / 2;

        const isActive = activeChildIndex === idx;
        const hasSubmenu = (child.children && child.children.length > 0) || child.type === "submenu";

        const wedgePath = createAnnularSectorPath(0, 0, innerRadius, outerRadius, a1, a2);

        // Position for icon/thumbnail and label
        const ix = rMid * Math.cos(aMid);
        const iy = rMid * Math.sin(aMid);

        // Arrow indicator position near outer edge
        const arrowR = outerRadius - 10;
        const arrowX = arrowR * Math.cos(aMid);
        const arrowY = arrowR * Math.sin(aMid);
        const arrowDeg = (aMid * 180) / Math.PI;

        const IconComponent = getNodeIcon(child.iconName, child.type);

        return (
          <g
            key={child.id || idx}
            onClick={(e) => {
              e.stopPropagation();
              onSelectChild?.(idx, child);
            }}
            onMouseEnter={() => onHoverChild?.(idx)}
            className="cursor-pointer group"
          >
            {/* Sector Glass Fill */}
            <path
              d={wedgePath}
              fill={isActive ? theme.activeSectorGlow : theme.glassBg}
              stroke={isActive ? "rgba(255, 255, 255, 0.85)" : theme.glassBorder}
              strokeWidth={isActive ? 1.5 : 1}
              style={{
                filter: isActive
                  ? `drop-shadow(0 0 16px ${theme.activeSectorGlow}) drop-shadow(0 4px 12px rgba(0,0,0,0.5))`
                  : "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
                transition: "fill 150ms ease-out, stroke 150ms ease-out",
              }}
            />

            {/* If Image Thumbnail exists (Clipboard Image Card) */}
            {child.thumbnailUrl ? (
              <foreignObject
                x={ix - 18}
                y={iy - 24}
                width={36}
                height={36}
                className="pointer-events-none rounded-lg overflow-hidden border border-white/30 shadow-md"
              >
                <img
                  src={child.thumbnailUrl}
                  alt={child.label}
                  className="w-full h-full object-cover"
                />
              </foreignObject>
            ) : (
              /* Vector Icon */
              <foreignObject
                x={ix - 14}
                y={iy - 20}
                width={28}
                height={28}
                className="pointer-events-none"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="transition-transform duration-150"
                    style={{
                      transform: isActive ? "scale(1.15)" : "scale(1.0)",
                      color: isActive ? theme.activeIconColor : theme.inactiveIconColor,
                      filter: isActive
                        ? "drop-shadow(0 0 10px rgba(255,255,255,0.8))"
                        : "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                </div>
              </foreignObject>
            )}

            {/* Text Label */}
            <text
              x={ix}
              y={iy + 15}
              textAnchor="middle"
              className="text-[10px] font-semibold tracking-wide pointer-events-none select-none"
              fill={isActive ? "#ffffff" : "rgba(255, 255, 255, 0.85)"}
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              {child.label.length > 12 ? `${child.label.slice(0, 10)}...` : child.label}
            </text>

            {/* Sub-menu Outward Expansion Arrow (▶) */}
            {hasSubmenu && (
              <g
                transform={`translate(${arrowX}, ${arrowY}) rotate(${arrowDeg})`}
                className="pointer-events-none opacity-80 group-hover:opacity-100"
              >
                <polygon
                  points="-4,-4 5,0 -4,4"
                  fill={isActive ? theme.activeIconColor : "#ffffff"}
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
