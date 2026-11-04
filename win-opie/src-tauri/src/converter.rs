use base64::Engine;
use image::ImageFormat;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Generates a conflict-free output file path.
/// If `flower_converted.png` already exists, generates `flower_converted_1.png`, `_2`, etc.
/// This prevents destructive, silent overwrites of user files.
pub fn generate_safe_output_path(parent: &Path, stem: &str, suffix: &str, ext: &str) -> PathBuf {
    let clean_ext = ext.trim_start_matches('.').to_lowercase();
    let base_name = if suffix.is_empty() {
        format!("{}_converted.{}", stem, clean_ext)
    } else {
        format!("{}_{}_converted.{}", stem, suffix, clean_ext)
    };

    let mut candidate = parent.join(&base_name);
    let mut counter = 1;
    while candidate.exists() {
        let new_name = if suffix.is_empty() {
            format!("{}_converted_{}.{}", stem, counter, clean_ext)
        } else {
            format!("{}_{}_converted_{}.{}", stem, suffix, counter, clean_ext)
        };
        candidate = parent.join(new_name);
        counter += 1;
    }
    candidate
}

pub fn find_ffmpeg() -> Option<String> {
    // 1. Check bundled or local app directory
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let local_ffmpeg = parent.join("ffmpeg.exe");
            if local_ffmpeg.exists() {
                return Some(local_ffmpeg.to_string_lossy().to_string());
            }
        }
    }

    // 2. Check standard chocolatey / winget / scoop locations
    let candidates = [
        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Tools\ffmpeg\bin\ffmpeg.exe",
    ];
    for candidate in &candidates {
        if Path::new(candidate).exists() {
            return Some(candidate.to_string());
        }
    }

    // 3. Check system PATH
    if Command::new("ffmpeg").arg("-version").output().is_ok() {
        return Some("ffmpeg".to_string());
    }

    None
}

pub fn convert_image(input_path: &str, target_ext: &str) -> Result<String, String> {
    let p = Path::new(input_path);
    if !p.exists() {
        return Err(format!("Input image not found: {}", input_path));
    }

    let parent = p.parent().unwrap_or_else(|| Path::new(""));
    let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("image");
    let ext_clean = target_ext.trim_start_matches('.').to_lowercase();

    // Use safe non-colliding file path generator
    let out_path = generate_safe_output_path(parent, stem, "", &ext_clean);

    let format = match ext_clean.as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        "ico" => ImageFormat::Ico,
        "bmp" => ImageFormat::Bmp,
        _ => return Err(format!("Unsupported image format: {}", ext_clean)),
    };

    let img = image::open(p).map_err(|e| format!("Failed to decode image: {e}"))?;
    img.save_with_format(&out_path, format)
        .map_err(|e| format!("Failed to encode and save converted image: {e}"))?;

    Ok(out_path.to_string_lossy().to_string())
}

pub fn get_image_data_url(input_path: &str) -> Result<String, String> {
    let bytes = std::fs::read(input_path).map_err(|e| format!("Read failed: {e}"))?;
    let ext = Path::new(input_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "bmp" => "image/bmp",
        _ => "image/png",
    };
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, encoded))
}

pub fn convert_media_with_ffmpeg(input_path: &str, mode: &str) -> Result<String, String> {
    let ffmpeg = find_ffmpeg().ok_or_else(|| {
        "FFmpeg is not installed or not found on PATH. Install FFmpeg (e.g. winget install Gyan.FFmpeg) to enable media conversions.".to_string()
    })?;
    let p = Path::new(input_path);
    if !p.exists() {
        return Err(format!("Input media file not found: {}", input_path));
    }
    let parent = p.parent().unwrap_or_else(|| Path::new(""));
    let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("media");

    let (out_ext, args): (&str, Vec<String>) = match mode {
        "mp3" => (
            "mp3",
            vec![
                "-i".into(), input_path.into(),
                "-vn".into(),
                "-c:a".into(), "libmp3lame".into(),
                "-q:a".into(), "2".into(),
            ],
        ),
        "gif" => (
            "gif",
            vec![
                "-i".into(), input_path.into(),
                "-vf".into(), "fps=12,scale=480:-1:flags=lanczos".into(),
            ],
        ),
        "720p" => (
            "mp4",
            vec![
                "-i".into(), input_path.into(),
                "-vf".into(), "scale=-2:720".into(),
                "-c:v".into(), "libx264".into(),
                "-crf".into(), "24".into(),
                "-preset".into(), "faster".into(),
            ],
        ),
        "mute" => (
            "mp4",
            vec![
                "-i".into(), input_path.into(),
                "-c:v".into(), "copy".into(),
                "-an".into(),
            ],
        ),
        _ => (
            "mp4",
            vec![
                "-i".into(), input_path.into(),
                "-c:v".into(), "libx264".into(),
                "-preset".into(), "faster".into(),
            ],
        ),
    };

    // Safe conflict-free output file path - never overwrite without asking!
    let out_path = generate_safe_output_path(parent, stem, mode, out_ext);
    let out_str = out_path.to_string_lossy().to_string();

    let mut full_args = args;
    full_args.push(out_str.clone());

    let status = Command::new(&ffmpeg)
        .args(&full_args)
        .status()
        .map_err(|e| format!("FFmpeg execution failed: {e}"))?;

    if status.success() {
        Ok(out_str)
    } else {
        Err(format!("FFmpeg failed with exit code: {:?}", status.code()))
    }
}
