use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::read_from_path;
use lofty::tag::Accessor;
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
pub struct TrackMetadata {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: f64,
    pub track_number: Option<u32>,
}

pub fn read_metadata(file_path: &str) -> Result<TrackMetadata, String> {
    let path = Path::new(file_path);

    // Try to get the filename as fallback title
    let filename = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("??")
        .to_string();

    let file = match read_from_path(path) {
        Ok(f) => f,
        Err(_) => {
            // Return minimal metadata if we can't parse
            return Ok(TrackMetadata {
                path: file_path.to_string(),
                title: Some(filename),
                artist: None,
                album: None,
                duration: 0.0,
                track_number: None,
            });
        }
    };

    let properties = file.properties();
    let duration = properties.duration().as_secs_f64();

    let tags = file.tags().first().map(|t| {
        (
            t.title().map(|s| s.to_string()),
            t.artist().map(|s| s.to_string()),
            t.album().map(|s| s.to_string()),
            t.track(),
        )
    });

    let (title, artist, album, track_number) = tags.unwrap_or_default();

    Ok(TrackMetadata {
        path: file_path.to_string(),
        title: title.or(Some(filename)),
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
    use lofty::config::WriteOptions;
    use lofty::file::TaggedFileExt;

    let path = std::path::Path::new(file_path);
    let mut tagged_file = read_from_path(path).map_err(|e| format!("Failed to read file: {}", e))?;

    let tag = if tagged_file.contains_tag_type(lofty::tag::TagType::Id3v2) {
        tagged_file.tag_mut(lofty::tag::TagType::Id3v2)
    } else {
        tagged_file.primary_tag_mut()
    };

    if let Some(tag) = tag {
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
            .map_err(|e| format!("Failed to save file: {}", e))?;
    } else {
        return Err("No tag found or could not create one".to_string());
    }

    Ok(())
}
