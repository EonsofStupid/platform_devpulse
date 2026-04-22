//! Capabilities axis — product-facing user verbs.
//!
//! Members are what the user can DO. Each capability composes stores,
//! runtimes, and integrations into a coherent feature. The devtool for a
//! capability is typically the richest per-module UI because it's the
//! surface users configure directly.
//!
//! # Modules (authored as S0 phases land)
//!
//! - `chat` — conversational surface
//! - `reasoning` — ruminating-over-retrieved-context (see `signals.registry.yaml` `rro` group)
//! - `rosetta_stone` — cross-language mapping
//! - `translator` — real-time translation
//! - `voice` — TTS playback and STT pipeline
//! - `model_runtime` — model discovery, download, slot assignment
//!
//! See `config/platform/capabilities/` for the TOML layout.
