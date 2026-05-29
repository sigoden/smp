use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::{Accessor, ItemKey, TagExt};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TrackMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_ms: Option<u32>,
    pub track: Option<String>,
    pub genre: Option<String>,
    pub album_artist: Option<String>,
    pub year: Option<usize>,
}

pub fn read_metadata(file_path: &str) -> Result<TrackMetadata, String> {
    let path = Path::new(file_path);

    let tagged_file =
        read_from_path(path).map_err(|e| format!("Failed to read metadata: {}", e))?;

    let duration_ms = {
        let dur = tagged_file.properties().duration();
        if dur.is_zero() {
            None
        } else {
            Some(dur.as_millis() as u32)
        }
    };

    // Improved tag retrieval algorithm:
    // 1. Try primary_tag (format-specific best choice, e.g., ID3v2 for MP3)
    // 2. Fallback to first_tag if primary is missing or empty
    let tag = tagged_file
        .primary_tag()
        .filter(|t| !t.is_empty())
        .or_else(|| tagged_file.first_tag());

    let meta = tag.map(|t| TrackMetadata {
        title: t.title().map(|s| s.to_string()),
        artist: t.artist().map(|s| s.to_string()),
        album: t.album().map(|s| s.to_string()),
        track: t.track().map(|n| n.to_string()),
        genre: t.genre().map(|s| s.to_string()),
        album_artist: t.get_string(ItemKey::AlbumArtist).map(|s| s.to_string()),
        year: t.date().map(|ts| ts.year as usize),
        duration_ms: None, // filled below
    });

    Ok(TrackMetadata {
        duration_ms,
        ..meta.unwrap_or_default()
    })
}
