use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::{Accessor, ItemKey, TagExt};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TrackMetadata {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_ms: Option<u32>,
    pub track_number: Option<String>,
    pub genre: Option<String>,
    pub album_artist: Option<String>,
    pub year: Option<usize>,
}

pub fn read_metadata(file_path: &str) -> Result<TrackMetadata, String> {
    let path = Path::new(file_path);

    let tagged_file = match read_from_path(path) {
        Ok(f) => f,
        Err(e) => {
            log::warn!(
                "read_metadata_lofty: Failed to parse '{}': {}. Returning default metadata.",
                file_path,
                e
            );
            return Ok(TrackMetadata::default());
        }
    };

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

    let (title, artist, album, track_number, genre, album_artist, year) = tag
        .map(|t| {
            (
                t.title().map(|s| s.to_string()),
                t.artist().map(|s| s.to_string()),
                t.album().map(|s| s.to_string()),
                t.track().map(|n| n.to_string()),
                t.genre().map(|s| s.to_string()),
                t.get_string(ItemKey::AlbumArtist).map(|s| s.to_string()),
                t.date().map(|ts| ts.year as usize),
            )
        })
        .unwrap_or_default();

    Ok(TrackMetadata {
        title,
        artist,
        album,
        duration_ms,
        track_number,
        genre,
        album_artist,
        year,
    })
}

