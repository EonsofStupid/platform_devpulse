/// Integration adapters (safety, persistence wrappers, KV cache).
pub mod adapters;
/// Context-Augmented Generation (CAG) retrieval pipeline.
pub mod cag;
/// Governance graph — operator-authored reasoning trees per CORTEX.md §4.
pub mod governance;
/// LLM constrained-decoding runtime (`llguidance`-backed). Layman-facing
/// surface is structured-output enforcement on the model token stream —
/// distinct from the writing-grammar / spelling assistant (Harper).
pub mod llguidance;
/// Knowledge library — JSON-backed tips, did-you-know, glossary with libSQL runtime.
pub mod knowledge;
/// KV cache tier for attention optimization.
pub mod kv_cache;
/// Minion task workers.
pub mod minions;
/// Persistence adapters (databases).
pub mod persistence;
/// Reasoning pipeline (chains, HMM).
pub mod reasoning;
/// Type-time chat-input suggestion service. Embeds via the
/// `chat.suggest` slot, recalls from the `chat_prompt` corpus.
pub mod suggest;
/// RRO trifecta (layman entry) — sibling to `llguidance`. Re-exports
/// the state machine from `reasoning` + the vector-store adapter from
/// `persistence::rro`. Embedder + encoder land in Phase D'.
pub mod rro;
/// Trait definitions (memory, reasoning, security contracts).
pub mod traits;

/// Cortex brain state container.
#[derive(Default)]
pub struct Cortex {
    // Brain State
}

impl Cortex {
    /// Create a new cortex instance.
    pub fn new() -> Self {
        Self::default()
    }
}
