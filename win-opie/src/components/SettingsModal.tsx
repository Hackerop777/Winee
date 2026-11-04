import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Layers,
  Info,
  Volume2,
  VolumeX,
  Keyboard,
  RotateCcw,
  Check,
  Eye,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { RadialMenu } from "./RadialMenu";
import { THEMES, ThemeId } from "../types/theme";
import { ACTION_CATALOG, DEFAULT_WHEEL_SLOTS } from "../types/actions";

export type GlassMaterial = "liquid" | "frosted";

export interface SettingsConfig {
  shortcut: string;
  autostart: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  deadzoneRadius: number;
  outerRadius: number;
  stiffness: number;
  damping: number;
  glassBlur: number; // 0 to 100
  glassMaterial: GlassMaterial;
  themeId: ThemeId;
  customSlots: string[];
}

const DEFAULT_SETTINGS: SettingsConfig = {
  shortcut: "Ctrl+Space",
  autostart: false,
  soundEnabled: true,
  soundVolume: 60,
  deadzoneRadius: 64,
  outerRadius: 166,
  stiffness: 420,
  damping: 26,
  glassBlur: 36,
  glassMaterial: "liquid",
  themeId: "crystal",
  customSlots: DEFAULT_WHEEL_SLOTS,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: SettingsConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "physics" | "layout" | "about">("general");
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    try {
      const saved = localStorage.getItem("winee_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          glassBlur: parsed.glassBlur ?? parsed.blurStrength ?? DEFAULT_SETTINGS.glassBlur,
          customSlots:
            parsed.customSlots && Array.isArray(parsed.customSlots) && parsed.customSlots.length === 8
              ? parsed.customSlots
              : DEFAULT_WHEEL_SLOTS,
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const [sampleSliceIndex, setSampleSliceIndex] = useState<number | null>(0);

  useEffect(() => {
    invoke<boolean>("get_autostart")
      .then((enabled) => setSettings((s) => ({ ...s, autostart: enabled })))
      .catch(() => {});
  }, []);

  const handleUpdate = (partial: Partial<SettingsConfig>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    localStorage.setItem("winee_settings", JSON.stringify(next));
    onSettingsChange?.(next);

    if (partial.autostart !== undefined) {
      invoke("set_autostart", { enable: partial.autostart }).catch(console.error);
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1200);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem("winee_settings", JSON.stringify(DEFAULT_SETTINGS));
    onSettingsChange?.(DEFAULT_SETTINGS);
  };

  if (!isOpen) return null;

  const currentTheme = THEMES[settings.themeId || "crystal"] || THEMES.crystal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none p-4"
      onClick={onClose}
    >
      <div
        className="w-[740px] max-w-[95vw] h-[600px] max-h-[90vh] bg-[#12121a]/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-sm">
              W
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                WINEE Settings & Preferences
              </h2>
              <p className="text-xs text-neutral-400">Windows 11 Fluid Radial Action Utility</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-white/10 bg-black/20 p-3 space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "general"
                  ? "bg-sky-500/25 text-sky-300 border border-sky-400/30"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <Keyboard size={15} />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab("physics")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "physics"
                  ? "bg-sky-500/25 text-sky-300 border border-sky-400/30"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <Sparkles size={15} />
              <span>Liquid Glass & Motion</span>
            </button>
            <button
              onClick={() => setActiveTab("layout")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "layout"
                  ? "bg-sky-500/25 text-sky-300 border border-sky-400/30"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <Layers size={15} />
              <span>Wheel Layout</span>
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "about"
                  ? "bg-sky-500/25 text-sky-300 border border-sky-400/30"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <Info size={15} />
              <span>About & System</span>
            </button>
          </div>

          {/* Tab Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 text-sm">
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Primary Global Shortcut
                  </label>
                  <select
                    value={settings.shortcut}
                    onChange={(e) => handleUpdate({ shortcut: e.target.value })}
                    className="w-full bg-[#1e1e2a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="Ctrl+Space">Ctrl + Space (Recommended)</option>
                    <option value="Alt+O">Alt + O (Mnemonic: Opie/Winee)</option>
                    <option value="Ctrl+Alt+Space">Ctrl + Alt + Space</option>
                    <option value="MiddleButton">Middle Mouse Button / Scroll Click</option>
                  </select>
                  <p className="text-[11px] text-neutral-400">
                    All registered shortcuts run simultaneously across any Windows application.
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-xs text-neutral-200">
                      Launch on Windows Startup
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Automatically runs minimized in system tray on login
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autostart}
                    onChange={(e) => handleUpdate({ autostart: e.target.checked })}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-xs text-neutral-200">
                      Tactile Sound Effects
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Zero-latency Web Audio physical feedback cues
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdate({ soundEnabled: !settings.soundEnabled })}
                    className={`p-2 rounded-xl transition-colors ${
                      settings.soundEnabled
                        ? "bg-sky-500/20 text-sky-400 border border-sky-400/30"
                        : "bg-white/5 text-neutral-400"
                    }`}
                  >
                    {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>

                {settings.soundEnabled && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Sound Volume</span>
                      <span>{settings.soundVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={settings.soundVolume}
                      onChange={(e) => handleUpdate({ soundVolume: Number(e.target.value) })}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "physics" && (
              <div className="space-y-5">
                {/* Glass Material Mode Toggle: Liquid Glass vs Frosted Glass */}
                <div className="space-y-1.5 pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white tracking-wide">
                      Glass Optical Material
                    </label>
                    <span className="text-[10.5px] font-mono text-sky-400 uppercase tracking-wider">
                      {settings.glassMaterial === "liquid" ? "Liquid Glass" : "Frosted Glass"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleUpdate({ glassMaterial: "liquid" })}
                      className={`p-3 rounded-xl flex items-center space-x-2.5 text-left border transition-all ${
                        settings.glassMaterial === "liquid"
                          ? "bg-sky-500/20 border-sky-400 text-white shadow-xl shadow-sky-950/40"
                          : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-300 border border-sky-300/80 shadow-[0_0_10px_rgba(56,189,248,0.5)] flex items-center justify-center text-xs">
                        💧
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Liquid Glass</div>
                        <div className="text-[10px] text-neutral-400 leading-tight">
                          Fluid displacement ripples (#lg-dist) & specular lens
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleUpdate({ glassMaterial: "frosted" })}
                      className={`p-3 rounded-xl flex items-center space-x-2.5 text-left border transition-all ${
                        settings.glassMaterial === "frosted"
                          ? "bg-white/20 border-white text-white shadow-xl shadow-white/10"
                          : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-neutral-200 to-white border border-white/90 shadow-[0_0_10px_rgba(255,255,255,0.4)] flex items-center justify-center text-xs">
                        ❄️
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Frosted Glass</div>
                        <div className="text-[10px] text-neutral-400 leading-tight">
                          Velvet diffusion blur & radial elliptical rim
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Visual Glass Theme Selector */}
                <div className="space-y-1.5 pb-3 border-b border-white/10">
                  <label className="text-xs font-medium text-neutral-200">
                    Glass Color Tint
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleUpdate({ themeId: "crystal" })}
                      className={`p-3 rounded-xl flex items-center space-x-2.5 text-left border transition-all ${
                        settings.themeId === "crystal"
                          ? "bg-white/15 border-white text-white shadow-xl shadow-white/10"
                          : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-white/30 to-white/90 border border-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                      <div>
                        <div className="text-xs font-semibold">Apple Crystal Glass</div>
                        <div className="text-[10px] text-neutral-400">Pure Translucent Crystal</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleUpdate({ themeId: "titanium" })}
                      className={`p-3 rounded-xl flex items-center space-x-2.5 text-left border transition-all ${
                        settings.themeId === "titanium"
                          ? "bg-white/15 border-white text-white shadow-xl shadow-white/10"
                          : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-400 border border-neutral-300/60 shadow-sm" />
                      <div>
                        <div className="text-xs font-semibold">Dark Titanium Smoke</div>
                        <div className="text-[10px] text-neutral-400">Obsidian Smoked Quartz</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Apple Liquid Glass Blur Customization (0 to 100) */}
                <div className="space-y-2 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles size={15} className="text-amber-400" />
                      <span className="text-xs font-semibold text-white">
                        Apple Liquid Glass Blur: {settings.glassBlur}px
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-300">
                      {settings.glassBlur === 0
                        ? "Pure Crystal (0px)"
                        : settings.glassBlur <= 30
                        ? "Apple Liquid Glass (28px)"
                        : settings.glassBlur <= 65
                        ? "Medium Frost"
                        : "Deep Velvet Frost (100px)"}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.glassBlur}
                    onChange={(e) => handleUpdate({ glassBlur: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {/* Preset Quick Buttons */}
                  <div className="flex items-center space-x-2 pt-1 text-[10px]">
                    <span className="text-neutral-400">Presets:</span>
                    <button
                      onClick={() => handleUpdate({ glassBlur: 0 })}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                    >
                      Crystal (0)
                    </button>
                    <button
                      onClick={() => handleUpdate({ glassBlur: 28 })}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-amber-300 font-semibold transition-colors"
                    >
                      Apple Liquid (28)
                    </button>
                    <button
                      onClick={() => handleUpdate({ glassBlur: 55 })}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                    >
                      Medium (55)
                    </button>
                    <button
                      onClick={() => handleUpdate({ glassBlur: 100 })}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                    >
                      Deep Frost (100)
                    </button>
                  </div>
                </div>

                {/* Interactive Live Sample Wheel Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <Eye size={14} className="text-sky-400" />
                      <span>Live Liquid Glass Sample Preview (Interactive)</span>
                    </span>
                    <span className="text-[10.5px] text-neutral-400">
                      Hover over sectors to test real-time fluid bulge & glass
                    </span>
                  </div>

                  {/* Simulated Scenic Wallpaper Backdrop Container */}
                  <div
                    className="relative w-full h-[260px] rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center shadow-inner"
                    style={{
                      // Sunset landscape wallpaper gradient with rich contrast to show liquid glass refraction
                      background:
                        "linear-gradient(135deg, #2b1055 0%, #75225b 40%, #b83d47 70%, #d4633f 100%)",
                    }}
                  >
                    {/* Background Visual Elements (Mountains & Stars to verify true blur) */}
                    <div className="absolute inset-0 pointer-events-none opacity-60">
                      {/* Sun / Luminous orb behind glass */}
                      <div className="absolute left-[38%] top-[25%] w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 blur-[2px] opacity-80" />
                      {/* Mountain silhouettes */}
                      <svg
                        className="absolute bottom-0 w-full h-24 text-black/40 fill-current"
                        viewBox="0 0 500 150"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,150 L0,80 L120,20 L240,90 L360,10 L500,100 L500,150 Z" />
                      </svg>
                      {/* Grid / Text background lines to test optical distortion */}
                      <div className="absolute top-4 left-4 text-[10px] font-mono text-white/40 tracking-wider">
                        DESKTOP BACKGROUND // 60 FPS LIQUID BLUR TEST
                      </div>
                    </div>

                    {/* Interactive Sample Wheel Mounted over Wallpaper */}
                    <div className="relative w-[360px] h-[360px] flex items-center justify-center">
                      <RadialMenu
                        originX={180}
                        originY={180}
                        mode="default"
                        media={{
                          is_available: false,
                          title: "Sample Track",
                          artist: "Apple Liquid",
                          album_title: "",
                          is_playing: false,
                          thumbnail_base64: null,
                        }}
                        activeSliceIndex={sampleSliceIndex}
                        isDeadzone={false}
                        scale={0.68}
                        theme={currentTheme}
                        glassBlur={settings.glassBlur}
                        glassMaterial={settings.glassMaterial}
                        customSlots={settings.customSlots}
                        isMiniPreview={true}
                        onHoverSlice={(idx) => setSampleSliceIndex(idx)}
                      />
                    </div>
                  </div>
                </div>

                {/* Spring Physics Fine Tuning */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>Spring Stiffness</span>
                      <span className="font-mono text-sky-400">{settings.stiffness}</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="600"
                      step="10"
                      value={settings.stiffness}
                      onChange={(e) => handleUpdate({ stiffness: Number(e.target.value) })}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>Spring Damping</span>
                      <span className="font-mono text-sky-400">{settings.damping}</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="45"
                      step="1"
                      value={settings.damping}
                      onChange={(e) => handleUpdate({ damping: Number(e.target.value) })}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "layout" && (
              <div className="space-y-4">
                {/* Header & Presets */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div>
                    <div className="text-xs font-semibold text-white">Customize 8-Sector Radial Slices</div>
                    <div className="text-[11px] text-neutral-400">
                      Add the shortcuts you need, or disable unused slices
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px]">
                    <button
                      onClick={() => handleUpdate({ customSlots: DEFAULT_WHEEL_SLOTS })}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-sky-300 font-medium transition-colors"
                      title="Reset to default everyday shortcuts"
                    >
                      Default
                    </button>
                    <button
                      onClick={() =>
                        handleUpdate({
                          customSlots: [
                            "open_terminal",
                            "open_browser",
                            "open_explorer",
                            "screen_snip",
                            "clipboard",
                            "task_manager",
                            "lock_pc",
                            "settings",
                          ],
                        })
                      }
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-emerald-300 font-medium transition-colors"
                      title="Terminal, Browser, Explorer, Snip, Task Manager, Lock PC"
                    >
                      Dev / Power
                    </button>
                    <button
                      onClick={() =>
                        handleUpdate({
                          customSlots: [
                            "media_play_pause",
                            "media_next",
                            "media_prev",
                            "system_mute",
                            "screen_snip",
                            "none",
                            "none",
                            "settings",
                          ],
                        })
                      }
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-amber-300 font-medium transition-colors"
                      title="Play/Pause, Next, Prev, Mute, Snip, Settings"
                    >
                      Media Only
                    </button>
                  </div>
                </div>

                {/* 8 Sector Slots Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {settings.customSlots.map((actionId, slotIdx) => {
                    const currentAction = ACTION_CATALOG[actionId] || ACTION_CATALOG.none;
                    const IconComp = currentAction.icon;
                    const slotPositions = [
                      "Sector 1 (East / 0°)",
                      "Sector 2 (South-East / 45°)",
                      "Sector 3 (South / 90°)",
                      "Sector 4 (South-West / 135°)",
                      "Sector 5 (West / 180°)",
                      "Sector 6 (North-West / 225°)",
                      "Sector 7 (North / 270°)",
                      "Sector 8 (North-East / 315°)",
                    ];

                    return (
                      <div
                        key={slotIdx}
                        className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition-colors ${
                          actionId === "none"
                            ? "bg-white/[0.02] border-white/5 opacity-50"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                          <IconComp size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-neutral-400 font-mono leading-none mb-1">
                            {slotPositions[slotIdx]}
                          </div>
                          <select
                            value={actionId}
                            onChange={(e) => {
                              const next = [...settings.customSlots];
                              next[slotIdx] = e.target.value;
                              handleUpdate({ customSlots: next });
                            }}
                            className="w-full bg-[#181824] border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                          >
                            <optgroup label="System & Productivity">
                              <option value="screen_snip">Screen Snip</option>
                              <option value="clipboard">Clipboard History (Win+V)</option>
                              <option value="quick_note">Quick Notepad</option>
                              <option value="task_manager">Task Manager</option>
                              <option value="lock_pc">Lock Workstation (Win+L)</option>
                              <option value="settings">Winee Settings</option>
                            </optgroup>
                            <optgroup label="Apps & Tools">
                              <option value="open_terminal">Terminal / PowerShell</option>
                              <option value="open_browser">Web Browser</option>
                              <option value="open_explorer">File Explorer</option>
                            </optgroup>
                            <optgroup label="Media & Audio">
                              <option value="media_play_pause">Play / Pause</option>
                              <option value="media_next">Next Track</option>
                              <option value="media_prev">Previous Track</option>
                              <option value="system_mute">Mute Audio</option>
                            </optgroup>
                            <optgroup label="Remove / Disable">
                              <option value="none">(Disabled / Empty Sector)</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Information Card on Context-Aware File Actions */}
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/20 text-xs text-neutral-300 space-y-1">
                  <div className="font-semibold text-sky-300">Context-Aware Radial Wheels:</div>
                  <div className="text-[11px] text-neutral-400 leading-relaxed">
                    When you select images or media files in Windows Explorer, WINEE automatically switches to high-speed file conversion actions (PNG, JPG, WEBP, ICO, MP4, GIF, MP3, 720p). The custom slots configured above apply to your everyday desktop radial mode.
                  </div>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-300">
                  <div className="font-bold text-sm text-sky-200">WINEE v1.4.0</div>
                  <div className="text-[11px] text-sky-400/90 mt-0.5">
                    Independent Native Windows 11 Fluid Radial Action Utility
                  </div>
                </div>
                <div className="space-y-1 text-neutral-400">
                  <div>• Architecture: Tauri v2 (Rust Backend) + React 18 + Tailwind CSS</div>
                  <div>• Shell Integration: Direct Windows Shell COM selection discovery</div>
                  <div>• Glass Engine: Apple Liquid Glass with 0-100 customizable blur</div>
                  <div>• Storage Isolation: 100% strictly on D: drive during compilation</div>
                  <div>• Sound System: Offline Web Audio API low-latency oscillator synthesis</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/30">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw size={13} />
            <span>Restore Defaults</span>
          </button>
          <div className="flex items-center space-x-3">
            {savedNotice && (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 animate-pulse">
                <Check size={14} />
                <span>Saved</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shadow-md shadow-sky-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
