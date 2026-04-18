//! Typed semantic convention constants for `gen_ai.*` and `devpulse.*` attributes.
//!
//! ## Doctrine
//!
//! Inline `"gen_ai.request.model"` strings are **banned** across the workspace
//! (enforced by preflight grep in SPRINT-TELEMETRY-FOUNDATION P8). All OTel
//! attribute keys are referenced through this module's constants so that:
//!
//! 1. Attribute names cannot drift (`gen_ai.request.model` vs `gen_ai.request_model`)
//! 2. Semconv version migration is a one-file change when `gen_ai` stabilizes
//!
//! Pinned against **OpenTelemetry Semantic Conventions v1.37** (gen_ai experimental).

use opentelemetry::KeyValue;

// ── gen_ai.* (OpenTelemetry GenAI semconv v1.37, experimental) ────────────

/// `gen_ai.system` — identifies the GenAI system (e.g. "devpulse", "openai").
pub const GEN_AI_SYSTEM: &str = "gen_ai.system";

/// `gen_ai.operation.name` — operation kind: "chat", "text_completion", "embeddings".
pub const GEN_AI_OPERATION_NAME: &str = "gen_ai.operation.name";

/// `gen_ai.request.model` — model ID requested by the caller.
pub const GEN_AI_REQUEST_MODEL: &str = "gen_ai.request.model";

/// `gen_ai.response.model` — model ID that actually served the request.
pub const GEN_AI_RESPONSE_MODEL: &str = "gen_ai.response.model";

/// `gen_ai.request.temperature` — sampling temperature.
pub const GEN_AI_REQUEST_TEMPERATURE: &str = "gen_ai.request.temperature";

/// `gen_ai.request.max_tokens` — max token budget.
pub const GEN_AI_REQUEST_MAX_TOKENS: &str = "gen_ai.request.max_tokens";

/// `gen_ai.usage.input_tokens` — prompt token count.
pub const GEN_AI_USAGE_INPUT_TOKENS: &str = "gen_ai.usage.input_tokens";

/// `gen_ai.usage.output_tokens` — completion token count.
pub const GEN_AI_USAGE_OUTPUT_TOKENS: &str = "gen_ai.usage.output_tokens";

/// `gen_ai.response.finish_reasons` — why the model stopped.
pub const GEN_AI_RESPONSE_FINISH_REASONS: &str = "gen_ai.response.finish_reasons";

/// `gen_ai.agent.id` — unique identifier for an agent instance.
pub const GEN_AI_AGENT_ID: &str = "gen_ai.agent.id";

/// `gen_ai.agent.name` — human-readable agent name.
pub const GEN_AI_AGENT_NAME: &str = "gen_ai.agent.name";

// ── devpulse.* (DevPulse-specific, mirrors signals.registry.yaml families) ──

/// `devpulse.termination_reason` — why an agent/minion/inference span ended.
/// Values: completed, tool_error, timeout, budget_exhausted, user_cancel,
///         parent_cancel, model_refusal
pub const DEVPULSE_TERMINATION_REASON: &str = "devpulse.termination_reason";

/// `devpulse.vram_start_mb` — VRAM usage at span start (megabytes).
pub const DEVPULSE_VRAM_START_MB: &str = "devpulse.vram_start_mb";

/// `devpulse.vram_end_mb` — VRAM usage at span end (megabytes).
pub const DEVPULSE_VRAM_END_MB: &str = "devpulse.vram_end_mb";

/// `devpulse.model_sha` — model file hash for traceability.
pub const DEVPULSE_MODEL_SHA: &str = "devpulse.model_sha";

/// `devpulse.prompt_hash` — hash of the assembled prompt (no content, just identity).
pub const DEVPULSE_PROMPT_HASH: &str = "devpulse.prompt_hash";

/// `devpulse.cache_hit` — whether the response was served from cache.
pub const DEVPULSE_CACHE_HIT: &str = "devpulse.cache_hit";

/// `devpulse.slot_id` — model slot identifier (brain, helper, vision, etc.).
pub const DEVPULSE_SLOT_ID: &str = "devpulse.slot_id";

/// `devpulse.backend` — inference backend used (candle, ort, llama_cpp).
pub const DEVPULSE_BACKEND: &str = "devpulse.backend";

// ── Termination reason enum values ───────────────────────────────────────

/// Valid values for [`DEVPULSE_TERMINATION_REASON`].
pub mod termination {
    /// Inference completed normally.
    pub const COMPLETED: &str = "completed";
    /// A tool call returned an error.
    pub const TOOL_ERROR: &str = "tool_error";
    /// Timed out before completion.
    pub const TIMEOUT: &str = "timeout";
    /// Token budget exhausted.
    pub const BUDGET_EXHAUSTED: &str = "budget_exhausted";
    /// User explicitly cancelled.
    pub const USER_CANCEL: &str = "user_cancel";
    /// Parent task cancelled this subtask.
    pub const PARENT_CANCEL: &str = "parent_cancel";
    /// Model refused to generate (safety filter, etc.).
    pub const MODEL_REFUSAL: &str = "model_refusal";
}

// ── Resource attributes ──────────────────────────────────────────────────

/// Build the standard DevPulse resource attributes for the tracer provider.
#[must_use]
pub fn devpulse_resource(version: &str, session_id: &str) -> Vec<KeyValue> {
    vec![
        KeyValue::new("service.name", "devpulse"),
        KeyValue::new("service.namespace", "desktop"),
        KeyValue::new("service.version", version.to_owned()),
        KeyValue::new("service.instance.id", session_id.to_owned()),
    ]
}
