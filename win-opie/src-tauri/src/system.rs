use std::process::Command;
use windows::core::PCWSTR;
use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
use windows::Win32::Media::Audio::{eMultimedia, eRender, IMMDeviceEnumerator, MMDeviceEnumerator};
use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_LWIN, VK_V,
};
use windows::Win32::UI::Shell::ShellExecuteW;
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetClassNameW, GetWindowTextW, IsWindowVisible, SetForegroundWindow, ShowWindow,
    SW_RESTORE, SW_SHOW,
};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct BrowserTabInfo {
    pub hwnd: isize,
    pub title: String,
    pub browser: String,
}

pub fn trigger_screen_snip() {
    let wide_uri: Vec<u16> = "ms-screenclip:\0".encode_utf16().collect();
    let wide_open: Vec<u16> = "open\0".encode_utf16().collect();
    unsafe {
        ShellExecuteW(
            None,
            PCWSTR(wide_open.as_ptr()),
            PCWSTR(wide_uri.as_ptr()),
            PCWSTR::null(),
            PCWSTR::null(),
            SW_SHOW,
        );
    }
}

/// Native Windows Copilot activation using Win+C keyboard simulation
pub fn trigger_copilot() {
    unsafe {
        let vk_c = windows::Win32::UI::Input::KeyboardAndMouse::VIRTUAL_KEY(0x43);
        let inputs = [
            // Win key down
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_LWIN,
                        wScan: 0,
                        dwFlags: Default::default(),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // C key down
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: vk_c,
                        wScan: 0,
                        dwFlags: Default::default(),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // C key up
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: vk_c,
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // Win key up
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_LWIN,
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
        ];

        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

pub fn open_clipboard_history() {
    unsafe {
        let inputs = [
            // Win key down
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_LWIN,
                        wScan: 0,
                        dwFlags: Default::default(),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // V key down
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_V,
                        wScan: 0,
                        dwFlags: Default::default(),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // V key up
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_V,
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // Win key up
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_LWIN,
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
        ];

        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

pub fn toggle_audio_mute() -> Result<bool, String> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let device_enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
                .map_err(|e| format!("Failed to create device enumerator: {e}"))?;

        let default_device = device_enumerator
            .GetDefaultAudioEndpoint(eRender, eMultimedia)
            .map_err(|e| format!("Failed to get default audio endpoint: {e}"))?;

        let endpoint_volume: IAudioEndpointVolume = default_device
            .Activate(CLSCTX_ALL, None)
            .map_err(|e| format!("Failed to activate audio endpoint volume: {e}"))?;

        let current_mute = endpoint_volume
            .GetMute()
            .map_err(|e| format!("Failed to query mute state: {e}"))?;

        let new_mute = !current_mute.as_bool();
        endpoint_volume
            .SetMute(new_mute, std::ptr::null())
            .map_err(|e| format!("Failed to set mute state: {e}"))?;

        Ok(new_mute)
    }
}

pub fn open_quick_note() {
    let _ = Command::new("notepad.exe").spawn();
}

pub fn open_default_browser() {
    let _ = Command::new("cmd").args(["/c", "start", "https://"]).spawn();
}

pub fn open_browser_new_tab() {
    let _ = Command::new("cmd").args(["/c", "start", "https://"]).spawn();
}

pub fn open_browser_new_window() {
    // Try launching Microsoft Edge or Chrome in new window
    let res = Command::new("cmd").args(["/c", "start", "msedge", "--new-window"]).spawn();
    if res.is_err() {
        let _ = Command::new("cmd").args(["/c", "start", "chrome", "--new-window"]).spawn();
    }
}

pub fn open_terminal() {
    let _ = Command::new("powershell.exe").spawn();
}

pub fn open_file_explorer() {
    let _ = Command::new("explorer.exe").spawn();
}

/// Opens a specific target folder or resolves known Windows paths
pub fn open_directory(target_path: &str) {
    let user_profile = std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\Users".into());
    let resolved = match target_path.trim().to_lowercase().as_str() {
        "desktop" => format!("{}\\Desktop", user_profile),
        "downloads" => format!("{}\\Downloads", user_profile),
        "documents" => format!("{}\\Documents", user_profile),
        "pictures" => format!("{}\\Pictures", user_profile),
        "videos" => format!("{}\\Videos", user_profile),
        "music" => format!("{}\\Music", user_profile),
        "" | "home" => user_profile,
        _other => target_path.trim().to_string(),
    };

    let _ = Command::new("explorer.exe").arg(&resolved).spawn();
}

/// Launches a user-customized URL, file, folder, or application
pub fn launch_custom(target: &str) {
    let t = target.trim();
    if t.is_empty() {
        return;
    }

    if t.starts_with("http://") || t.starts_with("https://") {
        let _ = Command::new("cmd").args(["/c", "start", "", t]).spawn();
    } else if std::path::Path::new(t).is_dir() {
        open_directory(t);
    } else {
        let _ = Command::new("cmd").args(["/c", "start", "", t]).spawn();
    }
}

pub fn open_task_manager() {
    let _ = Command::new("taskmgr.exe").spawn();
}

pub fn lock_workstation() {
    let _ = Command::new("rundll32.exe").args(["user32.dll,LockWorkStation"]).spawn();
}

// Window enumeration callback for active browser tabs
unsafe extern "system" fn enum_browser_windows_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    if !IsWindowVisible(hwnd).as_bool() {
        return BOOL(1);
    }

    let mut class_buf = [0u16; 256];
    let class_len = GetClassNameW(hwnd, &mut class_buf);
    let class_name = String::from_utf16_lossy(&class_buf[..class_len as usize]);

    let mut title_buf = [0u16; 512];
    let title_len = GetWindowTextW(hwnd, &mut title_buf);
    if title_len == 0 {
        return BOOL(1);
    }
    let title = String::from_utf16_lossy(&title_buf[..title_len as usize]);

    let mut browser_type: Option<&'static str> = None;

    if class_name.contains("Chrome_WidgetWin_1") {
        if title.contains("Google Chrome") {
            browser_type = Some("Chrome");
        } else if title.contains("Microsoft​ Edge") || title.contains("Edge") {
            browser_type = Some("Edge");
        } else if title.contains("Brave") {
            browser_type = Some("Brave");
        }
    } else if class_name.contains("MozillaWindowClass") || title.contains("Firefox") {
        browser_type = Some("Firefox");
    }

    if let Some(browser) = browser_type {
        let tabs = &mut *(lparam.0 as *mut Vec<BrowserTabInfo>);
        let clean_title = title
            .replace(" - Google Chrome", "")
            .replace(" - Microsoft​ Edge", "")
            .replace(" and 1 more page - Personal - Microsoft​ Edge", "")
            .replace(" and 2 more pages - Personal - Microsoft​ Edge", "")
            .replace(" - Brave", "")
            .replace(" — Mozilla Firefox", "")
            .trim()
            .to_string();

        if !clean_title.is_empty() {
            tabs.push(BrowserTabInfo {
                hwnd: hwnd.0 as isize,
                title: clean_title,
                browser: browser.to_string(),
            });
        }
    }

    BOOL(1)
}

pub fn get_open_browser_tabs() -> Vec<BrowserTabInfo> {
    let mut tabs: Vec<BrowserTabInfo> = Vec::new();
    unsafe {
        let _ = EnumWindows(
            Some(enum_browser_windows_callback),
            LPARAM(&mut tabs as *mut _ as isize),
        );
    }
    tabs
}

pub fn focus_browser_window(hwnd_val: isize) {
    unsafe {
        let hwnd = HWND(hwnd_val as *mut _);
        let _ = ShowWindow(hwnd, SW_RESTORE);
        let _ = SetForegroundWindow(hwnd);
    }
}
