use crate::metadata::TrackMetadata;
use crate::playlist::{Playlist, TrackEntry};
use crate::scanner::FsEntry;
use crate::settings::AppSettings;
use tauri::AppHandle;
use tauri::command;

#[command]
pub fn scan_directory(path: String) -> Result<Vec<FsEntry>, String> {
    log::info!("scan_directory: {}", path);
    crate::scanner::scan_directory(&path)
}

#[command]
pub fn collect_audio_files(path: String) -> Result<Vec<String>, String> {
    log::info!("collect_audio_files: {}", path);
    crate::scanner::collect_audio_files(&path)
}

#[command]
pub fn read_metadata(path: String) -> Result<TrackMetadata, String> {
    log::info!("read_metadata: {}", path);
    crate::metadata::read_metadata(&path)
}

#[command]
pub fn get_metadata_batch(paths: Vec<String>) -> Result<Vec<TrackMetadata>, String> {
    log::info!("get_metadata_batch: {} files", paths.len());
    let mut results = Vec::with_capacity(paths.len());
    for path in paths {
        match crate::metadata::read_metadata(&path) {
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
pub fn list_playlists(app: AppHandle) -> Result<Vec<Playlist>, String> {
    log::info!("list_playlists");
    crate::playlist::list_playlists(&app)
}

#[command]
pub fn load_playlist_tracks(app: AppHandle, name: String) -> Result<Vec<TrackEntry>, String> {
    log::info!("load_playlist_tracks: {}", name);
    crate::playlist::load_playlist_tracks(&app, &name)
}

#[command]
pub fn save_playlist(app: AppHandle, playlist: Playlist) -> Result<(), String> {
    log::info!("save_playlist: {}", playlist.name);
    crate::playlist::save_playlist(&app, &playlist)
}

#[command]
pub fn delete_playlist(app: AppHandle, name: String) -> Result<(), String> {
    log::info!("delete_playlist: {}", name);
    crate::playlist::delete_playlist(&app, &name)
}

#[command]
pub fn rename_playlist(app: AppHandle, old_name: String, new_name: String) -> Result<(), String> {
    log::info!("rename_playlist: {} -> {}", old_name, new_name);
    crate::playlist::rename_playlist(&app, &old_name, &new_name)
}

#[command]
pub fn load_settings(app: AppHandle) -> AppSettings {
    log::info!("load_settings");
    crate::settings::load_settings(&app)
}

#[command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    log::info!("save_settings");
    crate::settings::save_settings(&app, &settings)
}

#[cfg(target_os = "windows")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    log::info!("open_in_explorer: {}", path);
    let path = std::path::Path::new(&path);
    let dir = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };
    let arg = if path.is_file() {
        format!("/select,{}", path.to_string_lossy())
    } else {
        dir.to_string_lossy().to_string()
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
    log::info!("open_in_explorer: {}", path);
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
    log::info!("open_in_explorer: {}", path);
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
pub fn open_playlists_dir(app: AppHandle) -> Result<(), String> {
    log::info!("open_playlists_dir");
    let playlists_dir = crate::playlist::playlists_dir(&app)?;
    open_in_explorer(playlists_dir.to_string_lossy().to_string())
}


#[command]
pub fn write_metadata(path: String, title: Option<String>, artist: Option<String>, album: Option<String>) -> Result<(), String> {
    log::info!("write_metadata: {}", path);
    crate::metadata::write_metadata(&path, title.as_deref(), artist.as_deref(), album.as_deref())
}