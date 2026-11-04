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
  LucideIcon,
} from "lucide-react";

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
