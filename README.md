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

## Key Features

- **Continuous Translucent Glass Disc**: Unified circular glass surface with fine hairline sector separators.
- **$C^1$-Continuous Fluid Droplet Bulge**: Active wedges expand outward with a mathematically smooth liquid teardrop shape.
- **Luminous Center Hub**: Dynamic action label typography with an inner neon-bloom halo.
- **Contextual Action Bubbles**: Secondary action buttons orbit smoothly outward along the sector trajectory.
- **Dual Visual Themes**:
  - **Warm Coral Glass**: Reference sunset amber/peach aesthetic with golden active accents.
  - **Cool Graphite Glass**: Windows 11 Fluent slate/ice blue aesthetic with cyan luminous bloom.
- **Everyday Radial Tools**:
  - Media Play / Pause, Skip Next, Skip Previous (WinRT media session controls)
  - Windows Screen Snip (`ms-screenclip:`)
  - Quick Notepad Scratchpad
  - System Audio Mute (`IAudioEndpointVolume`)
  - Clipboard History (`Win + V`)
  - Full Settings & Preferences Window
- **Context-Aware File Actions**: Automatic detection of selected files in Windows Explorer for in-memory image conversion (PNG, JPG, WEBP, ICO, BMP) and media operations.
- **Zero-Power Idle Footprint**: Detaches from DWM queue when closed; consumes `< 0.02%` CPU when inactive.
- **Tactile Audio Feedback**: 100% offline Web Audio API synthesized clicks, wood knocks, and metallic ticks.

---

## Activation Shortcuts

| Trigger | Description |
| :--- | :--- |
| **`Ctrl + Space`** | Primary global hold/trigger gesture |
| **`Alt + O`** | Mnemonic secondary trigger (*O* for Opie / Winee) |
| **`Middle Mouse Button`** | Scroll wheel click anywhere on screen |
| **System Tray Icon** | Instant left-click trigger from the Windows notification area |

---

## Installation

Download and run the official Windows NSIS setup package:

- **Installer**: `WINEE_1.4.0_Setup.exe` (2.99 MiB)
- **Requirements**: Windows 11 or Windows 10 (x86_64)

---

## Tech Stack

- **Backend**: Rust 2021 + Tauri v2 + Windows Crate (Win32 & WinRT APIs)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Audio Engine**: Pure Web Audio API Oscillator Synthesizer
- **Packaging**: NSIS Installer

---

## Author & Attribution

- Built by **Hackerop777** (`mythicgaming61@gmail.com`)
- Inspired by **Opie** (`opies.io` by InsaneArts)
