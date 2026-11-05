export type ThemeId = "cyberpunk" | "crystal" | "titanium" | "coral" | "graphite";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  glassBg: string;
  glassBorder: string;
  specularHighlight: string;
  hubBg: string;
  hubBorder: string;
  hubGlow: string;
  activeSectorGlow: string;
  activeIconColor: string;
  inactiveIconColor: string;
  radialDivider: string;
  dotColor: string;
  activeDotColor: string;
  bubbleBg: string;
  bubbleBorder: string;
  neonPalette: string[];
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk RGB Neon (Sci-Fi HUD)",
    glassBg: "rgba(10, 12, 20, 0.86)",
    glassBorder: "rgba(0, 229, 255, 0.45)",
    specularHighlight: "rgba(0, 229, 255, 0.90)",
    hubBg: "rgba(8, 10, 16, 0.95)",
    hubBorder: "rgba(181, 38, 255, 0.65)",
    hubGlow: "rgba(181, 38, 255, 0.40)",
    activeSectorGlow: "#ff2a85",
    activeIconColor: "#ffffff",
    inactiveIconColor: "rgba(255, 255, 255, 0.75)",
    radialDivider: "rgba(0, 229, 255, 0.20)",
    dotColor: "rgba(0, 229, 255, 0.50)",
    activeDotColor: "#ff2a85",
    bubbleBg: "rgba(12, 14, 24, 0.88)",
    bubbleBorder: "rgba(0, 229, 255, 0.55)",
    neonPalette: [
      "#00e5ff", // Neon Cyan
      "#00ff9d", // Neon Emerald
      "#ffd600", // Neon Gold
      "#7c4dff", // Neon Violet
      "#00b0ff", // Neon Sky Blue
      "#ff2a85", // Neon Magenta / Pink
      "#ff5722", // Neon Orange
      "#e040fb", // Neon Purple
    ],
  },
  crystal: {
    id: "crystal",
    name: "Apple Frosted Crystal (Pure Liquid Glass)",
    glassBg: "rgba(255, 255, 255, 0.08)",
    glassBorder: "rgba(255, 255, 255, 0.45)",
    specularHighlight: "rgba(255, 255, 255, 0.85)",
    hubBg: "rgba(20, 22, 28, 0.45)",
    hubBorder: "rgba(255, 255, 255, 0.45)",
    hubGlow: "rgba(255, 255, 255, 0.20)",
    activeSectorGlow: "rgba(255, 255, 255, 0.22)",
    activeIconColor: "#ffffff",
    inactiveIconColor: "rgba(255, 255, 255, 0.75)",
    radialDivider: "rgba(255, 255, 255, 0.16)",
    dotColor: "rgba(255, 255, 255, 0.35)",
    activeDotColor: "#ffffff",
    bubbleBg: "rgba(255, 255, 255, 0.12)",
    bubbleBorder: "rgba(255, 255, 255, 0.40)",
    neonPalette: [
      "#ffffff",
      "rgba(255, 255, 255, 0.9)",
      "rgba(255, 255, 255, 0.8)",
      "rgba(255, 255, 255, 0.7)",
      "rgba(255, 255, 255, 0.85)",
      "rgba(255, 255, 255, 0.95)",
      "rgba(255, 255, 255, 0.75)",
      "rgba(255, 255, 255, 0.8)",
    ],
  },
  titanium: {
    id: "titanium",
    name: "Dark Titanium Smoke (Obsidian Glass)",
    glassBg: "rgba(15, 17, 23, 0.35)",
    glassBorder: "rgba(255, 255, 255, 0.30)",
    specularHighlight: "rgba(255, 255, 255, 0.70)",
    hubBg: "rgba(10, 12, 16, 0.60)",
    hubBorder: "rgba(255, 255, 255, 0.35)",
    hubGlow: "rgba(255, 255, 255, 0.12)",
    activeSectorGlow: "rgba(255, 255, 255, 0.16)",
    activeIconColor: "#ffffff",
    inactiveIconColor: "rgba(255, 255, 255, 0.65)",
    radialDivider: "rgba(255, 255, 255, 0.12)",
    dotColor: "rgba(255, 255, 255, 0.30)",
    activeDotColor: "#ffffff",
    bubbleBg: "rgba(20, 22, 28, 0.40)",
    bubbleBorder: "rgba(255, 255, 255, 0.30)",
    neonPalette: [
      "#94a3b8",
      "#cbd5e1",
      "#e2e8f0",
      "#64748b",
      "#94a3b8",
      "#cbd5e1",
      "#f1f5f9",
      "#475569",
    ],
  },
  coral: {
    id: "coral",
    name: "Warm Sunset Frosted Glass",
    glassBg: "rgba(42, 20, 26, 0.28)",
    glassBorder: "rgba(255, 220, 210, 0.40)",
    specularHighlight: "rgba(255, 240, 230, 0.75)",
    hubBg: "rgba(28, 14, 18, 0.50)",
    hubBorder: "rgba(255, 255, 255, 0.40)",
    hubGlow: "rgba(255, 200, 180, 0.20)",
    activeSectorGlow: "rgba(255, 255, 255, 0.20)",
    activeIconColor: "#ffffff",
    inactiveIconColor: "rgba(255, 255, 255, 0.75)",
    radialDivider: "rgba(255, 255, 255, 0.16)",
    dotColor: "rgba(255, 255, 255, 0.35)",
    activeDotColor: "#ffffff",
    bubbleBg: "rgba(42, 20, 26, 0.35)",
    bubbleBorder: "rgba(255, 220, 210, 0.35)",
    neonPalette: [
      "#ff5722",
      "#ff7043",
      "#ff8a65",
      "#ffab91",
      "#ff9e80",
      "#ff6e40",
      "#ff3d00",
      "#d84315",
    ],
  },
  graphite: {
    id: "graphite",
    name: "Cool Frost Liquid Glass",
    glassBg: "rgba(16, 22, 34, 0.28)",
    glassBorder: "rgba(210, 235, 255, 0.40)",
    specularHighlight: "rgba(230, 245, 255, 0.75)",
    hubBg: "rgba(12, 16, 26, 0.50)",
    hubBorder: "rgba(255, 255, 255, 0.40)",
    hubGlow: "rgba(200, 230, 255, 0.20)",
    activeSectorGlow: "rgba(255, 255, 255, 0.20)",
    activeIconColor: "#ffffff",
    inactiveIconColor: "rgba(255, 255, 255, 0.75)",
    radialDivider: "rgba(255, 255, 255, 0.16)",
    dotColor: "rgba(255, 255, 255, 0.35)",
    activeDotColor: "#ffffff",
    bubbleBg: "rgba(16, 22, 34, 0.35)",
    bubbleBorder: "rgba(210, 235, 255, 0.35)",
    neonPalette: [
      "#00e5ff",
      "#38bdf8",
      "#7dd3fc",
      "#bae6fd",
      "#0284c7",
      "#0369a1",
      "#075985",
      "#0c4a6e",
    ],
  },
};
