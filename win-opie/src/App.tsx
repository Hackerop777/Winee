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
        if (parsed.themeId === "coral" || parsed.themeId === "graphite") {
          parsed.themeId = "cyberpunk";
        }
        if (!parsed.glassMaterial) {
          parsed.glassMaterial = "liquid";
        }
        if (!parsed.customSlots || !Array.isArray(parsed.customSlots) || parsed.customSlots.length !== 8) {
          parsed.customSlots = DEFAULT_WHEEL_SLOTS;
        }
        if (!parsed.menuScale) {
          parsed.menuScale = 1.0;
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
        themeId: "cyberpunk",
        customSlots: DEFAULT_WHEEL_SLOTS,
        menuScale: 1.0,
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
        themeId: "cyberpunk",
        customSlots: DEFAULT_WHEEL_SLOTS,
        menuScale: 1.0,
      };
    }
  });

  // Action tree supporting multi-tier cascading radial sub-menus (strictly 8 root slots)
  const [actionTree, setActionTree] = useState<ActionNode[]>(() => {
    try {
      const stored = localStorage.getItem("winee_action_tree");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate old clipboard actions to copilot
          const sanitized = parsed.slice(0, 8).map((node: ActionNode) => {
            if (node.actionId === "clipboard") {
              return {
                ...node,
                label: "Copilot",
                iconName: "Bot",
                actionId: "open_copilot",
                color: "#7c4dff",
              };
            }
            return node;
          });
          return sanitized;
        }
      }
    } catch (_) {}
    return DEFAULT_ACTION_TREE;
  });

  const [activeTier2Index, setActiveTier2Index] = useState<number | null>(null);
  const activeTier2Ref = useRef<number | null>(null);
  activeTier2Ref.current = activeTier2Index;

  const [activeTier3Index, setActiveTier3Index] = useState<number | null>(null);
  const activeTier3Ref = useRef<number | null>(null);
  activeTier3Ref.current = activeTier3Index;

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<{ node: ActionNode; parentIndex: number; childIndex?: number } | null>(null);

  const actionTreeRef = useRef<ActionNode[]>(actionTree);
  actionTreeRef.current = actionTree;

  const handleSaveActionTree = useCallback((newTree: ActionNode[]) => {
    const clamped = newTree.slice(0, 8);
    setActionTree(clamped);
    localStorage.setItem("winee_action_tree", JSON.stringify(clamped));
  }, []);

  const currentTheme = THEMES[settings.themeId || "cyberpunk"] || THEMES.cyberpunk;

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
    setActiveTier3Index(null);
    resetCoords();
    try {
      await invoke("hide_window");
    } catch (e) {
      console.warn("Hide window error", e);
    }
  }, [resetCoords, settings.soundEnabled]);

  const handleThemeToggle = useCallback(() => {
    const themeKeys = Object.keys(THEMES) as Array<keyof typeof THEMES>;
    const currIdx = themeKeys.indexOf(settings.themeId);
    const nextTheme = themeKeys[(currIdx + 1) % themeKeys.length];
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
        case "compress":
        case "data_url":
        case "snip_window":
        case "snip_full":
        case "vol_up":
        case "vol_down":
          handleClose();
          break;
        default:
          break;
      }
    },
    [handleClose, handleThemeToggle, settings.autostart, settings.soundEnabled]
  );

  const handleSelectSlice = useCallback(
    async (index: number, actionId?: string, nodeOrPath?: ActionNode | string) => {
      const targetPath =
        typeof nodeOrPath === "string"
          ? nodeOrPath
          : nodeOrPath && typeof nodeOrPath === "object"
          ? nodeOrPath.path
          : undefined;

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

      // If Settings action: open settings modal
      if (effectiveActionId === "settings" || (mode === "default" && index === 7 && !effectiveActionId)) {
        setIsOpen(false);
        setIsSettingsOpen(true);
        resetCoords();
        return;
      }

      setIsOpen(false);
      resetCoords();
      setActiveTier2Index(null);
      setActiveTier3Index(null);

      // Hide window immediately so the desktop or target app gets foreground focus before action triggers
      try {
        await invoke("hide_window");
      } catch (_) {}

      try {
        await invoke("execute_radial_action", {
          mode,
          index,
          files,
          actionId: effectiveActionId || null,
          targetPath: targetPath || null,
        });
      } catch (err) {
        console.error("Action execution error:", err);
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

      // If clicking a dynamic browser tab, focus its HWND
      if (childNode.id.startsWith("tab_") && childNode.path) {
        const hwndVal = parseInt(childNode.path, 10);
        if (!isNaN(hwndVal)) {
          invoke("focus_window", { hwnd: hwndVal }).catch(console.error);
          handleClose();
          return;
        }
      }

      if (childNode.actionId) {
        handleSelectSlice(0, childNode.actionId, childNode.path);
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
      label: "My Action",
      iconName: "Star",
      type: "action",
      actionId: "custom_user_slot",
      path: "https://",
      color: "#00e5ff",
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
      const updated = [...actionTree];
      // Reset sector to empty rather than shrinking the 8-wedge wheel
      updated[activeIdx] = {
        id: `node_empty_${activeIdx}`,
        label: "(Empty Slot)",
        iconName: "MinusCircle",
        actionId: "none",
        type: "action",
        color: "rgba(255, 255, 255, 0.2)",
      };
      handleSaveActionTree(updated);
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
        // Enforce strictly 8 root slots: configure the target slot
        const targetIdx = Math.min(7, editingNode.parentIndex);
        newTree[targetIdx] = updated;
      } else {
        const targetIdx = Math.min(7, editingNode.parentIndex);
        newTree[targetIdx] = updated;
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

      // Safe margin responsive to wheel size scale so edges never clip
      const currentScale = settings.menuScale || 1.0;
      const margin = 260 * currentScale;
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
      setActiveTier3Index(null);
      setIsSettingsOpen(false);
      setIsOpen(true);

      if (settings.soundEnabled) {
        sounds.play("focus-wood.wav", 0.5);
      }

      // Query open browser tabs to dynamically populate the Browser sub-menu
      invoke<Array<{ hwnd: number; title: string; browser: string }>>("get_browser_tabs")
        .then((tabs) => {
          if (tabs && tabs.length > 0) {
            setActionTree((prev) => {
              return prev.map((node) => {
                if (node.id === "node_apps" && node.children) {
                  const updatedChildren = node.children.map((child) => {
                    if (child.actionId === "open_browser") {
                      const maxDisplay = 4;
                      const tabItems: ActionNode[] = [
                        { id: "b_new_tab", label: "New Tab", iconName: "Plus", actionId: "browser_new_tab", type: "action", color: "#00e5ff" },
                        { id: "b_new_win", label: "New Window", iconName: "AppWindow", actionId: "browser_new_window", type: "action", color: "#00ff9d" },
                      ];

                      tabs.slice(0, maxDisplay).forEach((t, i) => {
                        tabItems.push({
                          id: `tab_${t.hwnd}_${i}`,
                          label: t.title.length > 18 ? `${t.title.slice(0, 16)}...` : t.title,
                          iconName: "Globe",
                          actionId: "focus_window",
                          path: String(t.hwnd),
                          type: "action",
                          color: "#ffd600",
                        });
                      });

                      if (tabs.length > maxDisplay) {
                        const remaining = tabs.length - maxDisplay;
                        tabItems.push({
                          id: "tab_more",
                          label: `+${remaining} more tabs`,
                          iconName: "Globe",
                          actionId: "open_browser",
                          type: "action",
                          color: "#7c4dff",
                        });
                      }

                      const updatedNode: ActionNode = {
                        ...child,
                        type: "submenu",
                        children: tabItems,
                      };
                      return updatedNode;
                    }
                    return child;
                  });
                  return { ...node, children: updatedChildren };
                }
                return node;
              });
            });
          }
        })
        .catch(() => {});
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
      const t3 = activeTier3Ref.current;
      const sliceIdx = activeSliceRef.current ?? idx;
      const parent = actionTreeRef.current[sliceIdx];

      // Tier 3 child execution
      if (t2 !== null && t3 !== null && parent?.children?.[t2]?.children?.[t3]) {
        handleSelectChild(t3, parent.children[t2].children[t3]);
        return;
      }

      // Tier 2 child execution
      if (t2 !== null && parent?.children?.[t2]) {
        handleSelectChild(t2, parent.children[t2]);
        return;
      }

      // Tier 1 root slice execution
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
  }, [handleClose, handleSelectSlice, handleSelectChild, isSettingsOpen, resetCoords, settings.soundEnabled, settings.menuScale]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpen || isSettingsOpen) return;
      const currentSlice = polar.activeSliceIndex !== null ? actionTree[polar.activeSliceIndex] : null;
      const hasActiveSubmenu = !!(currentSlice && currentSlice.children && currentSlice.children.length > 0);

      updateCoords(e.clientX, e.clientY, origin.x, origin.y, hasActiveSubmenu);

      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      const r = Math.sqrt(dx * dx + dy * dy);

      // Multi-tier polar ray-casting with boundary locks
      if (r > 168 && hasActiveSubmenu && currentSlice && currentSlice.children) {
        const count2 = currentSlice.children.length;
        const anglePerItem2 = Math.min((30 * Math.PI) / 180, (150 * Math.PI) / (180 * Math.max(1, count2)));
        const totalSpan2 = count2 * anglePerItem2;
        const parentMidAngle = (polar.activeSliceIndex ?? 0) * ((2 * Math.PI) / 8);

        let theta = Math.atan2(dy, dx);
        if (theta < 0) theta += 2 * Math.PI;

        const lastT2 = activeTier2Ref.current;
        const lastT2Child = lastT2 !== null && currentSlice.children[lastT2] ? currentSlice.children[lastT2] : null;
        const hasActiveTier3 = !!(lastT2Child && lastT2Child.children && lastT2Child.children.length > 0);

        let effectiveT2Index: number | null = null;

        // If cursor is beyond Tier 2 into Tier 3 (r > 254) and active Tier 2 child has a submenu,
        // LOCK Tier 2 so navigating wide Tier 3 options will NEVER collapse the Tier 3 sub-arc!
        if (r > 254 && hasActiveTier3 && lastT2 !== null) {
          effectiveT2Index = lastT2;
        } else {
          // Inside Tier 2 zone: calculate Tier 2 ray-casting
          let diff2 = theta - parentMidAngle;
          while (diff2 > Math.PI) diff2 -= 2 * Math.PI;
          while (diff2 < -Math.PI) diff2 += 2 * Math.PI;

          const startAngleRel2 = -totalSpan2 / 2;
          const relAngle2 = diff2 - startAngleRel2;

          if (relAngle2 >= 0 && relAngle2 <= totalSpan2) {
            effectiveT2Index = Math.min(count2 - 1, Math.max(0, Math.floor(relAngle2 / anglePerItem2)));
          } else if (lastT2 !== null) {
            effectiveT2Index = lastT2;
          }
        }

        if (effectiveT2Index !== null) {
          setActiveTier2Index(effectiveT2Index);

          // Now calculate Tier 3 ray-casting
          const tier2Child = currentSlice.children[effectiveT2Index];
          if (r > 254 && tier2Child && tier2Child.children && tier2Child.children.length > 0) {
            const count3 = tier2Child.children.length;
            const anglePerItem3 = Math.min((30 * Math.PI) / 180, (150 * Math.PI) / (180 * Math.max(1, count3)));
            const totalSpan3 = count3 * anglePerItem3;

            const startAngleRel2 = -totalSpan2 / 2;
            const tier2ChildMid = startAngleRel2 + effectiveT2Index * anglePerItem2 + anglePerItem2 / 2 + parentMidAngle;

            let diff3 = theta - tier2ChildMid;
            while (diff3 > Math.PI) diff3 -= 2 * Math.PI;
            while (diff3 < -Math.PI) diff3 += 2 * Math.PI;

            const startAngleRel3 = -totalSpan3 / 2;
            const relAngle3 = diff3 - startAngleRel3;

            // Clamped ray-casting: dragging cursor all the way to extreme left or right stays selected!
            const tier3Idx = Math.min(count3 - 1, Math.max(0, Math.floor(relAngle3 / anglePerItem3)));
            setActiveTier3Index(tier3Idx);
          } else if (r <= 254) {
            setActiveTier3Index(null);
          }
        }
      } else if (r <= 168) {
        setActiveTier2Index(null);
        setActiveTier3Index(null);
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
          activeTier3Index={activeTier3Index}
          isDeadzone={polar.isDeadzone}
          scale={springScale * (settings.menuScale || 1.0)}
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
          onHoverTier3={(tier3Idx) => {
            setActiveTier3Index(tier3Idx);
            if (tier3Idx !== null && settings.soundEnabled) {
              sounds.play("ring-switch.wav", 0.35);
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
