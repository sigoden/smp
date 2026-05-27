use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub level: String,
    pub module: String,
    pub message: String,
    pub timestamp: String,
}

fn log_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_dir.join("frontend.log"))
}

pub fn write_log_entry(app: &AppHandle, entry: &LogEntry) -> Result<(), String> {
    let path = log_path(app)?;

    let mut file = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    writeln!(
        file,
        "{} {} [{}] {}",
        entry.timestamp, entry.level, entry.module, entry.message
    )
    .map_err(|e| format!("Failed to write log entry: {}", e))?;

    file.flush()
        .map_err(|e| format!("Failed to flush log file: {}", e))?;

    Ok(())
}
