use log::LevelFilter;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub level: String,
    pub module: String,
    pub message: String,
    pub timestamp: String,
}

pub fn retrieve_log_level() -> LevelFilter {
    std::env::var("SMP_LOG_LEVEL")
        .ok()
        .and_then(|level| parse_level_filter(&level))
        .unwrap_or(LevelFilter::Info)
}

/// Convert a string level ("ERROR", "WARN", "INFO", "DEBUG", "TRACE") to `LevelFilter`.
/// Returns `None` for unrecognized strings (safe default: let everything through).
fn parse_level_filter(level: &str) -> Option<LevelFilter> {
    match level.to_uppercase().as_str() {
        "ERROR" => Some(LevelFilter::Error),
        "WARN" => Some(LevelFilter::Warn),
        "INFO" => Some(LevelFilter::Info),
        "DEBUG" => Some(LevelFilter::Debug),
        "TRACE" => Some(LevelFilter::Trace),
        _ => None,
    }
}

pub fn write_log_entry(
    app: &AppHandle,
    entry: &LogEntry,
    level: LevelFilter,
) -> Result<(), String> {
    // Filter: skip entries whose severity is below the configured threshold.
    if let Some(entry_level) = parse_level_filter(&entry.level) {
        if entry_level > level {
            return Ok(());
        }
    }

    let app_log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_log_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    let log_path = app_log_dir.join("frontend.log");

    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
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

pub fn clear_logs_on_start(app: &tauri::AppHandle) {
    if let Ok(app_log_dir) = app.path().app_log_dir() {
        for log_path in ["app.log", "frontend.log"]
            .iter()
            .map(|f| app_log_dir.join(f))
        {
            if log_path.exists() {
                if let Err(e) = fs::write(&log_path, "") {
                    log::warn!("Failed to clear log file {:?}: {}", log_path, e);
                }
            }
        }
    }
}

/// Log any command error with `log::error!`, then return the result as-is.
pub fn log_cmd_err<T>(result: Result<T, String>, cmd: String) -> Result<T, String> {
    if let Err(ref e) = result {
        log::error!("[command::{}] {}", cmd, e);
    }
    result
}
