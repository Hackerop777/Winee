use std::process::Command;
use windows::core::PCWSTR;
use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
use windows::Win32::Media::Audio::{eMultimedia, eRender, IMMDeviceEnumerator, MMDeviceEnumerator};
use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_LWIN, VK_V,
};
use windows::Win32::UI::Shell::ShellExecuteW;
use windows::Win32::UI::WindowsAndMessaging::SW_SHOW;

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

pub fn open_terminal() {
    let _ = Command::new("powershell.exe").spawn();
}

pub fn open_file_explorer() {
    let _ = Command::new("explorer.exe").spawn();
}

pub fn open_task_manager() {
    let _ = Command::new("taskmgr.exe").spawn();
}

pub fn lock_workstation() {
    let _ = Command::new("rundll32.exe").args(["user32.dll,LockWorkStation"]).spawn();
}
