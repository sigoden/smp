use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RootDirSetting {
    pub path: String,
    pub expanded_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub root_dirs: Vec<RootDirSetting>,
    pub volume: f64,
    pub play_mode: String,
    pub visible_columns: Vec<String>,
    pub sidebar_tab: String,
    pub active_playlist_name: Option<String>,
    pub sidebar_width: u16,
    pub track_index: i32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            root_dirs: Vec::new(),
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

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> AppSettings {
    let path = match settings_path(app) {
        Ok(p) => p,
        Err(e) => {
            log::error!("Failed to get settings path: {}", e);
            return AppSettings::default();
        }
    };

    if !path.exists() {
        return AppSettings::default();
    }

    match fs::read_to_string(&path) {
        Ok(content) => match serde_json::from_str::<AppSettings>(&content) {
            Ok(settings) => settings,
            Err(e) => {
                log::error!("Failed to parse settings, using defaults: {}", e);
                AppSettings::default()
            }
        },
        Err(e) => {
            log::error!("Failed to read settings file: {}", e);
            AppSettings::default()
        }
    }
}

pub fn save_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}
