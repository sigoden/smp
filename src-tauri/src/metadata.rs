use lofty::config::WriteOptions;
use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::{Accessor, TagExt, TagType};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
pub struct TrackMetadata {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: Option<f64>,
    pub track_number: Option<u32>,
}

impl TrackMetadata {
    pub fn minimal(file_path: &str) -> Self {
        Self {
            path: file_path.to_string(),
            title: None,
            artist: None,
            album: None,
            duration: None,
            track_number: None,
        }
    }
}

pub fn read_metadata(file_path: &str) -> Result<TrackMetadata, String> {
    let path = Path::new(file_path);

    let tagged_file = match read_from_path(path) {
        Ok(f) => f,
        Err(e) => {
            log::warn!(
                "read_metadata_lofty: Failed to parse '{}': {}. Returning minimal metadata.",
                file_path,
                e
            );
            return Ok(TrackMetadata::minimal(file_path));
        }
    };

    let duration = {
        let dur = tagged_file.properties().duration();
        if dur.is_zero() {
            None
        } else {
            Some(dur.as_secs_f64())
        }
    };

    // Improved tag retrieval algorithm:
    // 1. Try primary_tag (format-specific best choice, e.g., ID3v2 for MP3)
    // 2. Fallback to first_tag if primary is missing or empty
    let tag = tagged_file
        .primary_tag()
        .filter(|t| !t.is_empty())
        .or_else(|| tagged_file.first_tag());

    let (title, artist, album, track_number) = tag
        .map(|t| {
            (
                t.title().map(|s| s.to_string()),
                t.artist().map(|s| s.to_string()),
                t.album().map(|s| s.to_string()),
                t.track(),
            )
        })
        .unwrap_or_default();

    Ok(TrackMetadata {
        path: file_path.to_string(),
        title,
        artist,
        album,
        duration,
        track_number,
    })
}

pub fn write_metadata(
    file_path: &str,
    title: Option<&str>,
    artist: Option<&str>,
    album: Option<&str>,
) -> Result<(), String> {
    let path = Path::new(file_path);
    let mut tagged_file =
        read_from_path(path).map_err(|e| format!("Failed to read file for writing: {}", e))?;

    // Get existing primary tag, or create a new one based on file type
    let tag = if let Some(t) = tagged_file.primary_tag_mut() {
        t
    } else {
        // Determine the appropriate tag type for this file format
        let tag_type = match tagged_file.file_type() {
            lofty::file::FileType::Mpeg => TagType::Id3v2,
            lofty::file::FileType::Flac | lofty::file::FileType::Vorbis => TagType::VorbisComments,
            lofty::file::FileType::Ape => TagType::Ape,
            lofty::file::FileType::Mp4 => TagType::Mp4Ilst,
            _ => TagType::Id3v2, // Safe default for most audio files
        };

        tagged_file.insert_tag(lofty::tag::Tag::new(tag_type));
        tagged_file
            .primary_tag_mut()
            .ok_or_else(|| "Failed to create primary tag".to_string())?
    };

    if let Some(t) = title {
        tag.set_title(t.into());
    }
    if let Some(a) = artist {
        tag.set_artist(a.into());
    }
    if let Some(a) = album {
        tag.set_album(a.into());
    }

    tagged_file
        .save_to_path(path, WriteOptions::default())
        .map_err(|e| format!("Failed to save metadata: {}", e))?;

    Ok(())
}
