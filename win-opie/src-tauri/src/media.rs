use base64::Engine;
use serde::{Deserialize, Serialize};
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
};
use windows::Storage::Streams::{DataReader, InputStreamOptions};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaState {
    pub is_available: bool,
    pub title: String,
    pub artist: String,
    pub album_title: String,
    pub is_playing: bool,
    pub thumbnail_base64: Option<String>,
}

impl Default for MediaState {
    fn default() -> Self {
        Self {
            is_available: false,
            title: "No Media Playing".into(),
            artist: "Idle".into(),
            album_title: "".into(),
            is_playing: false,
            thumbnail_base64: None,
        }
    }
}

pub fn get_current_media_state() -> MediaState {
    let _ = unsafe { windows::Win32::System::Com::CoInitializeEx(None, windows::Win32::System::Com::COINIT_MULTITHREADED) };
    let result = (|| -> windows::core::Result<MediaState> {
        let async_op = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()?;
        let manager = async_op.get()?;
        let session = match manager.GetCurrentSession() {
            Ok(s) => s,
            Err(_) => return Ok(MediaState::default()),
        };

        let playback_info = session.GetPlaybackInfo()?;
        let is_playing = playback_info.PlaybackStatus()?
            == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing;

        let media_props = session.TryGetMediaPropertiesAsync()?.get()?;
        let title = media_props.Title()?.to_string();
        let artist = media_props.Artist()?.to_string();
        let album_title = media_props.AlbumTitle()?.to_string();

        let mut thumbnail_base64 = None;
        if let Ok(thumb_ref) = media_props.Thumbnail() {
            if let Ok(stream) = thumb_ref.OpenReadAsync()?.get() {
                let size = stream.Size()? as usize;
                if size > 0 && size < 10_000_000 {
                    let reader = DataReader::CreateDataReader(&stream)?;
                    reader.SetInputStreamOptions(InputStreamOptions::None)?;
                    reader.LoadAsync(size as u32)?.get()?;
                    let mut buffer = vec![0u8; size];
                    reader.ReadBytes(&mut buffer)?;
                    let encoded = base64::engine::general_purpose::STANDARD.encode(&buffer);
                    thumbnail_base64 = Some(format!("data:image/jpeg;base64,{}", encoded));
                }
            }
        }

        Ok(MediaState {
            is_available: true,
            title: if title.is_empty() { "Unknown Title".into() } else { title },
            artist: if artist.is_empty() { "Unknown Artist".into() } else { artist },
            album_title,
            is_playing,
            thumbnail_base64,
        })
    })();

    result.unwrap_or_default()
}

pub fn toggle_play_pause() -> bool {
    let op = (|| -> windows::core::Result<bool> {
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()?.get()?;
        let session = manager.GetCurrentSession()?;
        session.TryTogglePlayPauseAsync()?.get()
    })();
    op.unwrap_or(false)
}

pub fn skip_next() -> bool {
    let op = (|| -> windows::core::Result<bool> {
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()?.get()?;
        let session = manager.GetCurrentSession()?;
        session.TrySkipNextAsync()?.get()
    })();
    op.unwrap_or(false)
}

pub fn skip_previous() -> bool {
    let op = (|| -> windows::core::Result<bool> {
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()?.get()?;
        let session = manager.GetCurrentSession()?;
        session.TrySkipPreviousAsync()?.get()
    })();
    op.unwrap_or(false)
}
