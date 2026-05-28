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
    #[serde(default)]
    pub invalid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub name: String,
    pub tracks: Vec<TrackEntry>,
    #[serde(default)]
    pub track_count: usize,
}

pub fn playlists_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let dir = app_dir.join("playlists");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create playlists dir: {}", e))?;
    Ok(dir)
}

fn playlist_to_m3u8(playlist: &Playlist) -> String {
    let mut output = String::from("#EXTM3U\n");
    for track in &playlist.tracks {
        let title_str = match (&track.artist, &track.title) {
            (Some(a), Some(t)) => format!("{} - {}", a, t),
            (Some(a), None) => a.clone(),
            (None, Some(t)) => t.clone(),
            (None, None) => std::path::Path::new(&track.path)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string(),
        };
        output.push_str(&format!("#EXTINF:{},{}\n", track.duration, title_str));
        output.push_str(&format!("{}\n", track.path));
    }
    output
}

fn m3u8_to_playlist(name: &str, content: &str) -> Playlist {
    let mut tracks = Vec::new();
    let mut current_extinf: Option<(f64, String)> = None;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            if let Some(extinf) = line.strip_prefix("#EXTINF:") {
                if let Some(comma_pos) = extinf.find(',') {
                    let duration_str = &extinf[..comma_pos];
                    let title_str = &extinf[comma_pos + 1..];
                    let duration: f64 = duration_str
                        .parse()
                        .map_err(|e| log::warn!("Bad EXTINF duration '{}': {}", duration_str, e))
                        .unwrap_or(0.0);
                    current_extinf = Some((duration, title_str.to_string()));
                }
            }
            continue;
        }
        let path = line.to_string();
        let (duration, title, artist) = if let Some((dur, ref extinf_title)) = current_extinf {
            if let Some(dash_pos) = extinf_title.find(" - ") {
                let artist = extinf_title[..dash_pos].to_string();
                let title = extinf_title[dash_pos + 3..].to_string();
                (dur, Some(title), Some(artist))
            } else {
                (dur, Some(extinf_title.clone()), None)
            }
        } else {
            (0.0, None, None)
        };
        tracks.push(TrackEntry {
            path,
            title,
            artist,
            album: None,
            duration,
            invalid: false,
        });
        current_extinf = None;
    }

    Playlist {
        name: name.to_string(),
        tracks,
        track_count: 0,
    }
}

pub(crate) fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphabetic()
                || c.is_ascii_digit()
                || c == '-'
                || c == '_'
                || c == '.'
                || c == ' '
            {
                c
            } else {
                '_'
            }
        })
        .collect()
}

/// List all playlists with lightweight metadata (no track data).
/// Each returned playlist has an empty `tracks` vector and a `track_count`
/// computed by counting non-comment, non-empty lines in the .m3u8 file.
pub fn list_playlists(app: &AppHandle) -> Result<Vec<Playlist>, String> {
    let dir = playlists_dir(app)?;
    let mut playlists = Vec::new();

    if !dir.exists() {
        return Ok(playlists);
    }

    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read playlists dir: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("m3u8") {
            let content =
                fs::read_to_string(&path).map_err(|e| format!("Failed to read playlist: {}", e))?;
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();

            // Count non-comment, non-empty lines as track count
            let track_count = content
                .lines()
                .filter(|line| {
                    let line = line.trim();
                    !line.is_empty() && !line.starts_with('#')
                })
                .count();

            playlists.push(Playlist {
                name,
                tracks: Vec::new(),
                track_count,
            });
        }
    }

    playlists.sort_by_key(|a| a.name.to_lowercase());
    Ok(playlists)
}

/// Load and validate tracks for a single playlist by name.
/// Reads the .m3u8 file, parses EXTINF metadata, then validates
/// each track: checks file existence and re-reads audio duration.
pub fn load_playlist_tracks(app: &AppHandle, name: &str) -> Result<Vec<TrackEntry>, String> {
    let dir = playlists_dir(app)?;
    let filename = sanitize_filename(name);
    let path = dir.join(format!("{}.m3u8", filename));

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read playlist '{}': {}", name, e))?;

    // Use the pure parser (unchanged) to parse the m3u8 content
    let mut playlist = m3u8_to_playlist(name, &content);

    // Externalized validation — post-process each track
    for track in &mut playlist.tracks {
        if !std::path::Path::new(&track.path).exists() {
            track.invalid = true;
        } else {
            // File exists — re-read duration from actual audio metadata
            // Note: title/artist/album trust m3u8 inline metadata per scope
            match crate::metadata::read_metadata(&track.path) {
                Ok(meta) => {
                    track.duration = meta.duration;
                }
                Err(e) => {
                    log::warn!("Failed to read metadata for {}: {}", track.path, e);
                    // Keep EXTINF duration as fallback
                }
            }
        }
    }

    Ok(playlist.tracks)
}

pub fn save_playlist(app: &AppHandle, playlist: &Playlist) -> Result<(), String> {
    let dir = playlists_dir(app)?;
    let filename = sanitize_filename(&playlist.name);
    let path = dir.join(format!("{}.m3u8", filename));
    let content = playlist_to_m3u8(playlist);
    fs::write(&path, content).map_err(|e| format!("Failed to write playlist: {}", e))?;
    Ok(())
}

pub fn delete_playlist(app: &AppHandle, name: &str) -> Result<(), String> {
    let dir = playlists_dir(app)?;
    let filename = sanitize_filename(name);
    let path = dir.join(format!("{}.m3u8", filename));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete playlist: {}", e))?;
    }
    Ok(())
}

pub fn rename_playlist(app: &AppHandle, old_name: &str, new_name: &str) -> Result<(), String> {
    let dir = playlists_dir(app)?;
    let old_filename = sanitize_filename(old_name);
    let new_filename = sanitize_filename(new_name);
    let old_path = dir.join(format!("{}.m3u8", old_filename));
    let new_path = dir.join(format!("{}.m3u8", new_filename));

    if !old_path.exists() {
        return Err(format!("Playlist '{}' not found", old_name));
    }
    if new_path.exists() {
        return Err(format!("Playlist '{}' already exists", new_name));
    }

    fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename playlist: {}", e))?;
    Ok(())
}
