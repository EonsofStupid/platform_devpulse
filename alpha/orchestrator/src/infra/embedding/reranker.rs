// orchestrator/src/infra/embedding/reranker.rs

//! Reranker backend - Qwen3-Reranker via Candle GGUF
//!
//! Device: CPU (GPU blocked by CUDA 13.1 incompatibility, will be GPU P2 when fixed)
//! Format: GGUF q8_0 only
//! Output: 0.0-1.0 relevance score
//!
//! Uses Qwen3 thinking mode: `<think>...</think>` then yes/no judgment
//!
//! This is the foundation for Pillar 1 (Persona-Skewed Rerank):
//! - Base relevance scores come from yes/no token logits
//! - Persona bias maps multiply these scores to shift attention
//! - Debugger mode boosts logs, Architect mode boosts design docs

use anyhow::Result;
use candle_core::{Device, Tensor};
use candle_transformers::models::quantized_llama::ModelWeights;
use std::path::PathBuf;
use std::sync::Mutex;
use tokenizers::Tokenizer;
use tracing::instrument;

use crate::infra::catalog::models::DeviceAllocation;

/// Qwen3-Reranker prompt template (from model card)
///
/// System prompt instructs yes/no judgment.
/// User prompt contains <Instruct>, <Query>, <Document>.
/// Assistant uses <think>...</think> before answering.
const SYSTEM_PROMPT: &str = "<|im_start|>system\nJudge whether the Document meets the requirements based on the Query and the Instruct provided. Note that the answer can only be \"yes\" or \"no\".<|im_end|>\n";
const USER_PREFIX: &str = "<|im_start|>user\n";
const USER_SUFFIX: &str = "<|im_end|>\n";
const ASSISTANT_THINKING: &str = "<|im_start|>assistant\n<think>\n\n</think>\n\n";

/// Default instruction for code retrieval
const DEFAULT_INSTRUCTION: &str =
    "Given a code search query, retrieve relevant code snippets that answer the query";

/// Reranker backend - CPU for now (GPU when CUDA 13.1 support lands)
pub struct RerankerBackend {
    model: Mutex<ModelWeights>,
    tokenizer: Tokenizer,
    device: Device,
    token_yes: u32,
    token_no: u32,
    models_dir: PathBuf,
}

impl RerankerBackend {
    /// Load reranker from directory containing GGUF and tokenizer.json
    #[instrument(name = "reranker.load", skip_all, fields(dir = %reranker_dir.display()))]
    pub fn load(reranker_dir: &PathBuf) -> Result<Self> {
        // Device: CPU for now (GPU P2 when CUDA 13.1 support lands)
        let device = DeviceAllocation::CpuForced.to_device();
        tracing::info!("Loading reranker on {:?}", device);

        // Paths - q8_0 only per locked decision
        let gguf_path = reranker_dir.join("Qwen3-Reranker-0.6B-q8_0.gguf");
        let tokenizer_path = reranker_dir.join("tokenizer.json");

        // Load tokenizer first (needed for token IDs)
        let tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {}", e))?;

        // Get token IDs for "yes" and "no"
        let token_yes = tokenizer
            .token_to_id("yes")
            .ok_or_else(|| anyhow::anyhow!("Token 'yes' not in vocabulary"))?;
        let token_no = tokenizer
            .token_to_id("no")
            .ok_or_else(|| anyhow::anyhow!("Token 'no' not in vocabulary"))?;

        tracing::info!("Token IDs: yes={}, no={}", token_yes, token_no);

        // Load GGUF
        tracing::info!("Loading GGUF from {:?}", gguf_path);
        let mut file = std::fs::File::open(&gguf_path)?;
        let content = candle_core::quantized::gguf_file::Content::read(&mut file)?;
        let model = ModelWeights::from_gguf(content, &mut file, &device)?;

        tracing::info!("Reranker loaded");

        Ok(Self {
            model: Mutex::new(model),
            tokenizer,
            device,
            token_yes,
            token_no,
            models_dir: reranker_dir.clone(),
        })
    }

// Removed from_config() which used hardcoded default paths.
    // Use load() with path from Config::models_dir instead.

    /// Format the full reranker prompt
    fn format_prompt(&self, instruction: &str, query: &str, document: &str) -> String {
        format!(
            "{}{}<Instruct>: {}\n<Query>: {}\n<Document>: {}{}{}",
            SYSTEM_PROMPT,
            USER_PREFIX,
            instruction,
            query,
            document,
            USER_SUFFIX,
            ASSISTANT_THINKING
        )
    }

    /// Score relevance between query and document (default instruction)
    pub fn score(&self, query: &str, document: &str) -> Result<f32> {
        self.score_with_instruction(DEFAULT_INSTRUCTION, query, document)
    }

    /// Score with custom instruction
    ///
    /// Returns P(yes) / (P(yes) + P(no)) from final position logits.
    /// This is the base score that Pillar 1 (Persona-Skewed Rerank) multiplies.
    pub fn score_with_instruction(
        &self,
        instruction: &str,
        query: &str,
        document: &str,
    ) -> Result<f32> {
        let prompt = self.format_prompt(instruction, query, document);

        // Tokenize
        let encoding = self
            .tokenizer
            .encode(prompt.as_str(), true)
            .map_err(|e| anyhow::anyhow!("Tokenization failed: {}", e))?;

        let input_ids = encoding.get_ids();

        // Truncate to 8192 tokens max (model supports 32k but be conservative)
        let max_len = 8192;
        let truncated: Vec<u32> = if input_ids.len() > max_len {
            input_ids[..max_len].to_vec()
        } else {
            input_ids.to_vec()
        };

        let input = Tensor::new(truncated.as_slice(), &self.device)?.unsqueeze(0)?;

        // Forward pass
        // Note: quantized_llama doesn't expose clear_kv_cache()
        // Starting from index_pos=0 handles fresh inference
        let mut model = self.model.lock().unwrap();
        let logits = model.forward(&input, 0)?;

        // Get logits at last position [batch, seq, vocab] -> [vocab]
        let last_logits = logits.squeeze(0)?;
        let logits_vec: Vec<f32> = last_logits.to_vec1()?;

        // Extract logits for "yes" and "no" tokens
        let yes_logit = logits_vec
            .get(self.token_yes as usize)
            .copied()
            .unwrap_or(-10.0);
        let no_logit = logits_vec
            .get(self.token_no as usize)
            .copied()
            .unwrap_or(-10.0);

        // Softmax over [yes, no] and return P(yes)
        // score = exp(yes) / (exp(yes) + exp(no))
        let max_logit = yes_logit.max(no_logit);
        let yes_exp = (yes_logit - max_logit).exp();
        let no_exp = (no_logit - max_logit).exp();
        let score = yes_exp / (yes_exp + no_exp);

        Ok(score)
    }

    /// Rerank documents, return sorted (index, score) pairs
    ///
    /// This produces base scores. For Pillar 1 (Persona-Skewed Rerank),
    /// call `score_with_persona_bias()` on CAG instead.
    pub fn rerank(&self, query: &str, documents: &[String]) -> Result<Vec<(usize, f32)>> {
        let mut results: Vec<(usize, f32)> = documents
            .iter()
            .enumerate()
            .map(|(i, doc)| {
                let score = self.score(query, doc).unwrap_or(0.0);
                (i, score)
            })
            .collect();

        // Sort descending by score
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        Ok(results)
    }

    /// Check if model files are present
    pub fn verify_model(&self) -> ModelStatus {
        ModelStatus {
            model: self.model_path().exists(),
            tokenizer: self.tokenizer_path().exists(),
        }
    }

    /// Get path to reranker model
    pub fn model_path(&self) -> PathBuf {
        self.models_dir.join("Qwen3-Reranker-0.6B-q8_0.gguf")
    }

    /// Get path to tokenizer
    pub fn tokenizer_path(&self) -> PathBuf {
        self.models_dir.join("tokenizer.json")
    }

    /// List available quantization variants in the directory
    pub fn list_variants(&self) -> Result<Vec<String>> {
        if !self.models_dir.exists() {
            return Ok(vec![]);
        }

        let mut variants = Vec::new();
        for entry in std::fs::read_dir(&self.models_dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".gguf") {
                variants.push(name);
            }
        }
        variants.sort();
        Ok(variants)
    }
}

/// A query-document pair to rerank
#[derive(Debug, Clone)]
pub struct RerankPair {
    pub query: String,
    pub document: String,
}

/// Rerank result with index for sorting
#[derive(Debug, Clone)]
pub struct RerankResult {
    /// Score between 0 and 1 (probability document is relevant)
    pub score: f32,
    /// Original document index
    pub index: usize,
}

/// Status of reranker model files
#[derive(Debug, Clone)]
pub struct ModelStatus {
    pub model: bool,
    pub tokenizer: bool,
}

impl std::fmt::Display for ModelStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Model: {}, Tokenizer: {}",
            if self.model { "OK" } else { "MISSING" },
            if self.tokenizer { "OK" } else { "MISSING" },
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Requires model files
    fn test_reranker_scores_in_range() {
        let paths = ModelPaths::default_dp_alpha();
        let reranker = RerankerBackend::load(&paths.reranker_dir).unwrap();

        let score = reranker
            .score("rust programming", "Rust is a systems programming language")
            .unwrap();

        assert!(score >= 0.0 && score <= 1.0, "Score must be 0-1, got {}", score);
    }

    #[test]
    #[ignore] // Requires model files
    fn test_reranker_distinguishes_relevance() {
        let paths = ModelPaths::default_dp_alpha();
        let reranker = RerankerBackend::load(&paths.reranker_dir).unwrap();

        let relevant_score = reranker
            .score("rust borrow checker", "The borrow checker in Rust ensures memory safety")
            .unwrap();

        let irrelevant_score = reranker
            .score("rust borrow checker", "Python is a dynamically typed language")
            .unwrap();

        assert!(
            relevant_score > irrelevant_score,
            "Relevant doc should score higher: {} vs {}",
            relevant_score,
            irrelevant_score
        );
    }

    #[test]
    #[ignore] // Requires model files
    fn test_reranker_rerank_sorts() {
        let paths = ModelPaths::default_dp_alpha();
        let reranker = RerankerBackend::load(&paths.reranker_dir).unwrap();

        let docs = vec![
            "JavaScript is for web development".to_string(),
            "Rust's ownership system prevents data races".to_string(),
            "Python is easy to learn".to_string(),
        ];

        let results = reranker.rerank("rust ownership", &docs).unwrap();

        // Should be sorted descending
        for i in 1..results.len() {
            assert!(
                results[i - 1].1 >= results[i].1,
                "Results should be sorted descending"
            );
        }
    }
}
