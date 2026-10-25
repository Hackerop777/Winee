use std::path::Path;
use windows::Win32::Foundation::MAX_PATH;
use windows::Win32::System::DataExchange::{
    CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard,
};
use windows::Win32::System::Ole::CF_HDROP;
use windows::Win32::UI::Shell::{DragQueryFileW, HDROP};
use windows::Win32::UI::WindowsAndMessaging::{GetClassNameW, GetForegroundWindow};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SelectionContext {
    Default,
    Image(Vec<String>),
    Video(Vec<String>),
    Audio(Vec<String>),
}

pub fn get_selected_files_and_context() -> (SelectionContext, Vec<String>) {
    let files = get_selected_explorer_files();
    if files.is_empty() {
        return (SelectionContext::Default, files);
    }

    if let Some(first) = files.first() {
        let path = Path::new(first);
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            let ext_lower = ext.to_lowercase();
            match ext_lower.as_str() {
                "png" | "jpg" | "jpeg" | "webp" | "heic" | "bmp" | "avif" | "ico" => {
                    return (SelectionContext::Image(files.clone()), files);
                }
                "mp4" | "mov" | "mkv" | "webm" | "avi" => {
                    return (SelectionContext::Video(files.clone()), files);
                }
                "mp3" | "wav" | "flac" | "aac" | "m4a" | "ogg" => {
                    return (SelectionContext::Audio(files.clone()), files);
                }
                _ => {}
            }
        }
    }

    (SelectionContext::Default, files)
}

pub fn get_selected_explorer_files() -> Vec<String> {
    unsafe {
        let mut files = Vec::new();
        let fg_hwnd = GetForegroundWindow();
        if fg_hwnd.0.is_null() {
            return files;
        }

        let mut class_buf = [0u16; 256];
        let len = GetClassNameW(fg_hwnd, &mut class_buf);
        let class_name = String::from_utf16_lossy(&class_buf[..len as usize]);

        let is_explorer = class_name == "CabinetWClass" || class_name == "ExploreWClass"
            || class_name == "Progman" || class_name == "WorkerW";

        if !is_explorer {
            return files;
        }

        // Try clipboard CF_HDROP if available
        if OpenClipboard(None).is_ok() {
            if IsClipboardFormatAvailable(CF_HDROP.0.into()).is_ok() {
                if let Ok(handle) = GetClipboardData(CF_HDROP.0.into()) {
                    let hdrop = HDROP(handle.0 as *mut _);
                    let file_count = DragQueryFileW(hdrop, 0xFFFFFFFF, None);
                    for i in 0..file_count {
                        let mut buf = [0u16; MAX_PATH as usize];
                        let written = DragQueryFileW(hdrop, i, Some(&mut buf));
                        if written > 0 {
                            let path_str = String::from_utf16_lossy(&buf[..written as usize]);
                            if Path::new(&path_str).exists() {
                                files.push(path_str);
                            }
                        }
                    }
                }
            }
            let _ = CloseClipboard();
        }

        files
    }
}
