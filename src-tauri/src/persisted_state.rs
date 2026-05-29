use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedRootDir {
    pub path: String,
    pub expanded_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedState {
    pub root_dirs: Vec<PersistedRootDir>,
    pub enqueued_paths: Vec<String>,
    pub volume: f64,
    pub play_mode: String,
    pub visible_columns: Vec<String>,
    pub sidebar_tab: String,
    pub sidebar_width: u16,
    pub active_playlist_name: Option<String>,
    pub track_index: i32,
}

impl Default for PersistedState {
    fn default() -> Self {
        Self {
            root_dirs: Vec::new(),
            enqueued_paths: Vec::new(),
            volume: 0.8,
            play_mode: "sequential".to_string(),
            visible_columns: vec![
                "title".to_string(),
                "artist".to_string(),
                "album".to_string(),
                "duration".to_string(),
                "filename".to_string(),
            ],
            sidebar_tab: "tree".to_string(),
            active_playlist_name: None,
            sidebar_width: 256,
            track_index: -1,
        }
    }
}

fn persisted_state_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_dir.join("persisted-state.json"))
}

pub fn load_persisted_state(app: &AppHandle) -> PersistedState {
    let path = match persisted_state_path(app) {
        Ok(p) => p,
        Err(e) => {
            log::error!("Failed to get persisted state path: {}", e);
            return PersistedState::default();
        }
    };

    if !path.exists() {
        return PersistedState::default();
    }

    match fs::read_to_string(&path) {
        Ok(content) => match serde_json::from_str::<PersistedState>(&content) {
            Ok(state) => state,
            Err(e) => {
                log::error!("Failed to parse persisted state, using defaults: {}", e);
                PersistedState::default()
            }
        },
        Err(e) => {
            log::error!("Failed to read persisted state file: {}", e);
            PersistedState::default()
        }
    }
}

pub fn save_persisted_state(app: &AppHandle, state: &PersistedState) -> Result<(), String> {
    let path = persisted_state_path(app)?;
    let content = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize persisted state: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write persisted state: {}", e))?;
    Ok(())
}
