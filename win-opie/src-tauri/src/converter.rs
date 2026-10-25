use base64::Engine;
use image::ImageFormat;
use std::path::Path;
use std::process::Command;

pub fn find_ffmpeg() -> Option<String> {
    let candidate = r"C:\ProgramData\chocolatey\bin\ffmpeg.exe";
    if Path::new(candidate).exists() {
        return Some(candidate.to_string());
    }
    // Check path
    if Command::new("ffmpeg").arg("-version").output().is_ok() {
        return Some("ffmpeg".to_string());
    }
    None
}

pub fn convert_image(input_path: &str, target_ext: &str) -> Result<String, String> {
    let p = Path::new(input_path);
    if !p.exists() {
        return Err(format!("File not found: {}", input_path));
    }

    let parent = p.parent().unwrap_or_else(|| Path::new(""));
    let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("image");
    let ext_clean = target_ext.trim_start_matches('.').to_lowercase();
    let out_filename = format!("{}_converted.{}", stem, ext_clean);
    let out_path = parent.join(out_filename);

    let format = match ext_clean.as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        "ico" => ImageFormat::Ico,
        "bmp" => ImageFormat::Bmp,
        _ => return Err(format!("Unsupported format: {}", ext_clean)),
    };

    let img = image::open(p).map_err(|e| format!("Failed to open image: {e}"))?;
    img.save_with_format(&out_path, format)
        .map_err(|e| format!("Failed to save converted image: {e}"))?;

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
        _ => "image/png",
    };
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, encoded))
}

pub fn convert_media_with_ffmpeg(input_path: &str, mode: &str) -> Result<String, String> {
    let ffmpeg = find_ffmpeg().ok_or_else(|| "FFmpeg not found on system".to_string())?;
    let p = Path::new(input_path);
    if !p.exists() {
        return Err(format!("Input file not found: {}", input_path));
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

    let out_filename = format!("{}_{}_converted.{}", stem, mode, out_ext);
    let out_path = parent.join(out_filename);
    let out_str = out_path.to_string_lossy().to_string();

    let mut full_args = vec!["-y".to_string()];
    full_args.extend(args);
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
