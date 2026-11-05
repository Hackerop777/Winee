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
  Bot,
  Star,
  ExternalLink,
  Plus,
  AppWindow,
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
  color?: string;
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
  open_copilot: {
    id: "open_copilot",
    label: "Microsoft Copilot",
    icon: Bot,
    category: "tools",
    description: "Open Microsoft Copilot App (Win+C)",
  },
  custom_user_slot: {
    id: "custom_user_slot",
    label: "Custom Action",
    icon: Star,
    category: "tools",
    description: "User customizable shortcut (URL or Folder)",
  },
  open_browser: {
    id: "open_browser",
    label: "Web Browser",
    icon: Globe,
    category: "apps",
    description: "Launch default Internet browser",
  },
  browser_new_tab: {
    id: "browser_new_tab",
    label: "New Tab",
    icon: Plus,
    category: "apps",
    description: "Open a fresh browser tab",
  },
  browser_new_window: {
    id: "browser_new_window",
    label: "New Window",
    icon: AppWindow,
    category: "apps",
    description: "Open a fresh browser window",
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
  open_folder: {
    id: "open_folder",
    label: "Open Folder",
    icon: FolderOpen,
    category: "tools",
    description: "Open specific folder directory",
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
  Bot,
  Star,
  ExternalLink,
  Plus,
  AppWindow,
};

export function getNodeIcon(name?: string, type?: NodeType): LucideIcon {
  if (name && ICON_MAP[name]) {
    return ICON_MAP[name];
  }
  if (type === "submenu") return Folder;
  if (type === "folder") return FolderOpen;
  if (type === "clipboard_text") return FileText;
  if (type === "clipboard_image") return Sparkles;
  if (type === "app") return AppWindow;
  return Activity;
}

export const DEFAULT_WHEEL_SLOTS: string[] = [
  "media_play_pause",
  "media_next",
  "screen_snip",
  "quick_note",
  "open_copilot",
  "custom_user_slot",
  "system_mute",
  "settings",
];

export const DEFAULT_ACTION_TREE: ActionNode[] = [
  {
    id: "node_media",
    label: "Media",
    iconName: "Play",
    type: "submenu",
    actionId: "media_play_pause",
    color: "#ff2a85",
    children: [
      { id: "m_prev", label: "Prev Track", iconName: "SkipBack", actionId: "media_prev", type: "action", color: "#00e5ff" },
      { id: "m_play", label: "Play / Pause", iconName: "Play", actionId: "media_play_pause", type: "action", color: "#00ff9d" },
      { id: "m_next", label: "Next Track", iconName: "SkipForward", actionId: "media_next", type: "action", color: "#ffd600" },
      { id: "m_mute", label: "Mute System", iconName: "VolumeX", actionId: "system_mute", type: "action", color: "#7c4dff" },
    ],
  },
  {
    id: "node_tools",
    label: "Tools",
    iconName: "Scissors",
    type: "submenu",
    actionId: "screen_snip",
    color: "#00e5ff",
    children: [
      { id: "t_snip", label: "Screen Snip", iconName: "Scissors", actionId: "screen_snip", type: "action", color: "#00e5ff" },
      { id: "t_note", label: "Quick Note", iconName: "FileText", actionId: "quick_note", type: "action", color: "#00ff9d" },
      { id: "t_copilot", label: "Copilot (Win+C)", iconName: "Bot", actionId: "open_copilot", type: "action", color: "#ffd600" },
    ],
  },
  {
    id: "node_apps",
    label: "Apps & Dev",
    iconName: "Terminal",
    type: "submenu",
    actionId: "open_terminal",
    color: "#00ff9d",
    children: [
      { id: "a_term", label: "Terminal / PS", iconName: "Terminal", actionId: "open_terminal", type: "action", color: "#00e5ff" },
      {
        id: "a_browser",
        label: "Web Browser",
        iconName: "Globe",
        actionId: "open_browser",
        type: "submenu",
        color: "#00ff9d",
        children: [
          { id: "b_new_tab", label: "New Tab", iconName: "Plus", actionId: "browser_new_tab", type: "action", color: "#00e5ff" },
          { id: "b_new_win", label: "New Window", iconName: "AppWindow", actionId: "browser_new_window", type: "action", color: "#00ff9d" },
        ],
      },
      { id: "a_exp", label: "File Explorer", iconName: "FolderOpen", actionId: "open_explorer", type: "action", color: "#ffd600" },
      { id: "a_task", label: "Task Manager", iconName: "Activity", actionId: "task_manager", type: "action", color: "#7c4dff" },
    ],
  },
  {
    id: "node_folders",
    label: "Folders",
    iconName: "Folder",
    type: "submenu",
    actionId: "open_folder",
    path: "desktop",
    color: "#ffd600",
    children: [
      { id: "f_desktop", label: "Desktop", iconName: "FolderOpen", actionId: "open_folder", path: "desktop", type: "folder", color: "#00e5ff" },
      { id: "f_downloads", label: "Downloads", iconName: "FolderOpen", actionId: "open_folder", path: "downloads", type: "folder", color: "#00ff9d" },
      { id: "f_docs", label: "Documents", iconName: "FolderOpen", actionId: "open_folder", path: "documents", type: "folder", color: "#ffd600" },
      { id: "f_c_drive", label: "This PC (C:)", iconName: "FolderOpen", actionId: "open_folder", path: "C:\\", type: "folder", color: "#7c4dff" },
    ],
  },
  {
    id: "node_copilot",
    label: "Copilot",
    iconName: "Bot",
    actionId: "open_copilot",
    type: "action",
    color: "#7c4dff",
  },
  {
    id: "node_custom",
    label: "My Action",
    iconName: "Star",
    actionId: "custom_user_slot",
    path: "https://github.com",
    type: "action",
    color: "#00b0ff",
  },
  {
    id: "node_mute",
    label: "System Mute",
    iconName: "VolumeX",
    actionId: "system_mute",
    type: "action",
    color: "#ff5722",
  },
  {
    id: "node_settings",
    label: "Settings",
    iconName: "Settings",
    actionId: "settings",
    type: "action",
    color: "#e040fb",
  },
];
