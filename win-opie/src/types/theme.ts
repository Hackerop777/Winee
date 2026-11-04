export type ThemeId = "crystal" | "titanium" | "coral" | "graphite";

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
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
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
  },
};
