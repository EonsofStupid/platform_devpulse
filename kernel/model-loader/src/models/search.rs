//! `HuggingFace` model search — public API, GGUF-filtered results.

use serde::{Deserialize, Serialize};

/// A model found on `HuggingFace`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct HfSearchResult {
    /// Repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
    pub repo_id: String,
    /// Author/organization.
    pub author: String,
    /// Model display name.
    pub model_name: String,
    /// Total download count.
    pub downloads: u64,
    /// Like count.
    pub likes: u64,
    /// Pipeline tag (e.g. `"text-generation"`, `"feature-extraction"`).
    pub pipeline_tag: Option<String>,
    /// Tags from the model card.
    pub tags: Vec<String>,
    /// GGUF files available in this repo.
    pub gguf_files: Vec<HfFileInfo>,
    /// Last modified timestamp.
    pub last_modified: String,
}

/// A single GGUF file in a `HuggingFace` repo.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct HfFileInfo {
    /// Filename (e.g. `"Qwen3-14B-Q4_K_M.gguf"`).
    pub filename: String,
    /// File size in bytes.
    pub size_bytes: u64,
    /// Inferred quantization level from filename.
    pub quant_level: Option<String>,
}

/// Raw `HuggingFace` API response model.
#[derive(Debug, Deserialize)]
struct HfApiModel {
    #[serde(rename = "modelId")]
    model_id: Option<String>,
    id: String,
    author: Option<String>,
    downloads: Option<u64>,
    likes: Option<u64>,
    #[serde(rename = "pipeline_tag")]
    pipeline_tag: Option<String>,
    tags: Option<Vec<String>>,
    siblings: Option<Vec<HfApiSibling>>,
    #[serde(rename = "lastModified")]
    last_modified: Option<String>,
}

/// Raw `HuggingFace` API file sibling.
#[derive(Debug, Deserialize)]
struct HfApiSibling {
    #[serde(rename = "rfilename")]
    filename: String,
    size: Option<u64>,
}

/// Search `HuggingFace` for GGUF models.
///
/// Queries the public `HuggingFace` API and filters results to only include
/// repos that have `.gguf` files. Each result includes the GGUF files
/// with their sizes and inferred quantization levels.
///
/// # Errors
///
/// Returns an error if the `reqwest` client cannot be built (TLS init
/// failure), if the HTTP request fails (DNS, network, timeout), if the
/// API responds with a non-success status (auth, rate-limit, 5xx), or
/// if the response body cannot be deserialized as the expected JSON
/// schema.
pub async fn search_huggingface(query: &str, limit: u32) -> anyhow::Result<Vec<HfSearchResult>> {
    let url = format!(
        "https://huggingface.co/api/models?search={}&filter=gguf&sort=downloads&direction=-1&limit={}&full=true&config=false",
        urlencoded(query),
        limit,
    );

    tracing::info!(query = %query, limit, "Searching HuggingFace");

    let client = reqwest::Client::builder()
        .user_agent("DevPulse/0.1.0")
        .timeout(std::time::Duration::from_secs(15))
        .build()?;

    let response = client.get(&url).send().await?;

    if !response.status().is_success() {
        anyhow::bail!(
            "HuggingFace API returned status {}: {}",
            response.status(),
            response.text().await.unwrap_or_default()
        );
    }

    let models: Vec<HfApiModel> = response.json().await?;

    let results: Vec<HfSearchResult> = models
        .into_iter()
        .filter_map(|m| {
            let siblings = m.siblings.unwrap_or_default();
            let gguf_files: Vec<HfFileInfo> = siblings
                .into_iter()
                .filter(|s| {
                    std::path::Path::new(&s.filename)
                        .extension()
                        .is_some_and(|ext| ext.eq_ignore_ascii_case("gguf"))
                })
                .map(|s| {
                    let quant_level =
                        crate::models::discovery::infer_quant_from_filename_pub(&s.filename);
                    HfFileInfo {
                        filename: s.filename,
                        size_bytes: s.size.unwrap_or(0),
                        quant_level,
                    }
                })
                .collect();

            // Only include repos that have GGUF files
            if gguf_files.is_empty() {
                return None;
            }

            let repo_id = m.id.clone();
            let author = m
                .author
                .unwrap_or_else(|| repo_id.split('/').next().unwrap_or("unknown").to_string());
            let model_name = m.model_id.unwrap_or_else(|| repo_id.clone());

            Some(HfSearchResult {
                repo_id,
                author,
                model_name,
                downloads: m.downloads.unwrap_or(0),
                likes: m.likes.unwrap_or(0),
                pipeline_tag: m.pipeline_tag,
                tags: m.tags.unwrap_or_default(),
                gguf_files,
                last_modified: m.last_modified.unwrap_or_default(),
            })
        })
        .collect();

    tracing::info!(results = results.len(), "HuggingFace search complete");
    Ok(results)
}

/// Minimal URL encoding for search query.
fn urlencoded(s: &str) -> String {
    s.replace(' ', "+")
        .replace('&', "%26")
        .replace('=', "%3D")
        .replace('?', "%3F")
        .replace('#', "%23")
}
