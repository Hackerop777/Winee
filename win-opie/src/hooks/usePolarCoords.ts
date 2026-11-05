import { useState, useCallback, useRef } from "react";
import { sounds } from "../utils/sound";

export interface PolarState {
  r: number;
  theta: number;
  isDeadzone: boolean;
  activeSliceIndex: number | null;
}

const DEFAULT_DEADZONE_RADIUS = 64; // px (inner hub boundary)
const TIER1_OUTER_RADIUS = 168; // px (outer boundary of main radial disc)
const SLICE_COUNT = 8;
const WEDGE_ANGLE = (2 * Math.PI) / SLICE_COUNT;
const HYSTERESIS_ANGLE = 0.028; // ~1.6 degrees angular boundary deadband

export function usePolarCoords(customDeadzone = DEFAULT_DEADZONE_RADIUS) {
  const [polar, setPolar] = useState<PolarState>({
    r: 0,
    theta: 0,
    isDeadzone: true,
    activeSliceIndex: null,
  });

  const lastIndexRef = useRef<number | null>(null);

  const updateCoords = useCallback(
    (clientX: number, clientY: number, originX: number, originY: number, hasActiveSubmenu = false) => {
      const dx = clientX - originX;
      const dy = clientY - originY;
      const r = Math.sqrt(dx * dx + dy * dy);

      // Normalize angle to [0, 2PI]
      let theta = Math.atan2(dy, dx);
      if (theta < 0) {
        theta += 2 * Math.PI;
      }

      const isDeadzone = r < customDeadzone;
      let activeSliceIndex: number | null = null;

      if (!isDeadzone) {
        // When cursor is beyond the main disc into an expanded sub-menu (r > TIER1_OUTER_RADIUS),
        // keep the parent wedge strictly locked so the sub-menu does not close or switch
        // as the cursor navigates between wide sub-menu options!
        if (r > TIER1_OUTER_RADIUS && hasActiveSubmenu && lastIndexRef.current !== null) {
          activeSliceIndex = lastIndexRef.current;
        } else {
          // Inside root ring: compute raw sector index
          let computed = Math.floor((theta + WEDGE_ANGLE / 2) / WEDGE_ANGLE) % SLICE_COUNT;

          // Apply angular hysteresis if already tracking a slice to prevent boundary jitter
          if (lastIndexRef.current !== null) {
            const prevMid = lastIndexRef.current * WEDGE_ANGLE;
            let diff = theta - prevMid;
            // Wrap angular difference to [-PI, PI]
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;

            if (Math.abs(diff) < WEDGE_ANGLE / 2 + HYSTERESIS_ANGLE) {
              computed = lastIndexRef.current;
            }
          }

          activeSliceIndex = computed;
        }
      }

      if (activeSliceIndex !== lastIndexRef.current) {
        if (activeSliceIndex !== null) {
          sounds.play("ring-switch.wav", 0.45);
        }
        lastIndexRef.current = activeSliceIndex;
      }

      setPolar({
        r,
        theta,
        isDeadzone,
        activeSliceIndex,
      });
    },
    [customDeadzone]
  );

  const resetCoords = useCallback(() => {
    lastIndexRef.current = null;
    setPolar({
      r: 0,
      theta: 0,
      isDeadzone: true,
      activeSliceIndex: null,
    });
  }, []);

  return { polar, updateCoords, resetCoords };
}
