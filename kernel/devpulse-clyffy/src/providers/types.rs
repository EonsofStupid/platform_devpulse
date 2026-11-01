//! Public type vocabulary for the AI provider registry.
//!
//! All enums and structs are `pub`, `#[derive(Serialize)]` (plus `specta::Type`
//! under the `specta` feature), and use
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

/// Stable wire identifier for a provider.
///
/// Used in config files, telemetry, devtool URLs, lane router selection.
/// Renaming a variant is a breaking change — bump the engine major version.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum ProviderId {
    /// Anthropic Claude via the official REST API (API key billing).
    AnthropicApi,
    /// Claude Code — Anthropic's coding agent on your own subscription.
    /// Reached only through Claude Code's own program: its headless mode,
    /// and as the host that spawns `DevPulse`'s MCP server. Never the Agent
    /// SDK, never a token in `DevPulse` (owner ruling 2026-10-20).
    ClaudeCode,
    /// Claude Desktop — Anthropic's desktop app. No programmatic chat;
    /// `DevPulse` offers it context over MCP.
    ClaudeDesktop,
    /// Codex — `OpenAI`'s coding agent on your `ChatGPT` plan, through its
    /// ACP connector running your own Codex.
    Codex,
    /// Gemini CLI — Google's coding agent (native ACP).
    GeminiCli,
    /// Cursor CLI — Cursor's coding agent (`agent acp`).
    Cursor,
    /// Grok Build — xAI's coding agent (`grok agent stdio`, ACP).
    GrokBuild,
    /// Antigravity — Google's agent IDE (desktop app); hosts MCP servers.
    Antigravity,
    /// Antigravity CLI (`agy`) — Google's terminal agent on your Google
    /// subscription.
    AntigravityCli,
    /// `OpenAI` (api.openai.com).
    OpenAi,
    /// Google Gemini (generativelanguage.googleapis.com).
    GoogleGemini,
    /// Mistral la Plateforme (api.mistral.ai).
    Mistral,
    /// Cohere (api.cohere.com).
    Cohere,
    /// xAI Grok (api.x.ai).
    Xai,
    /// `DeepSeek` (api.deepseek.com).
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

impl ProviderId {
    /// The wire id, as it appears in config files (`claude-code`) — the
    /// same string serde writes.
    #[must_use]
    pub const fn key(self) -> &'static str {
        match self {
            Self::AnthropicApi => "anthropic-api",
            Self::ClaudeCode => "claude-code",
            Self::ClaudeDesktop => "claude-desktop",
            Self::Codex => "codex",
            Self::GeminiCli => "gemini-cli",
            Self::Cursor => "cursor",
            Self::GrokBuild => "grok-build",
            Self::Antigravity => "antigravity",
            Self::AntigravityCli => "antigravity-cli",
            Self::OpenAi => "open-ai",
            Self::GoogleGemini => "google-gemini",
            Self::Mistral => "mistral",
            Self::Cohere => "cohere",
            Self::Xai => "xai",
            Self::DeepSeek => "deep-seek",
            Self::Groq => "groq",
            Self::Together => "together",
            Self::Fireworks => "fireworks",
            Self::Replicate => "replicate",
            Self::HuggingFace => "hugging-face",
            Self::Ollama => "ollama",
            Self::LmStudio => "lm-studio",
            Self::Vllm => "vllm",
        }
    }
}

/// Vendor brand grouping for display + filtering.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum Vendor {
    /// Anthropic (Claude).
    Anthropic,
    /// Cursor (Anysphere).
    Cursor,
    /// `OpenAI`.
    OpenAi,
    /// Google (Gemini).
    Google,
    /// Mistral AI.
    Mistral,
    /// Cohere.
    Cohere,
    /// xAI (Grok).
    Xai,
    /// `DeepSeek`.
    DeepSeek,
    /// Groq.
    Groq,
    /// Together AI.
    Together,
    /// Fireworks AI.
    Fireworks,
    /// Replicate.
    Replicate,
    /// Hugging Face.
    HuggingFace,
    /// Ollama (local).
    Ollama,
    /// LM Studio (local).
    LmStudio,
    /// vLLM (self-hosted).
    Vllm,
}

/// How the operator pays for compute.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case", tag = "kind")]
pub enum Transport {
    /// REST with bearer-style API key. `base_url` includes the API version
    /// path component (e.g. `https://api.anthropic.com/v1`).
    ApiKey {
        /// Full base URL including API version path component.
        base_url: &'static str,
    },
    /// REST that conforms to `OpenAI`'s `/v1/chat/completions` contract.
    /// One client (`async-openai`) handles every entry tagged this way —
    /// the lane router just swaps `base_url` and key per provider.
    OpenAiCompatible {
        /// Full base URL of the OpenAI-compatible endpoint.
        base_url: &'static str,
    },
    /// Subprocess MCP — provider's CLI (Claude Code) or app (Claude
    /// Desktop) spawns a local subprocess that speaks JSON-RPC over
    /// stdio. We never call this directly; we register ourselves as a
    /// subprocess in the provider's config and let them spawn us.
    SubprocessMcp {
        /// Which subprocess-MCP host owns the spawn lifecycle.
        client: McpClient,
    },
    /// HTTP server bound to `localhost:port` (Ollama, LM Studio, vLLM).
    /// Detection scans the port; reachability is a runtime concern.
    LocalHttp {
        /// Conventional default port for the local server.
        default_port: u16,
    },
    /// The vendor's own agent program, started by `DevPulse` on your
    /// machine under your own login (its `connect` data says how).
    AgentCli {
        /// How `DevPulse` talks to it.
        protocol: AgentProtocol,
    },
}

/// How `DevPulse` talks to an agent program.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum AgentProtocol {
    /// The Agent Client Protocol over stdio.
    Acp,
    /// The agent's own headless mode (the question as an argument or on
    /// stdin, the answer on stdout).
    Headless,
}

/// Which subprocess-MCP host owns the spawn lifecycle.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum McpClient {
    /// Claude Code CLI (`~/.claude/settings.json`).
    ClaudeCode,
    /// Claude Desktop native app (platform-specific config dir).
    ClaudeDesktop,
    /// Antigravity's IDE (`~/.gemini/antigravity/mcp_config.json`).
    Antigravity,
}

/// What a provider can do. Drives capability filters in the devtool and
/// router task-type matching ("which providers serve embeddings?").
///
/// Plain bools rather than a bitflag crate so the JSON shape stays
/// trivially readable on the frontend without a decoder layer. The
/// six-bool count is intentional — six independent capability axes
/// match the published API surface, not a state machine in disguise,
/// and the devtool filter UI binds one checkbox per field.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[allow(clippy::struct_excessive_bools)]
pub struct Capabilities {
    /// Conversational completions (`/v1/chat/completions` or vendor equivalent).
    pub chat: bool,
    /// Vector embeddings endpoint.
    pub embedding: bool,
    /// Function / tool calling in chat responses.
    pub tool_use: bool,
    /// Image input (multimodal vision).
    pub vision: bool,
    /// Speech-to-text or text-to-speech endpoint.
    pub voice: bool,
    /// JSON-schema-constrained structured outputs.
    pub structured_outputs: bool,
}

/// Which Rust crate / module backs the wire calls.
///
/// `AsyncOpenAi` covers ten providers (every `OpenAiCompatible` transport
/// in the registry) by parametrizing `base_url`. Native backends are
/// hand-rolled `reqwest` because no official Rust SDKs exist for those
/// vendors as of April 2026.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
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
    /// The official `agent-client-protocol` crate, talking to the agent
    /// over stdio.
    AgentClientProtocol,
    /// The vendor's own program in its headless mode.
    VendorHeadless,
}

/// Devtool tab grouping. A provider can carry several classifications.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum Classification {
    /// Speaks the `OpenAI` Chat Completions wire format. Single client,
    /// many backends.
    OpenAiCompatible,
    /// Has its own wire protocol — needs a dedicated client.
    Native,
    /// Runs on the operator's machine (Ollama, LM Studio, vLLM).
    Local,
    /// Your own subscription, reached through the vendor's own program
    /// (it owns the login and the billing).
    SubscriptionPath,
    /// A desktop app: no programmatic chat; `DevPulse` can offer it context.
    DesktopApp,
}

/// One row in the SSOT registry.
#[derive(Debug, Clone, Copy, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct AiProvider {
    /// Stable wire identifier — used in config files, telemetry, devtool URLs.
    pub id: ProviderId,
    /// Layman-friendly name for the devtool header.
    pub display_name: &'static str,
    /// Brand grouping for filters and badges.
    pub vendor: Vendor,
    /// Billing model the operator faces when calling this provider.
    pub billing: BillingModel,
    /// Every wire transport the vendor exposes (most have one, Ollama has two).
    pub transports: &'static [Transport],
    /// Published capability surface — drives router task-type matching.
    pub capabilities: Capabilities,
    /// Which Rust crate / module backs the wire calls.
    pub sdk: SdkBackend,
    /// Canonical vendor docs URL — devtool surfaces this as a link.
    pub docs_url: &'static str,
    /// Devtool tab grouping (a provider can carry several).
    pub classifications: &'static [Classification],
}

impl AiProvider {
    /// HTTP endpoints may require a credential regardless of where they run
    /// or how they are billed. Subscription programs own their own sign-in.
    #[must_use]
    pub fn supports_api_key(&self) -> bool {
        self.transports.iter().any(|transport| {
            matches!(
                transport,
                Transport::ApiKey { .. }
                    | Transport::OpenAiCompatible { .. }
                    | Transport::LocalHttp { .. }
            )
        })
    }
}
