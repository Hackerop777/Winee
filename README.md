# Winee (WinOpie)

<p align="center">
  <strong>Native Windows 11 Fluid Radial Action & Productivity Utility</strong><br>
  <em>Inspired by opies.io for macOS</em>
</p>

<p align="center">
  <img src="win-opie/src-tauri/icons/128x128.png" alt="Winee Logo" width="96" height="96" />
</p>

---

## Overview

**Winee** is a cursor-centered radial productivity action wheel designed specifically for Windows 11. It brings fluid, physics-driven radial interactions to Windows with zero runtime Chromium overhead, deep Win32/WinRT integrations, genuine desktop acrylic/frosted glass composition, and organic fluid droplet bulge kinematics.

---

## Key Features in v1.4.1

- **Fully Customizable Wheel Slices**:
  - Re-order, swap, or disable any of the 8 radial slices.
  - Built-in profiles: *Default Everyday*, *Dev & Power User*, and *Media Minimal*.
  - Extensive action catalog: Media controls, Volume/Mute, Snipping Tool, Quick Note, Clipboard History, Default Browser, Windows Terminal, File Explorer, Task Manager, Lock PC, Settings, and Empty/Disabled slots.
- **Gesture & Flick Dispatch**:
  - Hold hotkey, flick towards a wedge, and release modifier to trigger in under 50ms.
  - Native gesture dispatch directly resolves user-customized action slots.
- **Dual Physical Glass Engines**:
  - **Liquid Glass**: SVG fractal noise turbulence `#lg-dist` with real-time displacement mapping and 3D specular highlight bevels.
  - **Frosted Glass**: Velvet diffusion blur with dual-direction inset rims and elliptical radial sheen.
  - **Uncapped Blur Customization**: Full 0–100px range slider support.
- **Dynamic OS Hotkey Binding**:
  - Live synchronization between Settings shortcut preferences and native Windows `RegisterHotKey` / hardware polling.
  - Supported triggers: `Ctrl + Space`, `Alt + O`, `Ctrl + Alt + Space`, `Alt + Space`, and `Middle Mouse Button`.
- **Authoritative Windows Explorer Integration**:
  - Direct Shell COM discovery (`IShellWindows`, `IFolderView`, `IShellItemArray`) with RAII COM lifecycle management (`CoUninitialize`).
  - Purged stale clipboard fallbacks for 100% authoritative file selection.
  - Mixed-selection safety: guarantees batch actions are only presented on homogeneous file selections.
- **Zero-Power Idle Footprint**:
  - Detaches from DWM queue when closed; consumes `< 0.02%` CPU when inactive.
- **Tactile Audio Feedback**:
  - 100% offline Web Audio API synthesized clicks, wood knocks, and metallic ticks.

---

## Activation Shortcuts

| Trigger | Description |
| :--- | :--- |
| **`Ctrl + Space`** | Primary global hold/trigger gesture (configurable) |
| **`Alt + O`** | Mnemonic secondary trigger (*O* for Opie / Winee) |
| **`Middle Mouse Button`** | Scroll wheel click anywhere on screen |
| **System Tray Icon** | Instant left-click trigger from the Windows notification area |

---

## Installation

Download and run the official Windows NSIS setup package:

- **Installer**: `WINEE_1.4.1_Setup.exe` (~3.00 MiB)
- **Requirements**: Windows 11 or Windows 10 (x86_64)

---

## Tech Stack

- **Backend**: Rust 2021 + Tauri v2 + Windows Crate (Win32 & WinRT APIs)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Audio Engine**: Pure Web Audio API Oscillator Synthesizer
- **CI / Build**: GitHub Actions automated matrix with cargo test & Tauri NSIS bundle
- **Packaging**: NSIS Installer

---

## Author & Attribution

- Built by **Hackerop777** (`mythicgaming61@gmail.com`)
- Inspired by **Opie** (`opies.io` by InsaneArts)
