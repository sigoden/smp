use serde::Serialize;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "ogg", "wav", "m4a", "aac", "wma", "opus"];

#[derive(Debug, Clone, Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub children: Vec<FsEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FsEntry {
    File(FileEntry),
    Dir(DirEntry),
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

    let mut entries: Vec<FsEntry> = Vec::new();
    let mut dir_iter = match fs::read_dir(path) {
        Ok(iter) => iter,
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    };

    while let Some(entry) = dir_iter.next() {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path().to_string_lossy().to_string();

        if file_type.is_dir() {
            // Skip hidden directories
            if name.starts_with('.') {
                continue;
            }
            let children = scan_directory(&full_path).unwrap_or_default();
            entries.push(FsEntry::Dir(DirEntry {
                name,
                path: full_path,
                children,
            }));
        } else if file_type.is_file() && is_audio_file(&entry.path()) {
            entries.push(FsEntry::File(FileEntry {
                name,
                path: full_path,
            }));
        }
    }

    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| {
        let a_is_dir = matches!(a, FsEntry::Dir(_));
        let b_is_dir = matches!(b, FsEntry::Dir(_));
        if a_is_dir != b_is_dir {
            b_is_dir.cmp(&a_is_dir)
        } else {
            let a_name = match a {
                FsEntry::Dir(d) => &d.name,
                FsEntry::File(f) => &f.name,
            };
            let b_name = match b {
                FsEntry::Dir(d) => &d.name,
                FsEntry::File(f) => &f.name,
            };
            a_name.to_lowercase().cmp(&b_name.to_lowercase())
        }
    });

    Ok(entries)
}

/// Returns all audio files recursively from a directory (flat list)
pub fn collect_audio_files(path: &str) -> Result<Vec<String>, String> {
    let path = Path::new(path);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", path.display()));
    }

    let mut files = Vec::new();
    for entry in WalkDir::new(path).follow_links(true).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() && is_audio_file(entry.path()) {
            files.push(entry.path().to_string_lossy().to_string());
        }
    }

    // Sort alphabetically
    files.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));

    Ok(files)
}
