#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use windows::core::w;
use windows::Win32::Foundation::GetLastError;
use windows::Win32::Foundation::ERROR_ALREADY_EXISTS;
use windows::Win32::System::Threading::CreateMutexW;

fn main() {
    // 1. Configure clean isolated WebView2 profile
    if std::env::var("WEBVIEW2_USER_DATA_FOLDER").is_err() {
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let data_dir = std::path::Path::new(&local_app_data)
                .join("WINEE")
                .join("webview_data");
            let _ = std::fs::create_dir_all(&data_dir);
            std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", data_dir);
        } else {
            std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", r"D:\Nihal\Winopie\.webview_data");
        }
    }

    // 2. Windows Named Mutex for single-instance protection
    unsafe {
        let _mutex = CreateMutexW(None, true, w!("Local\\WINEE_SingleInstance_Mutex"));
        if GetLastError() == ERROR_ALREADY_EXISTS {
            eprintln!("WINEE instance already running. Exiting duplicate.");
            return;
        }
    }

    win_opie_lib::run();
}
