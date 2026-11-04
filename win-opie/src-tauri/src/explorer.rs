use std::path::Path;
use windows::core::Interface;
use windows::Win32::Foundation::MAX_PATH;
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoTaskMemFree, IServiceProvider, CLSCTX_ALL,
    COINIT_APARTMENTTHREADED,
};
use windows::Win32::System::DataExchange::{
    CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard,
};
use windows::Win32::System::Ole::CF_HDROP;
use windows::Win32::UI::Shell::{
    DragQueryFileW, HDROP, IFolderView, IShellBrowser, IShellItemArray,
    IShellWindows, ShellWindows, ShellWindowFindWindowOptions, ShellWindowTypeConstants,
    SID_STopLevelBrowser, SIGDN_FILESYSPATH, SVGIO_SELECTION, SWC_DESKTOP, SWFO_NEEDDISPATCH,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetAncestor, GetClassNameW, GetForegroundWindow, GA_ROOT,
};

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

/// Discovers selected files directly from Windows Explorer or Desktop via Shell COM interfaces.
/// Falls back to clipboard CF_HDROP only if COM selection is empty and window is an Explorer instance.
pub fn get_selected_explorer_files() -> Vec<String> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let fg_hwnd = GetForegroundWindow();
        if fg_hwnd.0.is_null() {
            return Vec::new();
        }

        let mut class_buf = [0u16; 256];
        let len = GetClassNameW(fg_hwnd, &mut class_buf);
        let class_name = String::from_utf16_lossy(&class_buf[..len as usize]);

        let is_desktop = class_name == "Progman" || class_name == "WorkerW";
        let is_folder_window = class_name == "CabinetWClass" || class_name == "ExploreWClass";

        if !is_desktop && !is_folder_window {
            return Vec::new();
        }

        let mut selected_files = Vec::new();

        // 1. Primary: Windows Shell COM Discovery
        if let Ok(shell_windows) = CoCreateInstance::<_, IShellWindows>(&ShellWindows, None, CLSCTX_ALL) {
            if is_desktop {
                // Desktop selection via FindWindowSW
                let null_var = windows::core::VARIANT::default();
                let mut phwnd = 0i32;
                if let Ok(disp) = shell_windows.FindWindowSW(
                    &null_var,
                    &null_var,
                    ShellWindowTypeConstants(SWC_DESKTOP.0),
                    &mut phwnd,
                    ShellWindowFindWindowOptions(SWFO_NEEDDISPATCH.0),
                ) {
                    if let Ok(sp) = disp.cast::<IServiceProvider>() {
                        if let Ok(browser) = sp.QueryService::<IShellBrowser>(&SID_STopLevelBrowser) {
                            if let Ok(view) = browser.QueryActiveShellView() {
                                if let Ok(folder_view) = view.cast::<IFolderView>() {
                                    extract_items_from_folder_view(&folder_view, &mut selected_files);
                                }
                            }
                        }
                    }
                }
            } else {
                // Active Explorer window selection
                let root_hwnd = GetAncestor(fg_hwnd, GA_ROOT);
                if let Ok(count) = shell_windows.Count() {
                    for i in 0..count {
                        let var_i = windows::core::VARIANT::from(i);
                        if let Ok(disp) = shell_windows.Item(&var_i) {
                            if let Ok(sp) = disp.cast::<IServiceProvider>() {
                                if let Ok(browser) = sp.QueryService::<IShellBrowser>(&SID_STopLevelBrowser) {
                                    // Verify that this shell window corresponds to the foreground window
                                    if let Ok(window_hwnd) = browser.cast::<windows::Win32::System::Ole::IOleWindow>() {
                                        if let Ok(win_handle) = window_hwnd.GetWindow() {
                                            if win_handle == fg_hwnd || win_handle == root_hwnd {
                                                if let Ok(view) = browser.QueryActiveShellView() {
                                                    if let Ok(folder_view) = view.cast::<IFolderView>() {
                                                        extract_items_from_folder_view(&folder_view, &mut selected_files);
                                                        if !selected_files.is_empty() {
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Strict Fallback: Clipboard CF_HDROP only if Shell COM returned nothing
        if selected_files.is_empty() && (is_folder_window || is_desktop) {
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
                                    selected_files.push(path_str);
                                }
                            }
                        }
                    }
                }
                let _ = CloseClipboard();
            }
        }

        selected_files
    }
}

unsafe fn extract_items_from_folder_view(folder_view: &IFolderView, out_files: &mut Vec<String>) {
    if let Ok(item_array) = folder_view.Items::<IShellItemArray>(windows::Win32::UI::Shell::_SVGIO(SVGIO_SELECTION.0 as i32)) {
        if let Ok(count) = item_array.GetCount() {
            for i in 0..count {
                if let Ok(item) = item_array.GetItemAt(i) {
                    if let Ok(pwstr) = item.GetDisplayName(SIGDN_FILESYSPATH) {
                        let path_str = pwstr.to_string().unwrap_or_default();
                        CoTaskMemFree(Some(pwstr.as_ptr() as _));
                        if !path_str.is_empty() && Path::new(&path_str).exists() {
                            out_files.push(path_str);
                        }
                    }
                }
            }
        }
    }
}
