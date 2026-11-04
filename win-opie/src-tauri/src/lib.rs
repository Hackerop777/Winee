pub mod converter;
pub mod explorer;
pub mod hooks;
pub mod media;
pub mod system;

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, WindowEvent};
use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
use winreg::RegKey;

static IS_PAUSED: AtomicBool = AtomicBool::new(false);

const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const APP_NAME: &str = "WinOpie";

pub fn is_autostart_enabled() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(key) = hkcu.open_subkey_with_flags(RUN_KEY, KEY_READ) {
        let val: Result<String, _> = key.get_value(APP_NAME);
        return val.is_ok();
    }
    false
}

#[tauri::command]
fn set_autostart(enable: bool) -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if enable {
        let key = hkcu
            .open_subkey_with_flags(RUN_KEY, KEY_WRITE)
            .map_err(|e| format!("Failed to open registry key: {e}"))?;
        let current_exe = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {e}"))?
            .to_string_lossy()
            .to_string();
        key.set_value(APP_NAME, &current_exe)
            .map_err(|e| format!("Failed to set registry value: {e}"))?;
        Ok(true)
    } else {
        if let Ok(key) = hkcu.open_subkey_with_flags(RUN_KEY, KEY_WRITE) {
            let _ = key.delete_value(APP_NAME);
        }
        Ok(false)
    }
}

#[tauri::command]
fn get_autostart() -> bool {
    is_autostart_enabled()
}

#[tauri::command]
fn set_shortcut_preference(shortcut: String) -> Result<(), String> {
    hooks::set_preferred_shortcut(shortcut);
    Ok(())
}

#[tauri::command]
fn get_shortcut_preference() -> String {
    hooks::get_preferred_shortcut()
}

#[tauri::command]
fn hide_window(window: tauri::WebviewWindow) {
    let _ = window.hide();
}

#[tauri::command]
async fn execute_radial_action(
    mode: String,
    index: usize,
    files: Vec<String>,
    action_id: Option<String>,
) -> Result<String, String> {
    if let Some(id) = action_id {
        match id.as_str() {
            "media_play_pause" => {
                media::toggle_play_pause();
                return Ok("Toggled Play/Pause".into());
            }
            "media_next" => {
                media::skip_next();
                return Ok("Skipped Next".into());
            }
            "media_prev" => {
                media::skip_previous();
                return Ok("Skipped Previous".into());
            }
            "screen_snip" => {
                system::trigger_screen_snip();
                return Ok("Triggered Screen Snip".into());
            }
            "quick_note" => {
                system::open_quick_note();
                return Ok("Opened Quick Note".into());
            }
            "system_mute" => {
                let muted = system::toggle_audio_mute()?;
                return Ok(format!("Audio Mute: {}", muted));
            }
            "clipboard" => {
                system::open_clipboard_history();
                return Ok("Opened Clipboard History".into());
            }
            "open_browser" => {
                system::open_default_browser();
                return Ok("Opened Browser".into());
            }
            "open_terminal" => {
                system::open_terminal();
                return Ok("Opened Terminal".into());
            }
            "open_explorer" => {
                system::open_file_explorer();
                return Ok("Opened File Explorer".into());
            }
            "task_manager" => {
                system::open_task_manager();
                return Ok("Opened Task Manager".into());
            }
            "lock_pc" => {
                system::lock_workstation();
                return Ok("Locked Workstation".into());
            }
            "settings" => {
                return Ok("Settings".into());
            }
            "none" => {
                return Ok("No-op".into());
            }
            _ => {}
        }
    }

    match mode.as_str() {
        "image" => {
            if files.is_empty() {
                return Err("No files selected".into());
            }
            let first_file = &files[0];
            match index {
                0 => converter::convert_image(first_file, "png"),
                1 => converter::convert_image(first_file, "jpg"),
                2 => converter::convert_image(first_file, "webp"),
                3 => converter::convert_image(first_file, "ico"),
                4 => converter::convert_image(first_file, "bmp"),
                5 => converter::get_image_data_url(first_file),
                6 => {
                    let p = std::path::Path::new(first_file);
                    if let Some(dir) = p.parent() {
                        let _ = std::process::Command::new("explorer.exe").arg(dir).spawn();
                    }
                    Ok("Revealed".into())
                }
                7 => {
                    system::trigger_screen_snip();
                    Ok("Snip triggered".into())
                }
                _ => Err("Invalid index".into()),
            }
        }
        "video" | "audio" => {
            if files.is_empty() {
                return Err("No files selected".into());
            }
            let first_file = &files[0];
            match index {
                0 => converter::convert_media_with_ffmpeg(first_file, "mp4"),
                1 => converter::convert_media_with_ffmpeg(first_file, "gif"),
                2 => converter::convert_media_with_ffmpeg(first_file, "mp3"),
                3 => converter::convert_media_with_ffmpeg(first_file, "720p"),
                4 => converter::convert_media_with_ffmpeg(first_file, "mute"),
                5 => {
                    let p = std::path::Path::new(first_file);
                    if let Some(dir) = p.parent() {
                        let _ = std::process::Command::new("explorer.exe").arg(dir).spawn();
                    }
                    Ok("Revealed".into())
                }
                6 => {
                    system::trigger_screen_snip();
                    Ok("Snip triggered".into())
                }
                7 => {
                    system::open_clipboard_history();
                    Ok("Clipboard opened".into())
                }
                _ => Err("Invalid index".into()),
            }
        }
        _ => {
            // Default Everyday Actions
            match index {
                0 => {
                    media::toggle_play_pause();
                    Ok("Toggled Play/Pause".into())
                }
                1 => {
                    media::skip_next();
                    Ok("Skipped Next".into())
                }
                2 => {
                    media::skip_previous();
                    Ok("Skipped Previous".into())
                }
                3 => {
                    system::trigger_screen_snip();
                    Ok("Triggered Screen Snip".into())
                }
                4 => {
                    system::open_quick_note();
                    Ok("Opened Quick Note".into())
                }
                5 => {
                    let muted = system::toggle_audio_mute()?;
                    Ok(format!("Audio Mute: {}", muted))
                }
                6 => {
                    system::open_clipboard_history();
                    Ok("Opened Clipboard History".into())
                }
                7 => {
                    // Settings
                    Ok("Settings".into())
                }
                _ => Err("Invalid index".into()),
            }
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // System Tray Menu with Full Actions & Preferences
            let tray_menu = Menu::with_items(
                app,
                &[
                    &MenuItem::with_id(app, "show", "Open Radial Wheel (Ctrl+Space / Alt+O)", true, None::<&str>)?,
                    &MenuItem::with_id(app, "settings", "Settings & Preferences...", true, None::<&str>)?,
                    &MenuItem::with_id(app, "status", "Status: Active (Widget Mode)", false, None::<&str>)?,
                    &MenuItem::with_id(app, "pause", "Pause Hook", true, None::<&str>)?,
                    &MenuItem::with_id(app, "autostart", "Launch on Windows Startup", true, None::<&str>)?,
                    &MenuItem::with_id(app, "quit", "Quit WINEE", true, None::<&str>)?,
                ],
            )?;

            // Load 32x32 icon bytes with fallback
            let icon_bytes = include_bytes!("../icons/32x32.png");
            let tray_icon = tauri::image::Image::from_bytes(icon_bytes)
                .unwrap_or_else(|_| app.default_window_icon().unwrap().clone());

            let tray = TrayIconBuilder::with_id("winee-tray")
                .icon(tray_icon)
                .tooltip("WINEE — Radial Productivity Wheel (Ctrl+Space / Alt+O)")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|_tray, event| match event {
                    TrayIconEvent::Click { button: MouseButton::Left, .. }
                    | TrayIconEvent::DoubleClick { button: MouseButton::Left, .. } => {
                        hooks::trigger_show_radial();
                    }
                    _ => {}
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        hooks::trigger_show_radial();
                    }
                    "settings" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = app.emit("open-settings", ());
                            let _ = win.unminimize();
                            let _ = win.show();
                            let _ = win.set_always_on_top(true);
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    "pause" => {
                        let prev = IS_PAUSED.fetch_xor(true, Ordering::SeqCst);
                        println!("Pause state toggled: {}", !prev);
                    }
                    "autostart" => {
                        let curr = is_autostart_enabled();
                        let _ = set_autostart(!curr);
                    }
                    _ => {}
                })
                .build(app)?;

            // Store tray in app state to prevent it from being dropped!
            app.manage(tray);

            // Ensure window starts completely hidden
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.hide();
            }

            // Start low-latency Win32 background input hook
            hooks::start_input_hook(app.handle().clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Prevent exit on Alt+F4 or window close, hide instead
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            execute_radial_action,
            set_autostart,
            get_autostart,
            set_shortcut_preference,
            get_shortcut_preference,
            hide_window
        ])
        .run(tauri::generate_context!())
        .expect("Error while running WinOpie");
}
