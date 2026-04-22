//! Clyffy interaction templates — kernel SSOT for structured,
//! scripted exchanges between Clyffy and the user.
//!
//! # What is an interaction?
//!
//! An *interaction* is a finite-state, phase-based exchange between
//! the platform and the user that has a clear beginning, middle, and
//! end. The **Setup Wizard** is the canonical example — a 6-phase
//! walkthrough that detects hardware, picks a preset, downloads
//! models, and exits cleanly.
//!
//! Other planned interactions:
//!
//! - **hardware-change** — triggered when detected hardware changes
//!   from what the `Factory Default` configuration was built against
//! - **welcome-back** — triggered after a long absence, re-orients
//!   the user with a "here's what we were working on" summary
//! - **broken-slot-repair** — triggered when a slot fails to load
//!   and the user needs guided recovery
//! - **model-upgrade-walkthrough** — triggered when a managed-service
//!   update installs a new model version
//!
//! All interactions render through the same overlay primitive in the
//! frontend ([`SetupWizardOverlay`][setup-wizard-overlay]), which
//! switches behaviour based on which interaction template is active.
//!
//! [setup-wizard-overlay]: https://example.invalid/ "placeholder — lives in desktop crate"
//!
//! # Why kernel-owned
//!
//! Interactions declare **scripted copy** (greetings, hints, button
//! labels, error messages) and **state machines** (phase ordering,
//! transition triggers, acceptance gates). Both pieces are content,
//! not logic, so they belong in kernel TOML rather than Svelte code.
//! The frontend overlay reads the template at runtime and renders
//! whatever phase the state machine says is active.
//!
//! Keeping the schema and templates inside `devpulse-clyffy` means:
//!
//! - Interactions can reference kernel-internal terminology
//!   (DIARY, GUARDIAN, etc.) in their raw TOML without breaking the
//!   engine's IP boundary. The loader redacts kernel terms via the
//!   `kernel_terms.toml` dictionary before exposing any interaction
//!   payload to the engine build.
//! - Interaction templates stay with the Cortex code that drives
//!   them, so a new interaction is authored near its handlers
//!   rather than across three crates.
//!
//! # Loader contract
//!
//! Each template lives in `kernel/devpulse-clyffy/config/*.default.toml`
//! and is loaded via `include_str!` at compile time. User overrides
//! land at `{userdata_dir}/config/interactions/<id>.toml` — same
//! full-replace pattern as every other kernel SSOT loader in this
//! sprint.
//!
//! The loader exposes [`InteractionTemplate::setup`] today; future
//! templates add their own dedicated `fn` so consumers can request
//! them by name without string lookup.

use serde::{Deserialize, Serialize};

// ── Template structures ─────────────────────────────────────────

/// A single phase inside an interaction's state machine.
///
/// Phases are ordered, named, and carry pointers into the wizard
/// copy TOML (kept separate so copy translators only edit one file).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InteractionPhase {
    /// Stable phase identifier (`"welcome"`, `"scanning"`, etc.).
    /// Matches the frontend phase-machine enum variant the overlay
    /// uses to decide which sub-component to render.
    pub id: String,

    /// Human-readable label for developer traces and UI breadcrumbs.
    pub label: String,

    /// Copy block name inside `wizard_copy.default.toml` that this
    /// phase renders from (e.g. `"greeting"`, `"scanning"`).
    ///
    /// Empty when the phase renders dynamic content that is not
    /// copy-backed (e.g. the preset picker, which builds its rows
    /// from `list_presets` at runtime).
    #[serde(default)]
    pub copy_block: String,

    /// Ordered list of phase ids this phase can transition to.
    /// The overlay uses this for "Next" button wiring and for
    /// validating that the state machine cannot reach an undeclared
    /// phase.
    #[serde(default)]
    pub next: Vec<String>,

    /// Whether this phase is terminal (no further transitions). The
    /// overlay shows a "Close" button instead of "Next" on terminal
    /// phases.
    #[serde(default)]
    pub terminal: bool,
}

/// A declarative trigger that opens an interaction.
///
/// Triggers are evaluated by the kernel's interaction dispatcher. The
/// frontend overlay never decides on its own whether to open — it
/// receives a "show this template now" signal from the platform
/// based on trigger evaluation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum InteractionTrigger {
    /// Fires on first run — no `Factory Default` configuration exists
    /// in libSQL AND `chat.brain` has no assigned model. Authoritative
    /// signal per D12.
    FirstRun,
    /// Fires when the user invokes the interaction manually from a
    /// menu, keyboard shortcut, or command palette entry.
    Manual,
    /// Fires when detected hardware changes materially from what the
    /// current `Factory Default` configuration was built against.
    HardwareChanged,
    /// Fires when a slot fails to load and the user needs guided
    /// recovery.
    SlotBroken {
        /// The slot id whose load failure triggered this interaction.
        slot_id: String,
    },
}

/// A complete interaction template.
///
/// Templates are **data**, not code. The kernel loader parses them
/// from TOML and hands them to the engine facade, which in turn hands
/// them to the frontend overlay via a Tauri command. Every phase
/// transition fires a `SignalVariant::System` event through the
/// (future) `SignalBridge` so the `Monitor` tab in Slot Config can see
/// the whole interaction play out.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InteractionTemplate {
    /// Stable template identifier (e.g. `"setup"`,
    /// `"hardware-change"`). Used as the TOML file stem and as the
    /// Tauri event channel suffix.
    pub id: String,

    /// One-line description for developer logs and template browsers.
    pub description: String,

    /// Ordered list of triggers that open this interaction.
    /// Evaluated in order — the first trigger that matches opens
    /// the overlay.
    #[serde(default)]
    pub triggers: Vec<InteractionTrigger>,

    /// Phase machine. Position in the array is the default entry
    /// order; the actual runtime order follows each phase's `next`
    /// pointers.
    pub phases: Vec<InteractionPhase>,

    /// Entry phase id — the state machine starts here. Must match
    /// exactly one phase in `phases`.
    pub entry_phase: String,
}

impl InteractionTemplate {
    /// Load the setup wizard template bundled with the binary.
    ///
    /// Reads `kernel/devpulse-clyffy/config/interactions/setup.default.toml`
    /// via `include_str!`. User overrides at
    /// `{userdata_dir}/config/interactions/setup.toml` fully replace
    /// the embedded default (same pattern as every other kernel
    /// config loader — no merging).
    ///
    /// # Errors
    ///
    /// Returns [`InteractionError::EmbeddedParse`] if the embedded
    /// default is malformed (build-time bug). User override parse
    /// failures are logged as warnings and the loader falls back to
    /// the embedded default.
    pub fn setup(userdata_dir: &std::path::Path) -> Result<Self, InteractionError> {
        const DEFAULT_TOML: &str = include_str!("../../config/interactions/setup.default.toml");
        load_template(
            "setup",
            DEFAULT_TOML,
            &userdata_dir
                .join("config")
                .join("interactions")
                .join("setup.toml"),
        )
    }

    /// Validate that every `next` pointer in the phase machine
    /// references an existing phase id, and that `entry_phase` exists.
    ///
    /// Called automatically by [`load_template`] after parsing; also
    /// exposed publicly so test suites can validate handcrafted
    /// templates before handing them to the loader.
    ///
    /// # Errors
    /// Returns an error if `entry_phase` is missing, a `next` reference points
    /// to an unknown phase, or a terminal phase still declares transitions.
    pub fn validate(&self) -> Result<(), InteractionError> {
        let ids: std::collections::HashSet<&str> =
            self.phases.iter().map(|p| p.id.as_str()).collect();

        if !ids.contains(self.entry_phase.as_str()) {
            return Err(InteractionError::UnknownEntryPhase {
                template: self.id.clone(),
                phase: self.entry_phase.clone(),
            });
        }

        for phase in &self.phases {
            for next_id in &phase.next {
                if !ids.contains(next_id.as_str()) {
                    return Err(InteractionError::UnknownNextPhase {
                        template: self.id.clone(),
                        phase: phase.id.clone(),
                        next: next_id.clone(),
                    });
                }
            }
            if phase.terminal && !phase.next.is_empty() {
                return Err(InteractionError::TerminalWithTransitions {
                    template: self.id.clone(),
                    phase: phase.id.clone(),
                });
            }
        }

        Ok(())
    }
}

// ── Errors ──────────────────────────────────────────────────────

/// Errors returned by the interaction template loader.
#[derive(Debug, thiserror::Error)]
pub enum InteractionError {
    /// Embedded default template failed to parse. Build-time bug.
    #[error("embedded interaction template '{template}' is invalid: {source}")]
    EmbeddedParse {
        /// Template id (e.g. `"setup"`).
        template: String,
        /// Underlying parse error.
        #[source]
        source: toml::de::Error,
    },
    /// `entry_phase` does not match any phase id in the template.
    #[error("template '{template}' has unknown entry phase '{phase}'")]
    UnknownEntryPhase {
        /// Template id.
        template: String,
        /// The unresolved entry phase id.
        phase: String,
    },
    /// A phase's `next` pointer references an id that doesn't exist.
    #[error("template '{template}' phase '{phase}' points to unknown next phase '{next}'")]
    UnknownNextPhase {
        /// Template id.
        template: String,
        /// The phase containing the dangling pointer.
        phase: String,
        /// The phase id that was referenced but not defined.
        next: String,
    },
    /// A terminal phase declared additional `next` transitions.
    #[error("template '{template}' phase '{phase}' is terminal but has next transitions")]
    TerminalWithTransitions {
        /// Template id.
        template: String,
        /// The offending phase id.
        phase: String,
    },
}

// ── Loader helper ───────────────────────────────────────────────

/// Shared parse + validate + override path resolution.
///
/// Extracted so every future template (`hardware_change`,
/// `welcome_back`, etc.) follows the exact same flow without
/// duplicating include-and-override logic.
fn load_template(
    id: &str,
    default_toml: &str,
    override_path: &std::path::Path,
) -> Result<InteractionTemplate, InteractionError> {
    if override_path.exists() {
        match std::fs::read_to_string(override_path) {
            Ok(bytes) => match toml::from_str::<InteractionTemplate>(&bytes) {
                Ok(parsed) => {
                    tracing::info!(
                        path = %override_path.display(),
                        template = id,
                        "Loaded user interaction template override"
                    );
                    parsed.validate()?;
                    return Ok(parsed);
                }
                Err(e) => {
                    tracing::warn!(
                        path = %override_path.display(),
                        template = id,
                        error = %e,
                        "Failed to parse user interaction override — falling back to default"
                    );
                }
            },
            Err(e) => {
                tracing::warn!(
                    path = %override_path.display(),
                    template = id,
                    error = %e,
                    "Failed to read user interaction override — falling back to default"
                );
            }
        }
    }

    let parsed: InteractionTemplate =
        toml::from_str(default_toml).map_err(|e| InteractionError::EmbeddedParse {
            template: id.to_string(),
            source: e,
        })?;
    parsed.validate()?;
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn embedded_setup_template_parses() {
        let tmpl = InteractionTemplate::setup(Path::new("/nonexistent"))
            .expect("setup template must load");
        assert_eq!(tmpl.id, "setup");
        assert!(!tmpl.phases.is_empty());
    }

    #[test]
    fn setup_template_entry_phase_exists() {
        let tmpl = InteractionTemplate::setup(Path::new("/nonexistent")).unwrap();
        assert!(
            tmpl.phases.iter().any(|p| p.id == tmpl.entry_phase),
            "entry_phase '{}' not found in phases",
            tmpl.entry_phase
        );
    }

    #[test]
    fn setup_template_has_welcome_and_complete_phases() {
        let tmpl = InteractionTemplate::setup(Path::new("/nonexistent")).unwrap();
        let ids: std::collections::HashSet<&str> =
            tmpl.phases.iter().map(|p| p.id.as_str()).collect();
        assert!(ids.contains("welcome"));
        assert!(ids.contains("complete"));
    }

    #[test]
    fn setup_template_complete_phase_is_terminal() {
        let tmpl = InteractionTemplate::setup(Path::new("/nonexistent")).unwrap();
        let complete = tmpl.phases.iter().find(|p| p.id == "complete").unwrap();
        assert!(complete.terminal);
        assert!(complete.next.is_empty());
    }

    #[test]
    fn setup_template_fires_on_first_run() {
        let tmpl = InteractionTemplate::setup(Path::new("/nonexistent")).unwrap();
        assert!(
            tmpl.triggers
                .iter()
                .any(|t| matches!(t, InteractionTrigger::FirstRun)),
            "setup template must include FirstRun trigger"
        );
    }

    #[test]
    fn validate_catches_terminal_with_transitions() {
        let tmpl = InteractionTemplate {
            id: "bad".into(),
            description: "broken".into(),
            triggers: vec![],
            phases: vec![InteractionPhase {
                id: "only".into(),
                label: "Only".into(),
                copy_block: String::new(),
                next: vec!["only".into()], // terminal AND has next = invalid
                terminal: true,
            }],
            entry_phase: "only".into(),
        };
        assert!(matches!(
            tmpl.validate(),
            Err(InteractionError::TerminalWithTransitions { .. })
        ));
    }

    #[test]
    fn validate_catches_unknown_next_phase() {
        let tmpl = InteractionTemplate {
            id: "bad".into(),
            description: "dangling pointer".into(),
            triggers: vec![],
            phases: vec![InteractionPhase {
                id: "a".into(),
                label: "A".into(),
                copy_block: String::new(),
                next: vec!["nonexistent".into()],
                terminal: false,
            }],
            entry_phase: "a".into(),
        };
        assert!(matches!(
            tmpl.validate(),
            Err(InteractionError::UnknownNextPhase { .. })
        ));
    }

    #[test]
    fn validate_catches_unknown_entry_phase() {
        let tmpl = InteractionTemplate {
            id: "bad".into(),
            description: "bad entry".into(),
            triggers: vec![],
            phases: vec![InteractionPhase {
                id: "a".into(),
                label: "A".into(),
                copy_block: String::new(),
                next: vec![],
                terminal: true,
            }],
            entry_phase: "nonexistent".into(),
        };
        assert!(matches!(
            tmpl.validate(),
            Err(InteractionError::UnknownEntryPhase { .. })
        ));
    }
}
