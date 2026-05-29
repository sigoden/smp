use crate::logger::log_cmd_err;
use crate::metadata::TrackMetadata;
use crate::persisted_state::PersistedState;
use crate::playlist::{Playlist, TrackEntry};
use crate::scanner::FsEntry;

use rayon::prelude::*;
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
    let results: Vec<TrackMetadata> = paths
        .par_iter()
        .map(|path| match crate::metadata::read_metadata(path) {
            Ok(meta) => meta,
            Err(e) => {
                log::warn!(
                    "[command::get_metadata_batch] Failed to read metadata for {}: {}",
                    path,
                    e
                );
                TrackMetadata::default()
            }
        })
        .collect();
    Ok(results)
}

#[command]
pub fn list_playlists(app: AppHandle) -> Result<Vec<Playlist>, String> {
    log_cmd_err(
        crate::playlist::list_playlists(&app),
        "list_playlists".to_string(),
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
pub fn load_persisted_state(app: AppHandle) -> PersistedState {
    crate::persisted_state::load_persisted_state(&app)
}

#[command]
pub fn save_persisted_state(app: AppHandle, state: PersistedState) -> Result<(), String> {
    log_cmd_err(
        crate::persisted_state::save_persisted_state(&app, &state),
        "save_persisted_state".to_string(),
    )
}

/// Resolve the target directory and whether the original path was a file.
/// Shared by all platform-specific `reveal_in_file_manager` implementations.
fn resolve_reveal_target(path: &str) -> (std::path::PathBuf, bool) {
    let p = std::path::Path::new(path);
    let is_file = p.is_file();
    let dir = if is_file {
        p.parent()
            .map(|d| d.to_path_buf())
            .unwrap_or_else(|| p.to_path_buf())
    } else {
        p.to_path_buf()
    };
    (dir, is_file)
}

#[cfg(target_os = "windows")]
#[command]
pub fn reveal_in_file_manager(path: String) -> Result<(), String> {
    log_cmd_err(
        (|| {
            let (dir, is_file) = resolve_reveal_target(&path);
            let arg = if is_file {
                format!("/select,{}", path)
            } else {
                dir.to_string_lossy().to_string()
            };
            std::process::Command::new("explorer")
                .arg(&arg)
                .spawn()
                .map_err(|e| format!("Failed to open explorer: {}", e))?;
            Ok(())
        })(),
        format!("reveal_in_file_manager({path})"),
    )
}

#[cfg(target_os = "macos")]
#[command]
pub fn reveal_in_file_manager(path: String) -> Result<(), String> {
    log_cmd_err(
        (|| {
            let (dir, _) = resolve_reveal_target(&path);
            std::process::Command::new("open")
                .arg(&dir)
                .spawn()
                .map_err(|e| format!("Failed to open finder: {}", e))?;
            Ok(())
        })(),
        format!("reveal_in_file_manager({path})"),
    )
}

#[cfg(target_os = "linux")]
#[command]
pub fn reveal_in_file_manager(path: String) -> Result<(), String> {
    log_cmd_err(
        (|| {
            let (dir, _) = resolve_reveal_target(&path);
            std::process::Command::new("xdg-open")
                .arg(&dir)
                .spawn()
                .map_err(|e| format!("Failed to open file manager: {}", e))?;
            Ok(())
        })(),
        format!("reveal_in_file_manager({path})"),
    )
}

#[command]
pub fn open_playlists_dir(app: AppHandle) -> Result<(), String> {
    log_cmd_err(
        (|| {
            let playlists_dir = crate::playlist::playlists_dir(&app)?;
            reveal_in_file_manager(playlists_dir.to_string_lossy().to_string())
        })(),
        "open_playlists_dir".to_string(),
    )
}
