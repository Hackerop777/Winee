# WINEE — Technical Architecture Document

## 1. System Overview

**WINEE** is an independent Windows 11 radial productivity utility built on **Tauri v2**. It couples a high-performance, privileged Rust native backend with a fluid, hardware-accelerated React/TypeScript visual overlay.

```mermaid
graph TD
    subgraph WindowsKernel[Windows 11 OS Subsystems]
        KBD[Hardware Keyboard / Raw Input]
        HOTKEY[Win32 RegisterHotKey Dispatcher]
        DWM[Desktop Window Manager / Mica / Layered Alpha]
        SHELL[Windows Shell COM / IShellWindows]
        SMTC[WinRT GlobalSystemMediaTransportControls]
    end

    subgraph RustCore[Rust Native Daemon — D:\\Nihal\\Winopie\\win-opie\\src-tauri]
        INIT[main.rs: Single-Instance Mutex & Env Setup]
        INPUT_MGR[hooks.rs: Input Poller & Hotkey Thread]
        WINDOW_MGR[lib.rs: Overlay Window Lifecycle & Monitor Bounds]
        SHELL_MGR[explorer.rs: Context Discovery]
        MEDIA_MGR[media.rs: Async WinRT Media Worker]
        CONV_MGR[converter.rs: Headless Media Workers]
        STORE[D:\\Nihal\\Winopie\\.webview_data]
    end

    subgraph Presentation[React Frontend — D:\\Nihal\\Winopie\\win-opie\\src]
        OVERLAY[App.tsx: Fullscreen Transparent Layer]
        RADIAL[RadialMenu.tsx: 8-Wedge SVG Canvas]
        SLICES[Slice.tsx: Frosted Glass & Icons]
        HUB[CenterHub.tsx: Media Marquee & Deadzone]
        POLAR[usePolarCoords.ts: atan2 & Range Normalizer]
        SPRING[useSpringPhysics.ts: Damped Oscillators]
        SFX[sound.ts: Low-Latency Web Audio API]
    end

    KBD --> INPUT_MGR
    HOTKEY --> INPUT_MGR
    INIT --> STORE
    INPUT_MGR -->|Non-blocking IPC / mpsc| WINDOW_MGR
    WINDOW_MGR -->|win.show / focus| DWM
    WINDOW_MGR -->|Event: opie-show| OVERLAY
    SHELL --> SHELL_MGR
    SMTC --> MEDIA_MGR
    OVERLAY --> POLAR
    POLAR --> RADIAL
    SPRING --> RADIAL
    RADIAL --> SLICES
    RADIAL --> HUB
    RADIAL --> SFX
    OVERLAY -->|invoke: execute_radial_action| CONV_MGR
```

---

## 2. Core Architectural Principles

### Principle 1: Strict Division of Responsibilities
- **Rust Backend**:
  - Owns all privileged Win32 APIs, raw input listeners, registry autostart, background worker threads, file discovery, and conversion processes.
  - Never executes long-running or blocking COM / WinRT operations inside input callback threads.
  - Enforces single-instance lifecycle using a named Windows Mutex (`Local\Winee_SingleInstance_Mutex`).
- **React Frontend**:
  - Owns presentation, 60/120fps polar coordinate calculations, spring dynamics, SVG path geometry, and low-latency audio cue playback.
  - Completely stops all animation loops and unmounts DOM nodes when the overlay is closed to achieve 0.0% idle CPU and GPU consumption.

### Principle 2: Safe Overlay Lifecycle & Multi-Monitor Geometry
1. **Monitor Discovery**:
   - Uses `MonitorFromPoint` with `MONITOR_DEFAULTTONEAREST` to find the exact monitor containing the spawn cursor coordinates $(x_0, y_0)$.
   - Retrieves monitor bounds and DPI scale factor via `GetDpiForMonitor` or `GetScaleFactorForMonitor`.
2. **Coordinate Normalization**:
   - Win32 cursor coordinates are converted from global virtual screen pixels to client-relative logical CSS pixels:
     $$\text{css}_x = \frac{x_{\text{cursor}} - x_{\text{monitor\_origin}}}{\text{DPR}}, \quad \text{css}_y = \frac{y_{\text{cursor}} - y_{\text{monitor\_origin}}}{\text{DPR}}$$
3. **Window Show / Hide Sequence**:
   - Window is created hidden (`visible: false`) with `decorations: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`.
   - On activation: `win.show()`, `win.set_focus()`, and `win.set_always_on_top(true)` ensure the overlay appears above all normal and full-screen windows without breaking DWM alpha composition.
   - On dismissal: `win.hide()` immediately detaches the window from the composition queue.

### Principle 3: Non-Blocking Background Input Pipeline
- **Problem**: In Windows 11, `Alt + Space` is intercepted by `SC_KEYMENU` (system menu), returning `ERROR_HOTKEY_ALREADY_REGISTERED` (1409). Low-level hooks (`WH_KEYBOARD_LL`) drop if callbacks exceed Windows timeout.
- **Solution**:
  - Hardware polling thread running `GetAsyncKeyState` at 120Hz (consuming $< 0.01\%$ CPU).
  - Complemented by official `RegisterHotKey` for alternative customizable shortcuts (`Ctrl + Space`, `Alt + O`, `Ctrl + Alt + Space`).
  - The input thread never blocks; upon detecting a trigger, it sends a lightweight message to the window management worker.

### Principle 4: Strict D: Drive Storage Isolation
- To satisfy user constraints and eliminate WebView2 `0x800700AA` locks:
  - WebView2 profile path is explicitly configured to `D:\Nihal\Winopie\.webview_data`.
  - Cargo target directory: `D:\Nihal\Winopie\target`.
  - PNPM global store: `D:\.pnpm-store`.
  - Rust toolchain: `D:\.cargo` and `D:\.rustup`.
