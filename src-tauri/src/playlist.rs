use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackEntry {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub tracks: Vec<TrackEntry>,
    pub created_at: String,
    pub updated_at: String,
}

fn playlists_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let dir = app_dir.join("playlists");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create playlists dir: {}", e))?;
    Ok(dir)
}

pub fn load_playlists(app: &AppHandle) -> Result<Vec<Playlist>, String> {
    let dir = playlists_dir(app)?;
    let mut playlists = Vec::new();

    if !dir.exists() {
        return Ok(playlists);
    }

    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read playlists dir: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read playlist: {}", e))?;
            if let Ok(playlist) = serde_json::from_str::<Playlist>(&content) {
                playlists.push(playlist);
            }
        }
    }

    // Sort by name
    playlists.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(playlists)
}

pub fn save_playlist(app: &AppHandle, playlist: &Playlist) -> Result<(), String> {
    let dir = playlists_dir(app)?;
    let path = dir.join(format!("{}.json", playlist.id));
    let content = serde_json::to_string_pretty(playlist)
        .map_err(|e| format!("Failed to serialize playlist: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write playlist: {}", e))?;
    Ok(())
}

pub fn delete_playlist(app: &AppHandle, id: &str) -> Result<(), String> {
    let dir = playlists_dir(app)?;
    let path = dir.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete playlist: {}", e))?;
    }
    Ok(())
}
