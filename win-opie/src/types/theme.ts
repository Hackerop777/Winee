export interface ThemeConfig {
  id: "coral" | "graphite";
  name: string;
  glassBg: string;
  glassBorder: string;
  specularHighlight: string;
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

export const THEMES: Record<"coral" | "graphite", ThemeConfig> = {
  coral: {
    id: "coral",
    name: "Warm Coral Liquid Glass (Reference Style)",
    glassBg: "rgba(50, 24, 30, 0.58)",
    glassBorder: "rgba(255, 215, 200, 0.32)",
    specularHighlight: "rgba(255, 240, 230, 0.45)",
    hubBorder: "rgba(251, 146, 60, 0.90)",
    hubGlow: "rgba(251, 146, 60, 0.55)",
    activeSectorGlow: "rgba(249, 115, 22, 0.40)",
    activeIconColor: "#fef08a",
    inactiveIconColor: "#ffffff",
    radialDivider: "rgba(255, 255, 255, 0.16)",
    dotColor: "rgba(255, 255, 255, 0.38)",
    activeDotColor: "#f59e0b",
    bubbleBg: "rgba(38, 18, 24, 0.82)",
    bubbleBorder: "rgba(251, 146, 60, 0.50)",
  },
  graphite: {
    id: "graphite",
    name: "Cool Graphite Liquid Glass (Windows 11 Fluent)",
    glassBg: "rgba(14, 20, 32, 0.64)",
    glassBorder: "rgba(186, 230, 253, 0.30)",
    specularHighlight: "rgba(224, 242, 254, 0.45)",
    hubBorder: "rgba(56, 189, 248, 0.90)",
    hubGlow: "rgba(56, 189, 248, 0.55)",
    activeSectorGlow: "rgba(14, 165, 233, 0.40)",
    activeIconColor: "#38bdf8",
    inactiveIconColor: "#ffffff",
    radialDivider: "rgba(255, 255, 255, 0.16)",
    dotColor: "rgba(255, 255, 255, 0.38)",
    activeDotColor: "#38bdf8",
    bubbleBg: "rgba(12, 16, 26, 0.82)",
    bubbleBorder: "rgba(56, 189, 248, 0.50)",
  },
};
