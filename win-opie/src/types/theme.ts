export interface ThemeConfig {
  id: "coral" | "graphite";
  name: string;
  glassBg: string;
  glassBorder: string;
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
    name: "Warm Coral Glass (Reference Style)",
    glassBg: "rgba(54, 28, 34, 0.62)",
    glassBorder: "rgba(255, 210, 195, 0.28)",
    hubBorder: "rgba(251, 146, 60, 0.85)",
    hubGlow: "rgba(251, 146, 60, 0.45)",
    activeSectorGlow: "rgba(249, 115, 22, 0.35)",
    activeIconColor: "#fef08a",
    inactiveIconColor: "#ffffff",
    radialDivider: "rgba(255, 255, 255, 0.14)",
    dotColor: "rgba(255, 255, 255, 0.35)",
    activeDotColor: "#f59e0b",
    bubbleBg: "rgba(42, 20, 26, 0.85)",
    bubbleBorder: "rgba(251, 146, 60, 0.45)",
  },
  graphite: {
    id: "graphite",
    name: "Cool Graphite Glass (Windows 11 Fluent)",
    glassBg: "rgba(16, 22, 34, 0.68)",
    glassBorder: "rgba(186, 230, 253, 0.26)",
    hubBorder: "rgba(56, 189, 248, 0.85)",
    hubGlow: "rgba(56, 189, 248, 0.45)",
    activeSectorGlow: "rgba(14, 165, 233, 0.35)",
    activeIconColor: "#38bdf8",
    inactiveIconColor: "#ffffff",
    radialDivider: "rgba(255, 255, 255, 0.14)",
    dotColor: "rgba(255, 255, 255, 0.35)",
    activeDotColor: "#38bdf8",
    bubbleBg: "rgba(14, 18, 28, 0.85)",
    bubbleBorder: "rgba(56, 189, 248, 0.45)",
  },
};
