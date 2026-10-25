# WINEE — Product Requirements Document (PRD)

## 1. Product Vision & Value Proposition

**WINEE** is an ultra-fast, fluid radial utility for Windows 11. Designed to match the elegance of macOS Opie, WINEE transforms everyday repetitive desktop actions into effortless, muscle-memory flicks of the mouse.

### Target Performance Targets
- **Idle Resource Footprint**: 0.0% CPU and 0.0% GPU when closed.
- **Trigger Latency**: Under 16ms from physical keypress to first rendered frame.
- **Memory Footprint**: Under 50MB RAM during active overlay display; under 25MB when idle.
- **Storage Constraint**: Strictly isolated to the `D:` drive (zero consumption of `C:`).

---

## 2. Interaction Specifications

### A. The Hold & Flick Gesture
- **Default Shortcuts**:
  - `Alt + Space` (Hold or Tap)
  - `Ctrl + Space` (Fast secondary toggle)
  - `Alt + O` (Opie mnemonic trigger)
  - Middle Mouse Button (Wheel press)
- **Activation Behavior**:
  1. Spawns instantly centered at cursor $(x_0, y_0)$.
  2. Window appears via `SW_SHOW` with `alwaysOnTop: true` and active keyboard/mouse capture.
  3. Slices expand from scale $0 \to 1.04 \to 1.00$ using a damped harmonic spring ($k=420, c=26, m=0.8$).
  4. Original pop audio cue (`focus-wood.wav`) plays through pre-cached Web Audio API buffers.
- **Polar Angle & Deadzone Partitioning**:
  $$\Delta x = x - x_0, \quad \Delta y = y - y_0, \quad r = \sqrt{\Delta x^2 + \Delta y^2}$$
  - **Deadzone ($r < 34\text{px}$)**: Neutral state. Center hub displays abort icon / media status.
  - **Active Zone ($r \ge 34\text{px}$)**: Divided into 8 equal wedges ($\Delta\theta = \frac{\pi}{4}$):
    $$\theta = \operatorname{atan2}(\Delta y, \Delta x) \pmod{2\pi}, \quad \text{index} = \left\lfloor \frac{\theta + \frac{\pi}{8}}{\frac{\pi}{4}} \right\rfloor \pmod 8$$
  - Hovering a new wedge scales it by $1.07\times$, illuminates with specular cyan glow, and plays `ring-switch.wav`.
- **Termination & Execution**:
  - **Releasing inside deadzone ($r < 34\text{px}$)** or pressing **Escape**: Cancels gesture, plays `button-release.wav`, hides window.
  - **Releasing on a wedge ($r \ge 34\text{px}$)** or **clicking a slice**: Dispatches indexed action immediately, plays `button-press.wav`, hides window.

---

## 3. Functional Modules

### Module 1: Everyday Radial Wheel (Default State)
- Slice 0: Media Play / Pause (WinRT active session toggle)
- Slice 1: Next Track
- Slice 2: Previous Track
- Slice 3: Screen Snip (`ms-screenclip:`)
- Slice 4: Quick Note (Notepad overlay)
- Slice 5: Master Audio Mute (CoreAudio endpoint volume toggle)
- Slice 6: Clipboard History (`Win + V`)
- Slice 7: Settings / Preferences

### Module 2: Context-Aware File Convert (Explorer State)
- **Trigger**: When files are selected in Windows File Explorer or Desktop.
- **Images (`.png`, `.jpg`, `.webp`, `.ico`, `.bmp`)**:
  - Slices: `-> PNG`, `-> JPG`, `-> WEBP`, `-> ICO`, `-> BMP`, `Data URL`, `Reveal`, `Screen Snip`.
  - Processed using embedded Rust `image` crate. Output: `<filename>_converted.<ext>`.
- **Videos / Audio (`.mp4`, `.mov`, `.mkv`, `.webm`, `.mp3`)**:
  - Slices: `-> MP4`, `-> GIF`, `-> MP3`, `720p`, `Mute Audio`, `Reveal`, `Screen Snip`, `Clipboard`.
  - Processed using headless FFmpeg.

### Module 3: Media Center Hub
- Center circular hub ($r \le 34\text{px}$).
- Displays album art thumbnail with dark vignette, marquee scrolling title & artist, and real-time animated equalizer bars.
- Acts as a clear visual safe-cancel zone.

---

## 4. Non-Functional & Reliability Requirements

1. **Crash Prevention**:
   - Single-instance Named Mutex (`Local\Winee_SingleInstance_Mutex`) prevents multiple processes from locking WebView2 resources.
   - `WEBVIEW2_USER_DATA_FOLDER` forced to `D:\Nihal\Winopie\.webview_data`.
2. **Display Topology**:
   - Dynamic monitor boundary detection (`MonitorFromPoint`) ensures the wheel never draws off-screen on multi-monitor setups or high-DPI scaling (125%/150%).
3. **Graceful Degradation**:
   - If WinRT media queries or COM Shell queries fail or timeout, default everyday actions render immediately without latency penalties.
