# WINEE — Product & Engineering Roadmap

## Phase 0: Audit & Foundation (Completed)
- [x] Comprehensive codebase inspection and gap analysis.
- [x] Identified root-cause startup crash (`0x800700AA` WebView2 data folder lock).
- [x] Audited Win32 `Alt + Space` system conflict and `RegisterHotKey` limitations.
- [x] Produced architectural blueprints, status matrix, PRD, and implementation roadmap.

---

## Phase 1: Reliable Radial Interaction MVP (Current Objective)
*Goal: A bulletproof, crash-resistant radial menu that reliably appears on shortcut press, tracks the cursor, and executes/cancels with fluid motion physics.*

- [ ] **Milestone 1.1 — Process Integrity & WebView2 Isolation**:
  - Enforce `WEBVIEW2_USER_DATA_FOLDER = "D:\Nihal\Winopie\.webview_data"` directly inside Rust `main.rs` before Tauri runtime initializes.
  - Implement Windows Named Mutex (`Local\Winee_SingleInstance`) to prevent duplicate instances and eliminate file locks.
- [ ] **Milestone 1.2 — Multi-Channel Input Activation**:
  - Support `Alt + Space`, `Ctrl + Space`, `Alt + O`, and Middle Mouse Button.
  - Make activation non-blocking (push to async channel).
- [ ] **Milestone 1.3 — Robust Cursor & Multi-Monitor Positioning**:
  - Query active monitor via `MonitorFromPoint` and translate unscaled screen coordinates to local viewport CSS coordinates accounting for `devicePixelRatio`.
  - Clamp coordinates to keep the 320px wheel completely inside the monitor work area.
- [ ] **Milestone 1.4 — Hold / Tap State Machine & Cancellation**:
  - Support both Hold-and-Flick and Tap-to-Toggle modes.
  - Cancel on deadzone release ($r < 34\text{px}$), Escape key, or backdrop click.
  - Execute on wedge release ($r \ge 34\text{px}$) or slice click.
- [ ] **Milestone 1.5 — Verification Suite**:
  - Add automated unit tests for polar angle mapping, deadzone boundary checks, and slice indexing.

---

## Phase 2: Native Everyday Actions & Settings
*Goal: Native Windows 11 action triggers and a dedicated configuration interface.*

- [ ] **Milestone 2.1 — System Action Triggers**:
  - Screen Snip (`ms-screenclip:`).
  - Master System Mute via CoreAudio `IAudioEndpointVolume`.
  - Clipboard History invocation via `SendInput` (`Win + V`).
  - Scratchpad / Quick Note.
- [ ] **Milestone 2.2 — Windows Media Integration**:
  - WinRT `GlobalSystemMediaTransportControlsSessionManager` integration in non-blocking worker thread.
  - Real-time equalizer bars and thumbnail display.
- [ ] **Milestone 2.3 — Settings Interface**:
  - User-configurable activation shortcuts.
  - Toggle sound cues, vibration, and spring damping factors.
  - Toggle Windows Registry boot autostart (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`).

---

## Phase 3: Context-Aware File Conversion
*Goal: Intelligent radial adaptation when files are selected in Explorer.*

- [ ] **Milestone 3.1 — Explorer Shell Selection Discovery**:
  - COM `IShellWindows` extraction without modifying the system clipboard.
  - Multi-file type classifier (Images vs Videos vs Audio).
- [ ] **Milestone 3.2 — Native Image Processing**:
  - Fast background conversion (`-> PNG`, `-> JPG`, `-> WEBP`, `-> ICO`, `-> BMP`, `Data URL`) using embedded Rust `image` crate.
- [ ] **Milestone 3.3 — Headless FFmpeg Worker**:
  - Bundled portable FFmpeg for video compression, audio extraction (MP3), and GIF generation.
  - Background progress notification and collision-safe naming (`<name>_converted.<ext>`).

---

## Phase 4: Quality, Packaging & Benchmarking
*Goal: Enterprise-grade Windows packaging and validated performance.*

- [ ] **Milestone 4.1 — Clean Packaging**:
  - MSI / NSIS installer and uninstaller configured strictly for D: drive.
  - Icon asset verification and application manifests.
- [ ] **Milestone 4.2 — Performance Benchmarks**:
  - Verify **0.0% idle CPU and 0.0% idle GPU** in Windows Task Manager.
  - Latency profiling from shortcut press to first rendered frame ($< 16\text{ms}$).
