use crate::metadata::{read_metadata, TrackMetadata};
use crate::playlist::{delete_playlist, load_playlists, save_playlist, Playlist};
use crate::scanner::{collect_audio_files, scan_directory, FsEntry};
use tauri::AppHandle;
use tauri::command;

#[command]
pub fn scan_dir(path: String) -> Result<Vec<FsEntry>, String> {
    scan_directory(&path)
}

#[command]
pub fn get_audio_files(path: String) -> Result<Vec<String>, String> {
    collect_audio_files(&path)
}

#[command]
pub fn get_metadata(path: String) -> Result<TrackMetadata, String> {
    read_metadata(&path)
}

#[command]
pub fn get_metadata_batch(paths: Vec<String>) -> Result<Vec<TrackMetadata>, String> {
    let mut results = Vec::with_capacity(paths.len());
    for path in paths {
        match read_metadata(&path) {
            Ok(meta) => results.push(meta),
            Err(e) => {
                log::warn!("Failed to read metadata for {}: {}", path, e);
                results.push(TrackMetadata {
                    path,
                    title: None,
                    artist: None,
                    album: None,
                    duration: 0.0,
                    track_number: None,
                });
            }
        }
    }
    Ok(results)
}

#[command]
pub fn get_playlists(app: AppHandle) -> Result<Vec<Playlist>, String> {
    load_playlists(&app)
}

#[command]
pub fn create_playlist(app: AppHandle, name: String) -> Result<Playlist, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let playlist = Playlist {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        tracks: Vec::new(),
        created_at: now.clone(),
        updated_at: now,
    };
    save_playlist(&app, &playlist)?;
    Ok(playlist)
}

#[command]
pub fn update_playlist(app: AppHandle, playlist: Playlist) -> Result<(), String> {
    let mut updated = playlist;
    updated.updated_at = chrono::Utc::now().to_rfc3339();
    save_playlist(&app, &updated)
}

#[command]
pub fn remove_playlist(app: AppHandle, id: String) -> Result<(), String> {
    delete_playlist(&app, &id)
}

#[cfg(target_os = "windows")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    let dir = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };
    // Use explorer /select, to highlight the file if it exists
    let arg = if path.is_file() {
        format!("/select,\"{}\"", path.to_string_lossy())
    } else {
        format!("\"{}\"", dir.to_string_lossy())
    };
    std::process::Command::new("explorer")
        .arg(&arg)
        .spawn()
        .map_err(|e| format!("Failed to open explorer: {}", e))?;
    Ok(())
}

#[cfg(target_os = "macos")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    let dir = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };
    std::process::Command::new("open")
        .arg(dir)
        .spawn()
        .map_err(|e| format!("Failed to open finder: {}", e))?;
    Ok(())
}

#[cfg(target_os = "linux")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    let dir = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };
    std::process::Command::new("xdg-open")
        .arg(dir)
        .spawn()
        .map_err(|e| format!("Failed to open file manager: {}", e))?;
    Ok(())
}

#[command]
pub fn write_tags(path: String, title: Option<String>, artist: Option<String>, album: Option<String>) -> Result<(), String> {
    crate::metadata::write_metadata(&path, title.as_deref(), artist.as_deref(), album.as_deref())
}