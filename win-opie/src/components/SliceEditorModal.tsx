import React, { useState, useEffect } from "react";
import { X, Folder, Play, Check, Globe, FolderOpen } from "lucide-react";
import { ActionNode, ACTION_CATALOG, NodeType } from "../types/actions";

interface SliceEditorModalProps {
  node: ActionNode | null;
  isOpen: boolean;
  onSave: (updated: ActionNode) => void;
  onClose: () => void;
}

const NEON_PRESET_COLORS = [
  "#00e5ff", // Neon Cyan
  "#00ff9d", // Neon Emerald
  "#ffd600", // Neon Gold
  "#7c4dff", // Neon Violet
  "#ff2a85", // Neon Magenta / Pink
  "#00b0ff", // Neon Sky Blue
  "#ff5722", // Neon Orange
  "#e040fb", // Neon Purple
];

export const SliceEditorModal: React.FC<SliceEditorModalProps> = ({
  node,
  isOpen,
  onSave,
  onClose,
}) => {
  // 1. ALL HOOKS UNCONDITIONALLY AT THE TOP (Rules of Hooks Compliance)
  const [label, setLabel] = useState("");
  const [nodeType, setNodeType] = useState<NodeType>("action");
  const [actionId, setActionId] = useState("quick_note");
  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#00e5ff");
  const [customCategory, setCustomCategory] = useState<"system" | "url" | "folder" | "app">("system");

  // 2. Synchronize state whenever target node or open status updates
  useEffect(() => {
    if (node) {
      setLabel(node.label || "");
      setNodeType(node.type || (node.children?.length ? "submenu" : "action"));
      setActionId(node.actionId || "quick_note");
      setPath(node.path || "");
      setContent(node.content || "");
      setColor(node.color || "#00e5ff");

      if (node.path?.startsWith("http://") || node.path?.startsWith("https://")) {
        setCustomCategory("url");
      } else if (node.type === "folder" || node.actionId === "open_folder") {
        setCustomCategory("folder");
      } else if (node.path?.endsWith(".exe")) {
        setCustomCategory("app");
      } else {
        setCustomCategory("system");
      }
    }
  }, [node, isOpen]);

  const handleSave = () => {
    if (!node) return;

    let effectiveActionId = actionId;
    let effectiveType = nodeType;
    let effectivePath = path;

    if (customCategory === "url") {
      effectiveActionId = "custom_user_slot";
      effectiveType = "action";
      if (!effectivePath.startsWith("http://") && !effectivePath.startsWith("https://")) {
        effectivePath = `https://${effectivePath}`;
      }
    } else if (customCategory === "folder") {
      effectiveActionId = "open_folder";
      effectiveType = "folder";
    } else if (customCategory === "app") {
      effectiveActionId = "custom_user_slot";
      effectiveType = "app";
    }

    const updated: ActionNode = {
      ...node,
      label: label.trim() || "Untitled",
      type: effectiveType,
      actionId: effectiveType === "action" || effectiveType === "folder" || effectiveType === "app" ? effectiveActionId : undefined,
      path: effectivePath ? effectivePath.trim() : undefined,
      color,
      content: effectiveType === "clipboard_text" ? content : undefined,
      children: effectiveType === "submenu" ? (node.children || []) : undefined,
    };
    onSave(updated);
    onClose();
  };

  // 3. Conditional return AFTER all hooks have executed
  if (!isOpen || !node) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md select-none p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0e1017]/95 border border-white/15 p-5 shadow-2xl text-white space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
            <span className="font-semibold text-sm text-sky-200">
              {node.id.startsWith("new_") ? "Configure Radial Sector" : "Edit Radial Sector"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5 text-xs">
          {/* Label */}
          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Sector Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Website, Projects, Copilot"
              className="w-full bg-[#181a24] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 text-xs transition-colors"
            />
          </div>

          {/* Behavior / Category Type */}
          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Function Mode</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCustomCategory("system");
                  setNodeType("action");
                }}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  customCategory === "system" && nodeType === "action"
                    ? "bg-sky-500/30 border-sky-400 text-sky-200 shadow-sm"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Play className="w-3 h-3" /> System
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomCategory("url");
                  setNodeType("action");
                  if (!path) setPath("https://");
                }}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  customCategory === "url"
                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-sm"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Globe className="w-3 h-3" /> Web URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomCategory("folder");
                  setNodeType("folder");
                }}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  customCategory === "folder"
                    ? "bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <FolderOpen className="w-3 h-3" /> Folder
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomCategory("system");
                  setNodeType("submenu");
                }}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  nodeType === "submenu"
                    ? "bg-purple-500/30 border-purple-400 text-purple-200 shadow-sm"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Folder className="w-3 h-3" /> Sub-Menu
              </button>
            </div>
          </div>

          {/* System Action Selector */}
          {customCategory === "system" && nodeType === "action" && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Built-in Windows Action</label>
              <select
                value={actionId}
                onChange={(e) => setActionId(e.target.value)}
                className="w-full bg-[#181a24] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 text-xs"
              >
                {Object.values(ACTION_CATALOG).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({item.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Web URL input */}
          {customCategory === "url" && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Website URL</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="https://github.com or https://chatgpt.com"
                className="w-full bg-[#181a24] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 text-xs font-mono"
              />
              <p className="text-[10px] text-neutral-400">Opens directly in your default web browser.</p>
            </div>
          )}

          {/* Folder Directory input */}
          {customCategory === "folder" && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Target Folder Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="e.g. desktop, downloads, documents, or D:\Projects"
                className="w-full bg-[#181a24] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
              <div className="flex gap-1.5 pt-1">
                {["desktop", "downloads", "documents", "C:\\"].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setPath(quick)}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-amber-200"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-menu note */}
          {nodeType === "submenu" && (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 leading-relaxed">
              Sub-Menu will bloom as a cascading outer radial arc when hovered. You can nest deeper child actions into Tier 2 and Tier 3!
            </div>
          )}

          {/* Neon RGB Color Customization */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium">Neon Sector Accent Color</label>
              <span className="font-mono text-[10px] text-neutral-400">{color}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                {NEON_PRESET_COLORS.map((neon) => (
                  <button
                    key={neon}
                    type="button"
                    onClick={() => setColor(neon)}
                    className={`w-6 h-6 rounded-lg transition-transform ${
                      color === neon ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: neon,
                      boxShadow: color === neon ? `0 0 12px ${neon}` : "none",
                    }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-white/20"
                title="Custom Color Picker"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/25 transition-all"
          >
            <Check className="w-3.5 h-3.5" /> Save Sector
          </button>
        </div>
      </div>
    </div>
  );
};
