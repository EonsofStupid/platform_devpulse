use std::fs;
use std::path::{Path, PathBuf};

pub struct ComposedPlatformConfig {
	pub content: String,
	#[allow(dead_code)]
	pub source_files: Vec<PathBuf>,
}

pub fn compose_platform_config(workspace_root: &Path) -> Result<ComposedPlatformConfig, String> {
	let config_root = workspace_root.join("config").join("platform");
	let mut source_files = Vec::new();
	collect_fragments(&config_root, &mut source_files)?;

	if source_files.is_empty() {
		return Err(format!(
			"No platform config fragments found under {}",
			config_root.display()
		));
	}

	source_files.sort();

	let mut merged = toml::Value::Table(toml::map::Map::new());
	for file in &source_files {
		let raw = fs::read_to_string(file)
			.map_err(|error| format!("Failed to read {}: {error}", file.display()))?;
		let value = toml::from_str::<toml::Value>(&raw)
			.map_err(|error| format!("Failed to parse {}: {error}", file.display()))?;
		merge_values(&mut merged, value);
	}

	let content = toml::to_string_pretty(&merged)
		.map_err(|error| format!("Failed to serialize composed platform config: {error}"))?;

	Ok(ComposedPlatformConfig {
		content,
		source_files,
	})
}

fn collect_fragments(dir: &Path, files: &mut Vec<PathBuf>) -> Result<(), String> {
	if !dir.exists() {
		return Err(format!("Platform config directory does not exist: {}", dir.display()));
	}

	let mut entries = fs::read_dir(dir)
		.map_err(|error| format!("Failed to read directory {}: {error}", dir.display()))?
		.collect::<Result<Vec<_>, _>>()
		.map_err(|error| format!("Failed to enumerate {}: {error}", dir.display()))?;

	entries.sort_by_key(|entry| entry.path());

	for entry in entries {
		let path = entry.path();
		if path.is_dir() {
			collect_fragments(&path, files)?;
			continue;
		}

		if path.extension().and_then(|ext| ext.to_str()) == Some("toml") {
			files.push(path);
		}
	}

	Ok(())
}

fn merge_values(base: &mut toml::Value, overlay: toml::Value) {
	match (base, overlay) {
		(toml::Value::Table(base_table), toml::Value::Table(overlay_table)) => {
			for (key, value) in overlay_table {
				if let Some(existing) = base_table.get_mut(&key) {
					merge_values(existing, value);
				} else {
					base_table.insert(key, value);
				}
			}
		}
		(toml::Value::Array(base_array), toml::Value::Array(overlay_array)) => {
			base_array.extend(overlay_array);
		}
		(base_slot, value) => {
			*base_slot = value;
		}
	}
}