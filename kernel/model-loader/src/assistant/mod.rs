//! Assistant configuration — identity, wake word, voice profile, keyword
//! actions, window idle behaviour, partial offload hints.
//!
//! Loaded from `{userdata}/config/assistant.toml` with a compile-time
//! default embedded from `kernel/model-loader/config/assistant.default.toml`.
//! The Voice Lab panel in the setup wizard is the canonical UI that
//! mutates this config through the `set_*` / `add_*` Tauri commands.
//!
//! **Never** logs any field that could be user-sensitive. Wake phrases,
//! assistant names, voice profile IDs, and keyword phrases are all
//! logged at the tracing target `assistant` for devtool inspection, but
//! the custom voice clone reference audio paths stay out of the tracing
//! output entirely (the files themselves live under
//! `{userdata}/voice/custom/`, which is user-controlled).

pub mod config;

pub use config::{
    AssistantAction, AssistantConfig, IdentityConfig, KeywordActionEntry, OffloadConfig, TtsConfig,
    VoiceBrainConfig, VoiceCloneEntry, WakeConfig, WindowConfig,
};
