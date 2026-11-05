import React, { useEffect, useState, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { RadialMenu } from "./components/RadialMenu";
import { MediaStateProps } from "./components/CenterHub";
import { SettingsModal, SettingsConfig } from "./components/SettingsModal";
import { usePolarCoords } from "./hooks/usePolarCoords";
import { useSpringValue } from "./hooks/useSpringPhysics";
import { sounds } from "./utils/sound";
import { THEMES } from "./types/theme";
import { DEFAULT_WHEEL_SLOTS, ActionNode, DEFAULT_ACTION_TREE } from "./types/actions";
import { SliceEditorModal } from "./components/SliceEditorModal";

interface ShowPayload {
  origin_x: number;
  origin_y: number;
  monitor_left?: number;
  monitor_top?: number;
  monitor_width?: number;
  monitor_height?: number;
  mode: string;
  files: string[];
  media: MediaStateProps;
}

export const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<string>("default");
  const [files, setFiles] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaStateProps>({
    is_available: false,
    title: "Idle",
    artist: "WINEE",
    album_title: "",
    is_playing: false,
    thumbnail_base64: null,
  });

  const [settings, setSettings] = useState<SettingsConfig>(() => {
    try {
      const saved = localStorage.getItem("winee_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old themes to crystal if previously saved as coral
        if (parsed.themeId === "coral" || parsed.themeId === "graphite") {
          parsed.themeId = "crystal";
        }
        if (!parsed.glassMaterial) {
          parsed.glassMaterial = "liquid";
        }
        if (!parsed.customSlots || !Array.isArray(parsed.customSlots) || parsed.customSlots.length !== 8) {
          parsed.customSlots = DEFAULT_WHEEL_SLOTS;
        }
        return parsed;
      }
      return {
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
    } catch {
      return {
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
    }
  });

  // Action tree supporting multi-tier cascading radial sub-menus
  const [actionTree, setActionTree] = useState<ActionNode[]>(() => {
    try {
      const stored = localStorage.getItem("winee_action_tree");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_ACTION_TREE;
  });

  const [activeTier2Index, setActiveTier2Index] = useState<number | null>(null);
  const activeTier2Ref = useRef<number | null>(null);
  activeTier2Ref.current = activeTier2Index;

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<{ node: ActionNode; parentIndex: number; childIndex?: number } | null>(null);

  const actionTreeRef = useRef<ActionNode[]>(actionTree);
  actionTreeRef.current = actionTree;

  const handleSaveActionTree = useCallback((newTree: ActionNode[]) => {
    setActionTree(newTree);
    localStorage.setItem("winee_action_tree", JSON.stringify(newTree));
  }, []);

  const currentTheme = THEMES[settings.themeId || "crystal"] || THEMES.crystal;

  // Synchronize OS-level registered hotkey with user settings
  useEffect(() => {
    if (settings.shortcut) {
      invoke("set_shortcut_preference", { shortcut: settings.shortcut }).catch(console.error);
    }
  }, [settings.shortcut]);

  // Polar coordinate tracking with custom deadzone
  const { polar, updateCoords, resetCoords } = usePolarCoords(settings.deadzoneRadius || 64);
  const activeSliceRef = useRef<number | null>(null);
  activeSliceRef.current = polar.activeSliceIndex;

  // Second-order spring animation for menu scale
  const springScale = useSpringValue(isOpen ? 1.0 : 0.0, {
    stiffness: settings.stiffness || 420,
    damping: settings.damping || 26,
    mass: 0.8,
  });

  // Pre-warm Web Audio context
  useEffect(() => {
    sounds.loadSounds();
  }, []);

  const handleClose = useCallback(async () => {
    if (settings.soundEnabled) {
      sounds.play("button-release.wav", 0.4);
    }
    setIsOpen(false);
    setActiveTier2Index(null);
    resetCoords();
    try {
      await invoke("hide_window");
    } catch (e) {
      console.warn("Hide window error", e);
    }
  }, [resetCoords, settings.soundEnabled]);

  const handleThemeToggle = useCallback(() => {
    const nextTheme: "crystal" | "titanium" = settings.themeId === "crystal" ? "titanium" : "crystal";
    const next: SettingsConfig = { ...settings, themeId: nextTheme };
    setSettings(next);
    localStorage.setItem("winee_settings", JSON.stringify(next));
    if (settings.soundEnabled) {
      sounds.play("ring-switch.wav", 0.5);
    }
  }, [settings]);

  const handleSubAction = useCallback(
    async (actionId: string) => {
      if (settings.soundEnabled) {
        sounds.play("button-press.wav", 0.6);
      }

      switch (actionId) {
        case "theme_toggle":
          handleThemeToggle();
          break;
        case "autostart": {
          const next = !settings.autostart;
          setSettings((s) => ({ ...s, autostart: next }));
          await invoke("set_autostart", { enable: next }).catch(console.error);
          break;
        }
        case "snip_window":
        case "snip_full":
          handleClose();
          await invoke("execute_radial_action", { mode: "default", index: 3, files: [] }).catch(console.error);
          break;
        case "vol_up":
        case "vol_down":
          sounds.play("button-press.wav", 0.5);
          break;
        case "compress":
        case "data_url":
          if (files.length > 0) {
            handleClose();
            await invoke("execute_radial_action", { mode: "image", index: 5, files }).catch(console.error);
          }
          break;
        default:
          break;
      }
    },
    [files, handleClose, handleThemeToggle, settings.autostart, settings.soundEnabled]
  );

  const handleSelectSlice = useCallback(
    async (index: number, actionId?: string) => {
      // Resolve action ID if not passed explicitly (gesture dispatch or legacy call)
      const effectiveActionId =
        actionId !== undefined
          ? actionId
          : mode === "default"
          ? (settings.customSlots && settings.customSlots[index]) || DEFAULT_WHEEL_SLOTS[index] || "none"
          : undefined;

      if (effectiveActionId === "none") {
        handleClose();
        return;
      }

      if (settings.soundEnabled) {
        sounds.play("button-press.wav", 0.6);
      }

      // If Settings action: open settings modal!
      if (effectiveActionId === "settings" || (mode === "default" && index === 7 && !effectiveActionId)) {
        setIsOpen(false);
        setIsSettingsOpen(true);
        resetCoords();
        return;
      }

      setIsOpen(false);
      resetCoords();

      try {
        await invoke("execute_radial_action", {
          mode,
          index,
          files,
          actionId: effectiveActionId || null,
        });
      } catch (err) {
        console.error("Action execution error:", err);
      } finally {
        try {
          await invoke("hide_window");
        } catch (_) {}
      }
    },
    [mode, files, resetCoords, settings.soundEnabled, settings.customSlots, handleClose]
  );

  const handleSelectChild = useCallback(
    async (_childIdx: number, childNode: ActionNode) => {
      if (settings.soundEnabled) {
        sounds.play("button-press.wav", 0.6);
      }
      if (childNode.content) {
        navigator.clipboard.writeText(childNode.content).catch(console.error);
        handleClose();
        return;
      }
      if (childNode.actionId) {
        handleSelectSlice(0, childNode.actionId);
        return;
      }
      if (childNode.children && childNode.children.length > 0) {
        return;
      }
      handleClose();
    },
    [handleClose, handleSelectSlice, settings.soundEnabled]
  );

  const handleAddSlice = useCallback(() => {
    const newNode: ActionNode = {
      id: `new_${Date.now()}`,
      label: "New Action",
      iconName: "Sparkles",
      type: "action",
      actionId: "quick_note",
    };
    const activeIdx = polar.activeSliceIndex ?? 0;
    setEditingNode({ node: newNode, parentIndex: activeIdx, childIndex: undefined });
    setIsEditorOpen(true);
  }, [polar.activeSliceIndex]);

  const handleEditSlice = useCallback(() => {
    const activeIdx = polar.activeSliceIndex ?? 0;
    const node = actionTree[activeIdx] || actionTree[0];
    if (node) {
      setEditingNode({ node: { ...node }, parentIndex: activeIdx });
      setIsEditorOpen(true);
    }
  }, [polar.activeSliceIndex, actionTree]);

  const handleDeleteSlice = useCallback(() => {
    const activeIdx = polar.activeSliceIndex;
    if (activeIdx !== null && actionTree[activeIdx]) {
      const updated = actionTree.filter((_, idx) => idx !== activeIdx);
      if (updated.length > 0) {
        handleSaveActionTree(updated);
      }
    }
  }, [polar.activeSliceIndex, actionTree, handleSaveActionTree]);

  const handleSaveEditedNode = useCallback(
    (updated: ActionNode) => {
      if (!editingNode) return;
      const newTree = [...actionTree];
      if (editingNode.childIndex !== undefined) {
        const parent = newTree[editingNode.parentIndex];
        if (parent && parent.children) {
          const newChildren = [...parent.children];
          newChildren[editingNode.childIndex] = updated;
          newTree[editingNode.parentIndex] = { ...parent, children: newChildren };
        }
      } else if (editingNode.node.id.startsWith("new_")) {
        newTree.push(updated);
      } else {
        newTree[editingNode.parentIndex] = updated;
      }
      handleSaveActionTree(newTree);
    },
    [editingNode, actionTree, handleSaveActionTree]
  );

  // Listen to Tauri events from Win32 backend
  useEffect(() => {
    const unlistenShow = listen<ShowPayload>("opie-show", (event) => {
      const payload = event.payload;

      const dpr = window.devicePixelRatio || 1;
      const rawX = payload.origin_x > 0 ? payload.origin_x / dpr : (window.innerWidth || 1920) / 2;
      const rawY = payload.origin_y > 0 ? payload.origin_y / dpr : (window.innerHeight || 1080) / 2;

      // Safe margin for 420px disc so no edges ever get cut off
      const margin = 210;
      const viewportW = window.innerWidth || 1920;
      const viewportH = window.innerHeight || 1080;
      const clampedX = Math.max(margin, Math.min(viewportW - margin, rawX));
      const clampedY = Math.max(margin, Math.min(viewportH - margin, rawY));

      setOrigin({ x: clampedX, y: clampedY });
      setMode(payload.mode || "default");
      setFiles(payload.files || []);
      setMedia(payload.media);
      resetCoords();
      setActiveTier2Index(null);
      setIsSettingsOpen(false);
      setIsOpen(true);

      if (settings.soundEnabled) {
        sounds.play("focus-wood.wav", 0.5);
      }
    });

    const unlistenSettings = listen("open-settings", () => {
      setIsOpen(false);
      setIsSettingsOpen(true);
    });

    const unlistenCancel = listen("opie-cancel", () => {
      handleClose();
    });

    const unlistenDispatch = listen<number>("opie-dispatch", (event) => {
      const idx = event.payload;
      const t2 = activeTier2Ref.current;
      const sliceIdx = activeSliceRef.current ?? idx;
      const parent = actionTreeRef.current[sliceIdx];

      // If user was hovering a sub-arc option in Tier 2, dispatch that child action!
      if (t2 !== null && parent?.children?.[t2]) {
        handleSelectChild(t2, parent.children[t2]);
        return;
      }

      const customActionId =
        mode === "default"
          ? (settings.customSlots && settings.customSlots[idx]) || DEFAULT_WHEEL_SLOTS[idx] || "none"
          : undefined;
      handleSelectSlice(idx, customActionId);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          handleClose();
        } else {
          handleClose();
        }
      } else if (e.code === "Space" && e.ctrlKey) {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unlistenShow.then((f) => f());
      unlistenSettings.then((f) => f());
      unlistenCancel.then((f) => f());
      unlistenDispatch.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, handleSelectSlice, handleSelectChild, isSettingsOpen, resetCoords, settings.soundEnabled]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpen || isSettingsOpen) return;
      const currentSlice = polar.activeSliceIndex !== null ? actionTree[polar.activeSliceIndex] : null;
      const hasActiveSubmenu = !!(currentSlice && currentSlice.children && currentSlice.children.length > 0);

      updateCoords(e.clientX, e.clientY, origin.x, origin.y, hasActiveSubmenu);

      // Sub-arc geometric tracking for seamless selection in expanded sub-menus
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      const r = Math.sqrt(dx * dx + dy * dy);

      if (r > 168 && hasActiveSubmenu && currentSlice && currentSlice.children) {
        const count = currentSlice.children.length;
        const anglePerItem = Math.min((30 * Math.PI) / 180, (150 * Math.PI) / (180 * Math.max(1, count)));
        const totalSpan = count * anglePerItem;
        const parentMidAngle = (polar.activeSliceIndex ?? 0) * ((2 * Math.PI) / 8);

        let theta = Math.atan2(dy, dx);
        if (theta < 0) theta += 2 * Math.PI;

        let diff = theta - parentMidAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        const startAngleRel = -totalSpan / 2;
        const relAngle = diff - startAngleRel;

        if (relAngle >= 0 && relAngle <= totalSpan) {
          const childIdx = Math.min(count - 1, Math.max(0, Math.floor(relAngle / anglePerItem)));
          setActiveTier2Index(childIdx);
        }
      } else if (r <= 168) {
        setActiveTier2Index(null);
      }
    },
    [isOpen, isSettingsOpen, origin.x, origin.y, updateCoords, polar.activeSliceIndex, actionTree]
  );

  // When inactive and closed, unmount DOM tree to ensure negligible widget idle power
  if (!isOpen && !isSettingsOpen && springScale < 0.01) {
    return null;
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={() => {
        if (!isSettingsOpen) {
          handleClose();
        }
      }}
      className="relative w-screen h-screen overflow-hidden select-none bg-transparent"
      style={{
        cursor: "default",
      }}
    >
      {/* Fluid Radial Action Wheel */}
      {isOpen && (
        <RadialMenu
          originX={origin.x}
          originY={origin.y}
          mode={mode}
          files={files}
          media={media}
          activeSliceIndex={polar.activeSliceIndex}
          activeTier2Index={activeTier2Index}
          isDeadzone={polar.isDeadzone}
          scale={springScale}
          theme={currentTheme}
          glassBlur={settings.glassBlur}
          glassMaterial={settings.glassMaterial}
          customSlots={settings.customSlots}
          actionTree={actionTree}
          onSelectSlice={handleSelectSlice}
          onSelectChild={handleSelectChild}
          onHoverSlice={(idx) => {
            if (idx !== polar.activeSliceIndex && settings.soundEnabled) {
              sounds.play("ring-switch.wav", 0.45);
            }
          }}
          onHoverTier2={(childIdx) => {
            setActiveTier2Index(childIdx);
            if (childIdx !== null && settings.soundEnabled) {
              sounds.play("ring-switch.wav", 0.4);
            }
          }}
          onCancel={handleClose}
          onThemeToggle={handleThemeToggle}
          onSubAction={handleSubAction}
          onAddSlice={handleAddSlice}
          onEditSlice={handleEditSlice}
          onDeleteSlice={handleDeleteSlice}
          onOpenSettings={() => {
            setIsOpen(false);
            setIsSettingsOpen(true);
          }}
        />
      )}

      {/* In-Place Slice / Card Customizer Modal */}
      <SliceEditorModal
        node={editingNode?.node || null}
        isOpen={isEditorOpen}
        onSave={handleSaveEditedNode}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNode(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          handleClose();
        }}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
};

export default App;
