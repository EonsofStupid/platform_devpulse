//! Configuration and integration boundaries for external AI runtime processes.
//!
//! Runtime-specific flags belong to the kernel. Platform code supplies the
//! configured data location and supervises the process through the runtime API.

pub mod llama_server;
pub mod voice_stt;
pub mod voice_tts;

use anyhow::{Context, Result};
use serde::Serialize;
use std::io::Write as _;
use std::path::Path;

fn config_lock(path: &Path) -> Result<std::fs::File> {
    let parent = path
        .parent()
        .with_context(|| format!("runtime settings path has no parent: {}", path.display()))?;
    let mut lock_name = path
        .file_name()
        .context("runtime settings path has no filename")?
        .to_os_string();
    lock_name.push(".lock");
    // The stable sibling lock coordinates separate processes as well as UI
    // tasks. Keep it on disk: unlinking a lock file lets waiters and new writers
    // acquire different files. The OS releases the lock when this handle closes.
    std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(parent.join(lock_name))
        .with_context(|| format!("open settings lock for {}", path.display()))
}

/// Coordinate readers with replacement on Windows, where an open read handle
/// can prevent a writer from replacing the destination even with sharing flags.
fn load_config(path: &Path) -> Result<String> {
    let reader_lock = config_lock(path)?;
    reader_lock
        .lock_shared()
        .with_context(|| format!("lock settings for reading {}", path.display()))?;
    std::fs::read_to_string(path).with_context(|| format!("read settings {}", path.display()))
}

/// Publish a complete settings file without sharing temporary names between
/// concurrent saves. Failed writes leave the previous settings intact.
fn save_config(path: &Path, config: &impl Serialize) -> Result<()> {
    let serialized = toml::to_string_pretty(config).context("serialize runtime settings")?;
    let parent = path
        .parent()
        .with_context(|| format!("runtime settings path has no parent: {}", path.display()))?;
    std::fs::create_dir_all(parent)
        .with_context(|| format!("create settings directory {}", parent.display()))?;
    let writer_lock = config_lock(path)?;
    writer_lock
        .lock()
        .with_context(|| format!("lock settings {}", path.display()))?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent)
        .with_context(|| format!("create temporary settings in {}", parent.display()))?;
    temporary
        .write_all(serialized.as_bytes())
        .with_context(|| format!("write settings for {}", path.display()))?;
    temporary
        .as_file()
        .sync_all()
        .with_context(|| format!("sync settings for {}", path.display()))?;
    // Close our write handle before publishing. Keeping it open across a
    // subsequent Windows replacement can make that replacement fail.
    temporary
        .into_temp_path()
        .persist(path)
        .with_context(|| format!("replace settings {}", path.display()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;
    use std::sync::{Arc, Barrier};

    #[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
    struct Settings {
        revision: usize,
        content: String,
    }

    fn settings(revision: usize) -> Settings {
        Settings {
            revision,
            content: format!("writer-{revision}").repeat(1024),
        }
    }

    #[test]
    fn replaces_existing_settings_and_leaves_no_temporary_file() -> Result<()> {
        let data = tempfile::tempdir()?;
        let path = data.path().join("settings.toml");
        save_config(&path, &settings(1))?;
        save_config(&path, &settings(2))?;
        let loaded: Settings = toml::from_str(&load_config(&path)?)?;
        assert_eq!(loaded, settings(2));
        assert_eq!(std::fs::read_dir(data.path())?.count(), 2);
        Ok(())
    }

    #[test]
    fn concurrent_saves_publish_complete_files_without_name_collisions() -> Result<()> {
        let data = tempfile::tempdir()?;
        let path = data.path().join("settings.toml");
        save_config(&path, &settings(0))?;
        let barrier = Arc::new(Barrier::new(16));
        let workers: Vec<_> = (1..=16)
            .map(|revision| {
                let path = path.clone();
                let barrier = Arc::clone(&barrier);
                std::thread::spawn(move || -> Result<()> {
                    barrier.wait();
                    save_config(&path, &settings(revision))?;
                    let observed: Settings = toml::from_str(&load_config(&path)?)?;
                    assert_eq!(observed, settings(observed.revision));
                    Ok(())
                })
            })
            .collect();
        // Join every writer before propagating errors, so the test directory
        // cannot disappear while another writer is still using it.
        let results: Vec<_> = workers
            .into_iter()
            .map(std::thread::JoinHandle::join)
            .collect();
        for result in results {
            result.map_err(|_| anyhow::anyhow!("settings writer panicked"))??;
        }
        let loaded: Settings = toml::from_str(&load_config(&path)?)?;
        assert!((1..=16).contains(&loaded.revision));
        assert_eq!(loaded, settings(loaded.revision));
        assert_eq!(std::fs::read_dir(data.path())?.count(), 2);
        Ok(())
    }

    #[test]
    fn failed_replacement_cleans_up_temporary_file() -> Result<()> {
        let data = tempfile::tempdir()?;
        let path = data.path().join("settings.toml");
        std::fs::create_dir(&path)?;
        std::fs::write(path.join("keep.txt"), "preserved")?;
        assert!(save_config(&path, &settings(1)).is_err());
        assert_eq!(std::fs::read_to_string(path.join("keep.txt"))?, "preserved");
        assert_eq!(std::fs::read_dir(data.path())?.count(), 2);
        Ok(())
    }
}
