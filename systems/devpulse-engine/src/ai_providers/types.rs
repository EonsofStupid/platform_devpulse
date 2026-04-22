//! Public type vocabulary for the AI provider registry.
//!
//! All enums and structs are `pub`, `#[derive(Serialize, Type)]`, and use
//! kebab-case JSON tags so the frontend bindings stay stable. No clones,
//! no Strings — every field is `&'static`-friendly so the registry can
//! live in const data.
//!
//! # Boundaries
//! - `ProviderId` — stable wire identifier for cross-system references
//!   (config files, telemetry, devtool URLs). Rename = breaking change.
//! - `Vendor` — display + grouping only.
//! - `Classification` — drives devtool tabbing.
//! - `Transport` / `SdkBackend` — drives router + client construction.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Stable wire identifier for a provider.
///
/// Used in config files, telemetry, devtool URLs, lane router selection.
/// Renaming a variant is a breaking change — bump the engine major version.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderId {
    /// Anthropic Claude via the official REST API (API key billing).
    AnthropicApi,
    /// Anthropic Claude via Claude Code / Claude Desktop subprocess MCP.
    /// Dev-only — release builds hide this and the lane router refuses it
    /// unless the operator has prior approval from Anthropic per the Agent
    /// SDK Terms of Service.
    AnthropicSubscription,
    /// OpenAI (api.openai.com).
    OpenAi,
    /// Google Gemini (generativelanguage.googleapis.com).
    GoogleGemini,
    /// Mistral la Plateforme (api.mistral.ai).
    Mistral,
    /// Cohere (api.cohere.com).
    Cohere,
    /// xAI Grok (api.x.ai).
    Xai,
    /// DeepSeek (api.deepseek.com).
    DeepSeek,
    /// Groq (api.groq.com).
    Groq,
    /// Together AI (api.together.xyz).
    Together,
    /// Fireworks AI (api.fireworks.ai).
    Fireworks,
    /// Replicate (api.replicate.com).
    Replicate,
    /// Hugging Face Inference Endpoints.
    HuggingFace,
    /// Ollama running locally (localhost:11434).
    Ollama,
    /// LM Studio running locally (localhost:1234).
    LmStudio,
    /// vLLM running locally or on the LAN.
    Vllm,
}

/// Vendor brand grouping for display + filtering.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum Vendor {
    Anthropic,
    OpenAi,
    Google,
    Mistral,
    Cohere,
    Xai,
    DeepSeek,
    Groq,
    Together,
    Fireworks,
    Replicate,
    HuggingFace,
    Ollama,
    LmStudio,
    Vllm,
}

/// How the operator pays for compute.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum BillingModel {
    /// Pay per input/output token at request time.
    PerToken,
    /// Monthly fee with usage caps; "free" within the cap.
    /// Subscription paths require operator-side compliance with the
    /// vendor's terms — see `ProviderId::AnthropicSubscription` doc.
    Subscription,
    /// User's own compute (local CPU/GPU). No vendor billing.
    Local,
}

/// Where the wire calls go.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case", tag = "kind")]
pub enum Transport {
    /// REST with bearer-style API key. `base_url` includes the API version
    /// path component (e.g. `https://api.anthropic.com/v1`).
    ApiKey { base_url: &'static str },
    /// REST that conforms to OpenAI's `/v1/chat/completions` contract.
    /// One client (`async-openai`) handles every entry tagged this way —
    /// the lane router just swaps `base_url` and key per provider.
    OpenAiCompatible { base_url: &'static str },
    /// Subprocess MCP — provider's CLI (Claude Code) or app (Claude
    /// Desktop) spawns a local subprocess that speaks JSON-RPC over
    /// stdio. We never call this directly; we register ourselves as a
    /// subprocess in the provider's config and let them spawn us.
    SubprocessMcp { client: McpClient },
    /// HTTP server bound to `localhost:port` (Ollama, LM Studio, vLLM).
    /// Detection scans the port; reachability is a runtime concern.
    LocalHttp { default_port: u16 },
}

/// Which subprocess-MCP host owns the spawn lifecycle.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum McpClient {
    /// Claude Code CLI (`~/.claude/settings.json`).
    ClaudeCode,
    /// Claude Desktop native app (platform-specific config dir).
    ClaudeDesktop,
}

/// What a provider can do. Drives capability filters in the devtool and
/// router task-type matching ("which providers serve embeddings?").
///
/// Plain bools rather than a bitflag crate so the JSON shape stays
/// trivially readable on the frontend without a decoder layer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct Capabilities {
    pub chat: bool,
    pub embedding: bool,
    pub tool_use: bool,
    pub vision: bool,
    pub voice: bool,
    pub structured_outputs: bool,
}

/// Which Rust crate / module backs the wire calls.
///
/// `AsyncOpenAi` covers ten providers (every `OpenAiCompatible` transport
/// in the registry) by parametrizing `base_url`. Native backends are
/// hand-rolled `reqwest` because no official Rust SDKs exist for those
/// vendors as of April 2026.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum SdkBackend {
    /// `async-openai` crate, base URL parametrized.
    AsyncOpenAi,
    /// Hand-rolled reqwest for Anthropic Messages API.
    AnthropicNative,
    /// Hand-rolled reqwest for Google Gemini REST.
    GeminiNative,
    /// Hand-rolled reqwest for Cohere.
    CohereNative,
    /// Hand-rolled reqwest for Replicate.
    ReplicateNative,
    /// `hf-hub` for Hugging Face hub + reqwest for inference endpoints.
    HuggingFaceNative,
    /// `ollama-rs` for native features; falls back to `AsyncOpenAi` at
    /// `/v1` when the operator prefers a single client surface.
    OllamaNative,
    /// Not directly callable — provider spawns us. Listed for inventory.
    SubprocessMcp,
}

/// Devtool tab grouping. A provider can carry several classifications.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum Classification {
    /// Speaks the OpenAI Chat Completions wire format. Single client,
    /// many backends.
    OpenAiCompatible,
    /// Has its own wire protocol — needs a dedicated client.
    Native,
    /// Runs on the operator's machine (Ollama, LM Studio, vLLM).
    Local,
    /// Subscription-only path that we don't drive directly.
    SubscriptionPath,
}

/// One row in the SSOT registry.
#[derive(Debug, Clone, Copy, Serialize, Type)]
pub struct AiProvider {
    pub id: ProviderId,
    pub display_name: &'static str,
    pub vendor: Vendor,
    pub billing: BillingModel,
    pub transports: &'static [Transport],
    pub capabilities: Capabilities,
    pub sdk: SdkBackend,
    pub docs_url: &'static str,
    pub classifications: &'static [Classification],
    /// `true` when the entry is hidden from release builds. Set on
    /// providers whose only path is subscription-as-compute.
    pub dev_only: bool,
}
