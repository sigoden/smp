use crate::logger::log_cmd_err;
use crate::metadata::TrackMetadata;
use crate::playlist::{Playlist, TrackEntry};
use crate::scanner::FsEntry;
use crate::settings::AppSettings;

use tauri::command;
use tauri::AppHandle;

#[command]
pub fn scan_directory(path: String) -> Result<Vec<FsEntry>, String> {
    log_cmd_err(
        crate::scanner::scan_directory(&path),
        format!("scan_directory({path})"),
    )
}

#[command]
pub fn collect_audio_files(path: String) -> Result<Vec<String>, String> {
    log_cmd_err(
        crate::scanner::collect_audio_files(&path),
        format!("collect_audio_files({path})"),
    )
}

#[command]
pub fn read_metadata(path: String) -> Result<TrackMetadata, String> {
    log_cmd_err(
        crate::metadata::read_metadata(&path),
        format!("read_metadata({path})"),
    )
}

#[command]
pub fn get_metadata_batch(paths: Vec<String>) -> Result<Vec<TrackMetadata>, String> {
    let mut results = Vec::with_capacity(paths.len());
    for path in paths {
        match crate::metadata::read_metadata(&path) {
            Ok(meta) => results.push(meta),
            Err(e) => {
                log::warn!(
                    "[command::get_metadata_batch] Failed to read metadata for {}: {}",
                    path,
                    e
                );
                results.push(TrackMetadata::default());
            }
        }
    }
    Ok(results)
}

#[command]
pub fn list_playlists(app: AppHandle) -> Result<Vec<Playlist>, String> {
    log_cmd_err(
        crate::playlist::list_playlists(&app),
        format!("list_playlists"),
    )
}

#[command]
pub fn load_playlist_tracks(app: AppHandle, name: String) -> Result<Vec<TrackEntry>, String> {
    log_cmd_err(
        crate::playlist::load_playlist_tracks(&app, &name),
        format!("load_playlist_tracks({name})"),
    )
}

#[command]
pub fn save_playlist(app: AppHandle, playlist: Playlist) -> Result<(), String> {
    log_cmd_err(
        crate::playlist::save_playlist(&app, &playlist),
        format!("save_playlist({})", playlist.name),
    )
}

#[command]
pub fn delete_playlist(app: AppHandle, name: String) -> Result<(), String> {
    log_cmd_err(
        crate::playlist::delete_playlist(&app, &name),
        format!("delete_playlist({name})"),
    )
}

#[command]
pub fn rename_playlist(app: AppHandle, old_name: String, new_name: String) -> Result<(), String> {
    log_cmd_err(
        crate::playlist::rename_playlist(&app, &old_name, &new_name),
        format!("rename_playlist({old_name}, {new_name})"),
    )
}

#[command]
pub fn load_settings(app: AppHandle) -> AppSettings {
    crate::settings::load_settings(&app)
}

#[command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    log_cmd_err(
        crate::settings::save_settings(&app, &settings),
        format!("save_settings"),
    )
}

#[cfg(target_os = "windows")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    log_cmd_err(
        (|| {
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
        })(),
        format!("open_in_explorer({path})"),
    )
}

#[cfg(target_os = "macos")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    log_cmd_err(
        (|| {
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
        })(),
        format!("open_in_explorer({path})"),
    )
}

#[cfg(target_os = "linux")]
#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    log_cmd_err(
        (|| {
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
        })(),
        format!("open_in_explorer({path})"),
    )
}

#[command]
pub fn open_playlists_dir(app: AppHandle) -> Result<(), String> {
    log_cmd_err(
        (|| {
            let playlists_dir = crate::playlist::playlists_dir(&app)?;
            open_in_explorer(playlists_dir.to_string_lossy().to_string())
        })(),
        format!("open_playlists_dir"),
    )
}
