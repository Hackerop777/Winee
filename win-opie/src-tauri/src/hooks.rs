use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use windows::Win32::Foundation::POINT;
use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, RegisterHotKey, UnregisterHotKey, HOT_KEY_MODIFIERS, MOD_ALT, MOD_CONTROL,
    MOD_NOREPEAT, VK_CONTROL, VK_MBUTTON, VK_MENU, VK_SPACE,
};
use windows::Win32::UI::WindowsAndMessaging::{
    DispatchMessageW, GetCursorPos, GetMessageW, TranslateMessage, MSG, WM_HOTKEY,
};

use crate::explorer::{get_selected_files_and_context, SelectionContext};
use crate::media::get_current_media_state;

static IS_TRIGGERED: AtomicBool = AtomicBool::new(false);
static SPAWN_POINT: Mutex<Option<(i32, i32)>> = Mutex::new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

#[derive(serde::Serialize, Clone, Debug)]
pub struct ShowPayload {
    pub origin_x: i32,
    pub origin_y: i32,
    pub monitor_left: i32,
    pub monitor_top: i32,
    pub monitor_width: i32,
    pub monitor_height: i32,
    pub mode: String,
    pub files: Vec<String>,
    pub media: crate::media::MediaState,
}

pub fn start_input_hook(app: AppHandle) {
    *APP_HANDLE.lock().unwrap() = Some(app);

    // 1. Thread 1: Register OS-level Windows Hotkeys (Ctrl+Space, Alt+O, Ctrl+Alt+Space)
    std::thread::spawn(|| unsafe {
        // RegisterHotKey IDs:
        // 10: Ctrl + Space (Primary)
        let _ = RegisterHotKey(None, 10, HOT_KEY_MODIFIERS(MOD_CONTROL.0 | MOD_NOREPEAT.0), VK_SPACE.0 as u32);
        // 11: Alt + O (O for Opie / WINEE)
        let _ = RegisterHotKey(None, 11, HOT_KEY_MODIFIERS(MOD_ALT.0 | MOD_NOREPEAT.0), b'O' as u32);
        // 12: Ctrl + Alt + Space
        let _ = RegisterHotKey(None, 12, HOT_KEY_MODIFIERS(MOD_CONTROL.0 | MOD_ALT.0 | MOD_NOREPEAT.0), VK_SPACE.0 as u32);

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            if msg.message == WM_HOTKEY {
                trigger_show_radial();
            }
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        let _ = UnregisterHotKey(None, 10);
        let _ = UnregisterHotKey(None, 11);
        let _ = UnregisterHotKey(None, 12);
    });

    // 2. Thread 2: Lightweight hardware input poller (~60Hz, negligible power widget mode)
    // Listens for Ctrl + Space, Alt + O, and Middle Mouse Button across any application
    std::thread::spawn(|| unsafe {
        // Query initial states before loop to prevent false trigger on launch
        let mut last_ctrl_space = ((GetAsyncKeyState(VK_CONTROL.0 as i32) as u16 & 0x8000) != 0)
            && ((GetAsyncKeyState(VK_SPACE.0 as i32) as u16 & 0x8000) != 0);
        let mut last_alt_o = ((GetAsyncKeyState(VK_MENU.0 as i32) as u16 & 0x8000) != 0)
            && ((GetAsyncKeyState(b'O' as i32) as u16 & 0x8000) != 0);
        let mut last_mbutton = (GetAsyncKeyState(VK_MBUTTON.0 as i32) as u16 & 0x8000) != 0;

        loop {
            let ctrl_down = (GetAsyncKeyState(VK_CONTROL.0 as i32) as u16 & 0x8000) != 0;
            let space_down = (GetAsyncKeyState(VK_SPACE.0 as i32) as u16 & 0x8000) != 0;
            let alt_down = (GetAsyncKeyState(VK_MENU.0 as i32) as u16 & 0x8000) != 0;
            let o_down = (GetAsyncKeyState(b'O' as i32) as u16 & 0x8000) != 0;
            let mbutton_down = (GetAsyncKeyState(VK_MBUTTON.0 as i32) as u16 & 0x8000) != 0;

            let is_ctrl_space = ctrl_down && space_down;
            let is_alt_o = alt_down && o_down;

            // Trigger on KeyDown
            if is_ctrl_space && !last_ctrl_space {
                if !IS_TRIGGERED.load(Ordering::SeqCst) {
                    trigger_show_radial();
                }
            } else if !ctrl_down && last_ctrl_space {
                // If Ctrl was released while holding
                if IS_TRIGGERED.load(Ordering::SeqCst) {
                    on_modifier_released();
                }
            }
            last_ctrl_space = is_ctrl_space;

            if is_alt_o && !last_alt_o {
                if !IS_TRIGGERED.load(Ordering::SeqCst) {
                    trigger_show_radial();
                }
            }
            last_alt_o = is_alt_o;

            // Middle Mouse Button toggle
            if mbutton_down && !last_mbutton {
                if IS_TRIGGERED.load(Ordering::SeqCst) {
                    trigger_hide_radial();
                } else {
                    trigger_show_radial();
                }
            }
            last_mbutton = mbutton_down;

            // Dynamic adaptive frequency:
            // When radial wheel is active, sample at high responsiveness (12ms / ~80Hz) to track release.
            // When idle, sleep 120ms (purely idle state, saving CPU cycles while RegisterHotKey handles instant key triggers).
            let is_active = IS_TRIGGERED.load(Ordering::SeqCst);
            let sleep_duration = if is_active {
                Duration::from_millis(12)
            } else {
                Duration::from_millis(120)
            };
            std::thread::sleep(sleep_duration);
        }
    });
}

pub fn trigger_show_radial() {
    let app_opt = APP_HANDLE.lock().unwrap().clone();
    if let Some(app) = app_opt {
        std::thread::spawn(move || unsafe {
            let mut pt = POINT::default();
            let _ = GetCursorPos(&mut pt);
            *SPAWN_POINT.lock().unwrap() = Some((pt.x, pt.y));

            // Query active monitor work area for multi-monitor DPI layout
            let monitor = MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST);
            let mut mi = MONITORINFO {
                cbSize: std::mem::size_of::<MONITORINFO>() as u32,
                ..Default::default()
            };
            let _ = GetMonitorInfoW(monitor, &mut mi);

            let (context, files) = get_selected_files_and_context();
            let mode = match context {
                SelectionContext::Image(_) => "image",
                SelectionContext::Video(_) => "video",
                SelectionContext::Audio(_) => "audio",
                SelectionContext::Default => "default",
            };

            let media_state = get_current_media_state();

            if let Some(win) = app.get_webview_window("main") {
                let payload = ShowPayload {
                    origin_x: pt.x,
                    origin_y: pt.y,
                    monitor_left: mi.rcWork.left,
                    monitor_top: mi.rcWork.top,
                    monitor_width: mi.rcWork.right - mi.rcWork.left,
                    monitor_height: mi.rcWork.bottom - mi.rcWork.top,
                    mode: mode.to_string(),
                    files,
                    media: media_state,
                };

                // Show window and ensure it's focused and on top
                let _ = win.unminimize();
                let _ = win.show();
                let _ = win.set_always_on_top(true);
                let _ = win.set_focus();

                let _ = app.emit("opie-show", payload);
                IS_TRIGGERED.store(true, Ordering::SeqCst);
            }
        });
    }
}

pub fn trigger_hide_radial() {
    let app_opt = APP_HANDLE.lock().unwrap().clone();
    if let Some(app) = app_opt {
        if let Some(win) = app.get_webview_window("main") {
            let _ = win.hide();
            IS_TRIGGERED.store(false, Ordering::SeqCst);
        }
    }
}

pub fn calculate_slice_index(dx: f64, dy: f64, total_slices: usize) -> usize {
    let mut theta = dy.atan2(dx);
    if theta < 0.0 {
        theta += 2.0 * std::f64::consts::PI;
    }
    let wedge_angle = 2.0 * std::f64::consts::PI / (total_slices as f64);
    (((theta + wedge_angle / 2.0) / wedge_angle).floor() as usize) % total_slices
}

pub fn is_in_deadzone(dx: f64, dy: f64, threshold: f64) -> bool {
    (dx * dx + dy * dy).sqrt() < threshold
}

fn on_modifier_released() {
    unsafe {
        let mut pt = POINT::default();
        let _ = GetCursorPos(&mut pt);

        let spawn = SPAWN_POINT.lock().unwrap().take();
        let app_opt = APP_HANDLE.lock().unwrap().clone();

        if let (Some((x0, y0)), Some(app)) = (spawn, app_opt) {
            let dx = (pt.x - x0) as f64;
            let dy = (pt.y - y0) as f64;

            // If cursor didn't move far (< 34px), leave it open in interactive toggle mode!
            if is_in_deadzone(dx, dy, 34.0) {
                return;
            }

            let index = calculate_slice_index(dx, dy, 8);
            let _ = app.emit("opie-dispatch", index);

            if let Some(win) = app.get_webview_window("main") {
                let _ = win.hide();
                IS_TRIGGERED.store(false, Ordering::SeqCst);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deadzone_boundary() {
        assert!(is_in_deadzone(0.0, 0.0, 34.0));
        assert!(is_in_deadzone(20.0, 20.0, 34.0)); // sqrt(800) = 28.28 < 34
        assert!(!is_in_deadzone(25.0, 25.0, 34.0)); // sqrt(1250) = 35.35 >= 34
        assert!(!is_in_deadzone(50.0, 0.0, 34.0));
    }

    #[test]
    fn test_polar_slice_indexing() {
        // Right -> Slice 0
        assert_eq!(calculate_slice_index(100.0, 0.0, 8), 0);
        // Bottom-Right -> Slice 1
        assert_eq!(calculate_slice_index(100.0, 100.0, 8), 1);
        // Down -> Slice 2
        assert_eq!(calculate_slice_index(0.0, 100.0, 8), 2);
        // Bottom-Left -> Slice 3
        assert_eq!(calculate_slice_index(-100.0, 100.0, 8), 3);
        // Left -> Slice 4
        assert_eq!(calculate_slice_index(-100.0, 0.0, 8), 4);
        // Top-Left -> Slice 5
        assert_eq!(calculate_slice_index(-100.0, -100.0, 8), 5);
        // Up -> Slice 6
        assert_eq!(calculate_slice_index(0.0, -100.0, 8), 6);
        // Top-Right -> Slice 7
        assert_eq!(calculate_slice_index(100.0, -100.0, 8), 7);
    }
}
