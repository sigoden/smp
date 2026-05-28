use natord;
use rayon::prelude::*;
use serde::Serialize;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "ogg", "wav", "m4a", "aac", "wma", "opus"];

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FsEntry {
    File {
        name: String,
        path: String,
    },
    Dir {
        name: String,
        path: String,
        children: Vec<FsEntry>,
    },
}

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

pub fn scan_directory(path: &str) -> Result<Vec<FsEntry>, String> {
    let path = Path::new(path);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", path.display()));
    }

    let dir_iter = match fs::read_dir(path) {
        Ok(iter) => iter,
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    };

    let entries: Vec<_> = dir_iter.filter_map(|e| e.ok()).collect();

    let mut results: Vec<FsEntry> = entries
        .par_iter()
        .filter_map(|entry| {
            let file_type = entry.file_type().ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            let full_path = entry.path().to_string_lossy().to_string();

            if file_type.is_dir() {
                // Skip hidden directories
                if name.starts_with('.') {
                    return None;
                }
                let children = scan_directory(&full_path).unwrap_or_default();
                Some(FsEntry::Dir {
                    name,
                    path: full_path,
                    children,
                })
            } else if file_type.is_file() && is_audio_file(&entry.path()) {
                Some(FsEntry::File {
                    name,
                    path: full_path,
                })
            } else {
                None
            }
        })
        .collect();

    // Sort: directories first, then files, alphabetically
    results.par_sort_by(|a, b| {
        let a_is_dir = matches!(a, FsEntry::Dir { .. });
        let b_is_dir = matches!(b, FsEntry::Dir { .. });
        if a_is_dir != b_is_dir {
            b_is_dir.cmp(&a_is_dir)
        } else {
            let a_name = match a {
                FsEntry::Dir { name, .. } => name,
                FsEntry::File { name, .. } => name,
            };
            let b_name = match b {
                FsEntry::Dir { name, .. } => name,
                FsEntry::File { name, .. } => name,
            };
            natord::compare_ignore_case(a_name, b_name)
        }
    });

    Ok(results)
}

/// Returns all audio files recursively from a directory (flat list)
pub fn collect_audio_files(path: &str) -> Result<Vec<String>, String> {
    let path = Path::new(path);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", path.display()));
    }

    let mut files = Vec::new();
    for entry in WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_entry(|e| !e.file_name().to_str().is_some_and(|s| s.starts_with('.')))
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() && is_audio_file(entry.path()) {
            files.push(entry.path().to_string_lossy().to_string());
        }
    }

    // Sort alphabetically
    files.sort_by_key(|a| a.to_lowercase());

    Ok(files)
}
