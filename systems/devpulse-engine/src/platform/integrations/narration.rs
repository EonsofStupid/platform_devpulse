//! Clyffy narration — maps model-loader events to human-friendly messages.
//!
//! Two levels: Layman (no jargon) and Advanced (technical details).

use devpulse_clyffy::model_loader::LoaderEvent;

/// User competency level — determines narration vocabulary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompetencyLevel {
    /// New user — no jargon.
    Layman,
    /// Experienced user — technical details welcome.
    Advanced,
}

/// Generate a Clyffy narration message for a loader event.
#[must_use]
pub fn narrate(event: &LoaderEvent, level: CompetencyLevel) -> Option<String> {
    match (event, level) {
        // ── Loading ────────────────────────────────────────────
        (LoaderEvent::LoadingStarted { slot_id, model_id }, CompetencyLevel::Layman) => {
            Some(format!(
                "Loading up {} — this one handles {}.",
                friendly_model_name(model_id),
                friendly_slot_purpose(slot_id),
            ))
        }
        (LoaderEvent::LoadingStarted { slot_id, model_id }, CompetencyLevel::Advanced) => {
            Some(format!("Loading {model_id} into {slot_id}. Backend: Candle."))
        }

        (LoaderEvent::LoadingComplete { slot_id, memory: _ }, CompetencyLevel::Layman) => {
            Some(format!(
                "{} is online. Ready to work.",
                friendly_slot_name(slot_id),
            ))
        }
        (LoaderEvent::LoadingComplete { slot_id, memory }, CompetencyLevel::Advanced) => {
            Some(format!(
                "{slot_id} LOADED. {} MB RAM, {} MB VRAM.",
                memory.ram_mb(),
                memory.vram_mb(),
            ))
        }

        (LoaderEvent::LoadingFailed { slot_id, error: _ }, CompetencyLevel::Layman) => {
            Some(format!(
                "Something went wrong loading {}. Let me see what we can do about it.",
                friendly_slot_name(slot_id),
            ))
        }
        (LoaderEvent::LoadingFailed { slot_id, error }, CompetencyLevel::Advanced) => {
            Some(format!("{slot_id} FAILED: {error}"))
        }

        // ── VRAM ───────────────────────────────────────────────
        (
            LoaderEvent::VramInsufficient { .. },
            CompetencyLevel::Layman,
        ) => Some(
            "That model needs more GPU memory than you have free. I can free some up — want me to park something?".to_string()
        ),
        (
            LoaderEvent::VramInsufficient {
                needed_mb,
                available_mb,
                ..
            },
            CompetencyLevel::Advanced,
        ) => Some(format!(
            "VRAM budget exceeded: need {needed_mb} MB, {available_mb} MB free."
        )),

        // ── Download ───────────────────────────────────────────
        (LoaderEvent::DownloadStarted { filename, .. }, CompetencyLevel::Layman) => {
            Some(format!("Grabbing {filename} from HuggingFace. Sit tight."))
        }
        (
            LoaderEvent::DownloadStarted {
                repo_id, filename, ..
            },
            CompetencyLevel::Advanced,
        ) => Some(format!("Fetching {repo_id}/{filename}.")),

        (LoaderEvent::DownloadComplete { .. }, CompetencyLevel::Layman) => {
            Some("Download complete! Model added to your library.".to_string())
        }
        (
            LoaderEvent::DownloadComplete {
                registry_entry, ..
            },
            CompetencyLevel::Advanced,
        ) => Some(format!(
            "Downloaded {}. {} MB. Arch: {}.",
            registry_entry.filename,
            registry_entry.size_bytes / (1024 * 1024),
            registry_entry.architecture,
        )),

        (LoaderEvent::DownloadFailed { error: _, .. }, CompetencyLevel::Layman) => {
            Some("Download got interrupted. I can try again if you want.".to_string())
        }
        (LoaderEvent::DownloadFailed { error, .. }, CompetencyLevel::Advanced) => {
            Some(format!("Download failed: {error}"))
        }

        // ── Slot ───────────────────────────────────────────────
        (LoaderEvent::SlotAssigned { slot_id, model_id }, CompetencyLevel::Layman) => {
            Some(format!(
                "Got it — {} is now your {}.",
                friendly_model_name(model_id),
                friendly_slot_purpose(slot_id),
            ))
        }
        (LoaderEvent::SlotAssigned { slot_id, model_id }, CompetencyLevel::Advanced) => {
            Some(format!("{slot_id} assigned: {model_id}."))
        }

        // ── Scan ───────────────────────────────────────────────
        (LoaderEvent::RegistryScanComplete { models_found }, CompetencyLevel::Layman) => {
            if *models_found == 0 {
                Some("No models found yet. Want me to grab some?".to_string())
            } else {
                Some(format!("Found {models_found} models in your library."))
            }
        }
        (LoaderEvent::RegistryScanComplete { models_found }, CompetencyLevel::Advanced) => {
            Some(format!("Registry scan: {models_found} models discovered."))
        }

        // ── Unload ─────────────────────────────────────────────
        (LoaderEvent::UnloadComplete { slot_id, freed: _ }, CompetencyLevel::Layman) => {
            Some(format!(
                "Parked {}. Freed up some GPU memory.",
                friendly_slot_name(slot_id),
            ))
        }
        (LoaderEvent::UnloadComplete { slot_id, freed }, CompetencyLevel::Advanced) => {
            Some(format!(
                "{slot_id} unloaded. Freed {} MB VRAM, {} MB RAM.",
                freed.vram_mb(),
                freed.ram_mb(),
            ))
        }

        // Events without narration (hardware metrics, progress, etc.)
        _ => None,
    }
}

/// Convert slot ID to a friendly name for layman mode.
fn friendly_slot_name(slot_id: &str) -> &str {
    match slot_id {
        "chat.brain" => "the AI Brain",
        "minion.shared" => "the Minion Engine",
        "minion.escalation" => "the Deep Reasoning Engine",
        "rag.embedder" => "the Search Engine",
        "rag.reranker" => "the Relevance Scorer",
        "vision.embedder" => "the Vision System",
        "voice.stt" => "Voice Input",
        "voice.tts" => "Voice Output",
        _ => slot_id,
    }
}

/// Convert slot ID to a purpose description for layman mode.
fn friendly_slot_purpose(slot_id: &str) -> &str {
    match slot_id {
        "chat.brain" => "the heavy thinking",
        "minion.shared" => "quick background tasks",
        "minion.escalation" => "deep analysis when the quick model isn't enough",
        "rag.embedder" => "finding relevant code and docs",
        "rag.reranker" => "ranking search results",
        "vision.embedder" => "understanding screenshots",
        "voice.stt" => "listening to your voice",
        "voice.tts" => "speaking responses",
        _ => "its assigned task",
    }
}

/// Convert model ID to a friendly display name.
fn friendly_model_name(model_id: &str) -> &str {
    // Strip common prefixes and quant suffixes for layman display
    if model_id.contains("14B") || model_id.contains("14b") {
        "the big brain model"
    } else if model_id.contains("4B") || model_id.contains("4b") {
        "the medium brain model"
    } else if model_id.contains("0.6B") || model_id.contains("0.6b") {
        "the fast worker model"
    } else if model_id.contains("embed") || model_id.contains("nomic") {
        "the search model"
    } else {
        model_id
    }
}
