//! Presentation vocabulary. Technical identities are never rewritten at transport boundaries.

pub mod redaction;

use std::collections::HashMap;
use std::sync::LazyLock;

/// Generated once, shared by simple and advanced presentation in every build.
pub static ENGINE_VOCABULARY: LazyLock<HashMap<&'static str, &'static str>> =
    LazyLock::new(|| include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs")));

/// Full technical-to-friendly dictionary, available in shipped applications.
pub fn dictionary_entries() -> Vec<(&'static str, &'static str)> {
    let mut entries: Vec<_> = ENGINE_VOCABULARY
        .iter()
        .map(|(key, value)| (*key, *value))
        .collect();
    entries.sort_unstable();
    entries
}

/// Format an explicit presentation copy; callers retain the original text.
pub fn remap_text(text: &str) -> String {
    let mut entries = dictionary_entries();
    entries.sort_by(|a, b| b.0.len().cmp(&a.0.len()));
    let mut result = text.to_string();
    for (technical, friendly) in entries {
        result = result.replace(technical, friendly);
    }
    result
}

#[cfg(test)]
mod tests {
    #[test]
    fn dictionary_is_available_without_secrecy_features() {
        assert_eq!(
            super::ENGINE_VOCABULARY.get("GUARDIAN"),
            Some(&"Quality Check")
        );
        assert!(!super::dictionary_entries().is_empty());
    }
}
