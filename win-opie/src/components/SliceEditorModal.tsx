import React, { useState } from "react";
import { X, Image as ImageIcon, Folder, Play, Check } from "lucide-react";
import { ActionNode, ACTION_CATALOG, NodeType } from "../types/actions";

interface SliceEditorModalProps {
  node: ActionNode | null;
  isOpen: boolean;
  onSave: (updated: ActionNode) => void;
  onClose: () => void;
}

export const SliceEditorModal: React.FC<SliceEditorModalProps> = ({
  node,
  isOpen,
  onSave,
  onClose,
}) => {
  if (!isOpen || !node) return null;

  const [label, setLabel] = useState(node.label || "");
  const [nodeType, setNodeType] = useState<NodeType>(node.type || (node.children?.length ? "submenu" : "action"));
  const [actionId, setActionId] = useState(node.actionId || "quick_note");
  const [content, setContent] = useState(node.content || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(node.thumbnailUrl || "");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setThumbnailUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updated: ActionNode = {
      ...node,
      label: label.trim() || "Untitled",
      type: nodeType,
      actionId: nodeType === "action" ? actionId : undefined,
      content: nodeType === "clipboard_text" ? content : undefined,
      thumbnailUrl: nodeType === "clipboard_image" ? thumbnailUrl : undefined,
      children: nodeType === "submenu" ? (node.children || []) : undefined,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#14141e]/95 border border-white/15 p-5 shadow-2xl text-white space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="font-semibold text-sm text-sky-200">
            {node.id.startsWith("new_") ? "Add Radial Sector" : "Edit Sector Card"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3 text-xs">
          {/* Label */}
          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Slice Title</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Macro, Discord, Notes"
              className="w-full bg-[#1e1e2a] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 text-xs"
            />
          </div>

          {/* Node Type Selector */}
          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Behavior Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setNodeType("action")}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  nodeType === "action"
                    ? "bg-sky-500/30 border-sky-400 text-sky-200"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Play className="w-3 h-3" /> Action
              </button>
              <button
                type="button"
                onClick={() => setNodeType("submenu")}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  nodeType === "submenu"
                    ? "bg-purple-500/30 border-purple-400 text-purple-200"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Folder className="w-3 h-3" /> Sub-Menu
              </button>
              <button
                type="button"
                onClick={() => setNodeType("clipboard_image")}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  nodeType === "clipboard_image"
                    ? "bg-amber-500/30 border-amber-400 text-amber-200"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3 h-3" /> Image Card
              </button>
            </div>
          </div>

          {/* Action Mapping if Action type */}
          {nodeType === "action" && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">System Action</label>
              <select
                value={actionId}
                onChange={(e) => setActionId(e.target.value)}
                className="w-full bg-[#1e1e2a] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 text-xs"
              >
                {Object.values(ACTION_CATALOG).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({item.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sub-menu note */}
          {nodeType === "submenu" && (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 leading-relaxed">
              Sub-Menu will bloom as a cascading outer radial arc when hovered or selected. You can add nested items directly.
            </div>
          )}

          {/* Image Thumbnail Upload if Image Card */}
          {nodeType === "clipboard_image" && (
            <div className="space-y-2">
              <label className="text-neutral-300 font-medium">Thumbnail / Preview Image</label>
              <div className="flex items-center gap-3">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-white/20 shadow"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-neutral-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="cursor-pointer bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg py-1 px-3 text-center text-[11px] text-neutral-200 font-medium transition-colors">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl("")}
                      className="text-[10px] text-rose-400 hover:text-rose-300 text-left"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Clipboard Text if Text Snippet */}
          {nodeType === "clipboard_text" && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Text Content to Paste</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Paste code snippet, email template, or text..."
                className="w-full bg-[#1e1e2a] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 text-xs resize-none"
              />
            </div>
          )}
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
