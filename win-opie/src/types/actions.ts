import {
  Play,
  SkipForward,
  SkipBack,
  Scissors,
  FileText,
  VolumeX,
  ClipboardList,
  Settings,
  Globe,
  Terminal,
  FolderOpen,
  Activity,
  Lock,
  MinusCircle,
  Folder,
  Layers,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export type NodeType = "action" | "submenu" | "clipboard_text" | "clipboard_image" | "folder" | "app";

export interface ActionNode {
  id: string;
  label: string;
  iconName?: string;
  type?: NodeType;
  actionId?: string;
  path?: string;
  content?: string;
  thumbnailUrl?: string;
  children?: ActionNode[];
}

export interface ActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category: "media" | "tools" | "apps" | "system";
  description: string;
}

export const ACTION_CATALOG: Record<string, ActionItem> = {
  media_play_pause: {
    id: "media_play_pause",
    label: "Play / Pause",
    icon: Play,
    category: "media",
    description: "Toggle Windows media playback",
  },
  media_next: {
    id: "media_next",
    label: "Next Track",
    icon: SkipForward,
    category: "media",
    description: "Skip to next music or video track",
  },
  media_prev: {
    id: "media_prev",
    label: "Previous Track",
    icon: SkipBack,
    category: "media",
    description: "Return to previous track",
  },
  system_mute: {
    id: "system_mute",
    label: "Mute System",
    icon: VolumeX,
    category: "media",
    description: "Toggle master audio volume mute",
  },
  screen_snip: {
    id: "screen_snip",
    label: "Screen Snip",
    icon: Scissors,
    category: "tools",
    description: "Windows screen snipping tool",
  },
  quick_note: {
    id: "quick_note",
    label: "Quick Note",
    icon: FileText,
    category: "tools",
    description: "Open fast Notepad scratchpad",
  },
  clipboard: {
    id: "clipboard",
    label: "Clipboard History",
    icon: ClipboardList,
    category: "tools",
    description: "Open Windows clipboard history (Win+V)",
  },
  open_browser: {
    id: "open_browser",
    label: "Web Browser",
    icon: Globe,
    category: "apps",
    description: "Launch default Internet browser",
  },
  open_terminal: {
    id: "open_terminal",
    label: "Terminal / PS",
    icon: Terminal,
    category: "apps",
    description: "Open PowerShell or Windows Terminal",
  },
  open_explorer: {
    id: "open_explorer",
    label: "File Explorer",
    icon: FolderOpen,
    category: "apps",
    description: "Open Windows File Explorer",
  },
  task_manager: {
    id: "task_manager",
    label: "Task Manager",
    icon: Activity,
    category: "system",
    description: "Open Windows Task Manager",
  },
  lock_pc: {
    id: "lock_pc",
    label: "Lock PC",
    icon: Lock,
    category: "system",
    description: "Instantly lock workstation (Win+L)",
  },
  settings: {
    id: "settings",
    label: "Settings",
    icon: Settings,
    category: "system",
    description: "Open Winee preferences window",
  },
  none: {
    id: "none",
    label: "(Empty Slot)",
    icon: MinusCircle,
    category: "tools",
    description: "Disable this wheel slice",
  },
};

export const ICON_MAP: Record<string, LucideIcon> = {
  Play,
  SkipForward,
  SkipBack,
  Scissors,
  FileText,
  VolumeX,
  ClipboardList,
  Settings,
  Globe,
  Terminal,
  FolderOpen,
  Activity,
  Lock,
  MinusCircle,
  Folder,
  Layers,
  Sparkles,
};

export function getNodeIcon(name?: string, type?: NodeType): LucideIcon {
  if (name && ICON_MAP[name]) {
    return ICON_MAP[name];
  }
  if (type === "submenu") return Folder;
  if (type === "folder") return FolderOpen;
  if (type === "clipboard_text") return FileText;
  if (type === "clipboard_image") return Sparkles;
  return Activity;
}

export const DEFAULT_WHEEL_SLOTS: string[] = [
  "media_play_pause",
  "media_next",
  "media_prev",
  "screen_snip",
  "quick_note",
  "system_mute",
  "clipboard",
  "settings",
];

export const DEFAULT_ACTION_TREE: ActionNode[] = [
  {
    id: "node_media",
    label: "Media",
    iconName: "Play",
    type: "submenu",
    actionId: "media_play_pause",
    children: [
      { id: "m_prev", label: "Prev Track", iconName: "SkipBack", actionId: "media_prev", type: "action" },
      { id: "m_play", label: "Play / Pause", iconName: "Play", actionId: "media_play_pause", type: "action" },
      { id: "m_next", label: "Next Track", iconName: "SkipForward", actionId: "media_next", type: "action" },
      { id: "m_mute", label: "Mute System", iconName: "VolumeX", actionId: "system_mute", type: "action" },
    ],
  },
  {
    id: "node_tools",
    label: "Tools",
    iconName: "Scissors",
    type: "submenu",
    actionId: "screen_snip",
    children: [
      { id: "t_snip", label: "Screen Snip", iconName: "Scissors", actionId: "screen_snip", type: "action" },
      { id: "t_note", label: "Quick Note", iconName: "FileText", actionId: "quick_note", type: "action" },
      { id: "t_clip", label: "Clipboard (Win+V)", iconName: "ClipboardList", actionId: "clipboard", type: "action" },
    ],
  },
  {
    id: "node_apps",
    label: "Apps & Dev",
    iconName: "Terminal",
    type: "submenu",
    actionId: "open_terminal",
    children: [
      { id: "a_term", label: "Terminal / PS", iconName: "Terminal", actionId: "open_terminal", type: "action" },
      { id: "a_browser", label: "Web Browser", iconName: "Globe", actionId: "open_browser", type: "action" },
      { id: "a_exp", label: "File Explorer", iconName: "FolderOpen", actionId: "open_explorer", type: "action" },
      { id: "a_task", label: "Task Manager", iconName: "Activity", actionId: "task_manager", type: "action" },
    ],
  },
  {
    id: "node_folders",
    label: "Folders",
    iconName: "Folder",
    type: "submenu",
    actionId: "open_explorer",
    children: [
      { id: "f_desktop", label: "Desktop", iconName: "FolderOpen", actionId: "open_explorer", type: "folder" },
      { id: "f_downloads", label: "Downloads", iconName: "FolderOpen", actionId: "open_explorer", type: "folder" },
      { id: "f_projects", label: "Projects", iconName: "FolderOpen", actionId: "open_explorer", type: "folder" },
    ],
  },
  { id: "node_mute", label: "System Mute", iconName: "VolumeX", actionId: "system_mute", type: "action" },
  { id: "node_snip", label: "Screen Snip", iconName: "Scissors", actionId: "screen_snip", type: "action" },
  { id: "node_lock", label: "Lock PC", iconName: "Lock", actionId: "lock_pc", type: "action" },
  { id: "node_settings", label: "Settings", iconName: "Settings", actionId: "settings", type: "action" },
];
