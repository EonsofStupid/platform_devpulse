//! Wizard copy — all user-facing strings, loaded from TOML.
//!
//! Loading priority (first match wins):
//!  1. `{userdata}/config/wizard_copy.toml` — user override, editable via devtools UI
//!  2. Embedded `wizard_copy.default.toml` — compile-time default, fallback
//!
//! Frontend hits `get_wizard_copy` Tauri command once at wizard mount.
//! Reload requires platform restart or explicit `WizardCopy::reload(path)`.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Embedded default copy. Always available, even if no user override exists.
const DEFAULT_TOML: &str = include_str!("../../../../systems/devpulse-engine/config/wizard_copy.default.toml");

/// All wizard copy. One root struct, one Tauri call to fetch everything.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct WizardCopy {
    /// Copy for the welcome / greeting step.
    pub greeting: GreetingCopy,
    /// Copy shown while hardware detection is running.
    pub scanning: ScanningCopy,
    /// Copy for the hardware results step.
    pub hardware: HardwareCopy,
    /// Copy for the model-selection step.
    pub models: ModelsCopy,
    /// Copy for the per-slot customization step.
    pub customize: CustomizeCopy,
    /// Copy for the browse / search models step.
    pub browse: BrowseCopy,
    /// Copy for the Clyffy chat activation step.
    pub activate: ActivateCopy,
    /// Copy for the user profile / project-setup step.
    pub profile: ProfileCopy,
    /// Copy for the final completion / launch step.
    pub completion: CompletionCopy,
}

/// Welcome screen — Clyffy greeting and CTA.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct GreetingCopy {
    /// Main heading shown at the top of the welcome screen (e.g. "Hey! I'm Clyffy.").
    pub title: String,
    /// Supporting line below the heading that briefly explains what Clyffy does.
    pub subtitle: String,
    /// Alt text for the Clyffy mascot illustration on the welcome screen.
    pub mascot_alt: String,
    /// Small contextual hint shown beneath the CTA (e.g. keyboard shortcut or next-step note).
    pub hint: String,
    /// Visible label on the primary "Get started" button.
    pub cta_label: String,
    /// `aria-label` for the primary CTA button (screen-reader description of the action).
    pub cta_aria: String,
}

/// Scanning state — shown during hardware detection.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ScanningCopy {
    /// Heading displayed while the hardware probe is running (e.g. "Checking your gear…").
    pub title: String,
    /// Secondary line that reassures the user while detection is in progress.
    pub subtitle: String,
    /// Alt text for the animated Clyffy mascot shown during the scanning state.
    pub mascot_alt: String,
}

/// Hardware detected screen — tier badge, metric cards, tooltips.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct HardwareCopy {
    /// Heading for the hardware results step (e.g. "Here's what you're working with").
    pub title: String,
    /// Card label for the detected GPU name metric.
    pub gpu_label: String,
    /// Card label for the detected VRAM capacity metric.
    pub vram_label: String,
    /// Card label for the detected CPU model metric.
    pub cpu_label: String,
    /// Card label for the detected system RAM metric.
    pub ram_label: String,
    /// Card label for the available disk space metric.
    pub disk_label: String,
    /// Tooltip body explaining what the GPU card shows and why it matters.
    pub gpu_tooltip: String,
    /// Tooltip body explaining VRAM and how it affects model size limits.
    pub vram_tooltip: String,
    /// Tooltip body explaining the CPU card and its role when no GPU is present.
    pub cpu_tooltip: String,
    /// Tooltip body explaining system RAM and its relevance to inference.
    pub ram_tooltip: String,
    /// Tooltip body explaining disk space and what the models will consume.
    pub disk_tooltip: String,
    /// Heading for the inline warning shown when no compatible GPU is detected.
    pub no_gpu_warning_title: String,
    /// Detail text for the no-GPU warning, explaining CPU-only inference limitations.
    pub no_gpu_warning_detail: String,
    /// Template string used to describe what the wizard recommends next; may include a `{tier}` placeholder.
    pub next_step_template: String,
    /// Visible label on the "Continue" button that advances to model selection.
    pub continue_label: String,
    /// `aria-label` for the continue button (screen-reader description).
    pub continue_aria: String,
}

/// Models setup screen — preset card, recommendations.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ModelsCopy {
    /// Heading for the model-selection step (e.g. "Let's pick your brain").
    pub title: String,
    /// Subtitle shown when tier-based model recommendations are available.
    pub subtitle_with_recs: String,
    /// Subtitle shown when no tier recommendations could be determined.
    pub subtitle_no_recs: String,
    /// Label on the primary "Set up recommended models" action button.
    pub setup_button_label: String,
    /// Label replacing the setup button while downloads / setup is running.
    pub setup_in_progress_label: String,
    /// Inline success message shown when all recommended models are ready.
    pub setup_complete_message: String,
    /// Label on the retry action shown inside an error state card.
    pub error_retry_label: String,
    /// Label on the "pick manually" fallback link shown in the error state.
    pub error_pick_manually_label: String,
    /// Label on the "skip for now" option shown in the error state.
    pub error_skip_label: String,
    /// Link text that navigates to the per-slot customization step.
    pub customize_link_label: String,
    /// Link text that navigates to the browse / search models step.
    pub browse_link_label: String,
    /// Label on the button that advances to the next wizard step.
    pub continue_label: String,
    /// Label on the button that returns to the hardware step.
    pub back_label: String,
}

/// Customize screen — slot cards grouped by role.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct CustomizeCopy {
    /// Heading for the customization step (e.g. "Fine-tune your setup").
    pub title: String,
    /// Supporting line explaining that users can swap individual model slots.
    pub subtitle: String,
    /// Section heading for the "Thinking" role group (language / reasoning models).
    pub group_thinking: String,
    /// Section heading for the "Watching" role group (vision models).
    pub group_watching: String,
    /// Section heading for the "Understanding" role group (embedding / memory models).
    pub group_understanding: String,
    /// Section heading for the "Talking" role group (voice synthesis / STT models).
    pub group_talking: String,
    /// Link text that opens the browse / search models panel from the customization step.
    pub browse_link_label: String,
    /// Label on the button that confirms the custom slot selections and advances the wizard.
    pub done_label: String,
    /// Label on the button that returns to the model-selection step.
    pub back_label: String,
}

/// Browse / Search models screen.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct BrowseCopy {
    /// Heading for the browse / search step (e.g. "Find a model").
    pub title: String,
    /// Supporting line explaining how to search HuggingFace or scan local folders.
    pub subtitle: String,
    /// Label for the tab that lists models already downloaded to disk.
    pub local_tab_label: String,
    /// Label for the tab that searches the online model registry.
    pub online_tab_label: String,
    /// Placeholder text inside the model search input field.
    pub search_placeholder: String,
    /// Visible label on the search submit button.
    pub search_button_label: String,
    /// Heading shown in the results area when a search returns no matches.
    pub no_results_title: String,
    /// Hint below the no-results heading suggesting alternative search terms or formats.
    pub no_results_hint: String,
    /// Heading shown in the results area before the user has typed a search query.
    pub welcome_search_title: String,
    /// Hint below the welcome heading that encourages the user to try a search.
    pub welcome_search_hint: String,
    /// Heading for the collapsible section that explains supported model file formats.
    pub format_help_title: String,
    /// One-line description of the GGUF format shown in the format help section.
    pub format_gguf_help: String,
    /// One-line description of the Safetensors format shown in the format help section.
    pub format_safetensors_help: String,
    /// Label on the button that triggers a local-file import dialog.
    pub import_button_label: String,
    /// Label shown on the import button while a file is being copied / indexed.
    pub importing_label: String,
}

/// Clyffy chat activation screen.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ActivateCopy {
    /// Heading for the activation step (e.g. "Say hi to Clyffy").
    pub title: String,
    /// First chat bubble Clyffy sends automatically when the activation step loads.
    pub greeting_message: String,
    /// Template for the progress indicator while models are still loading; may include `{n}` remaining count placeholder.
    pub progress_remaining_template: String,
    /// Label shown in the progress area once all models have finished loading.
    pub progress_complete_label: String,
    /// Heading for the inline error card shown when the brain (LLM) slot is not filled.
    pub brain_missing_title: String,
    /// Detail text for the brain-missing error, explaining how to go back and select a model.
    pub brain_missing_detail: String,
    /// Inline notice shown in the voice button area when no voice model is available.
    pub voice_unavailable_message: String,
    /// Status label shown in the chat bubble area while Clyffy is generating a response.
    pub thinking_label: String,
    /// Template for the error bubble Clyffy sends when inference fails; may include `{error}` placeholder.
    pub error_message_template: String,
    /// `aria-label` for the chat message send button.
    pub send_aria: String,
    /// `aria-label` for the voice toggle button when voice is currently off.
    pub voice_enable_aria: String,
    /// `aria-label` for the voice toggle button when voice is currently active.
    pub voice_disable_aria: String,
}

/// Project setup / About You screen.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ProfileCopy {
    /// Heading for the profile / About You step (e.g. "Tell me a bit about yourself").
    pub title: String,
    /// Supporting line explaining why this information personalises the experience.
    pub subtitle: String,
    /// Label for the developer name input field.
    pub name_label: String,
    /// Placeholder text inside the name input (e.g. "Your name or handle").
    pub name_placeholder: String,
    /// Label for the experience-level selector (e.g. "How long have you been coding?").
    pub experience_label: String,
    /// Label for the project root-folder picker field.
    pub project_folder_label: String,
    /// Placeholder shown inside the folder path input when no folder has been selected.
    pub project_folder_placeholder: String,
    /// Small hint below the folder field explaining why a project folder is useful.
    pub project_folder_hint: String,
    /// Label on the button that opens the native folder-picker dialog.
    pub browse_button_label: String,
    /// Label on the button that saves profile data and advances to the next step.
    pub continue_label: String,
    /// Template variant of the continue label that embeds the user's name (e.g. "Let's go, {name}!").
    pub continue_template: String,
    /// Label on the button that returns to the previous wizard step.
    pub back_label: String,
}

/// Completion screen — summary and launch.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct CompletionCopy {
    /// Heading for the completion step (e.g. "You're all set!").
    pub title: String,
    /// Template subtitle shown below the heading; may include `{name}` placeholder for personalisation.
    pub subtitle_template: String,
    /// Section heading above the API-key summary list.
    pub api_section_label: String,
    /// Message shown inside the API section when no provider keys have been configured.
    pub api_empty_message: String,
    /// Label on the primary "Launch DevPulse" button that closes the wizard.
    pub launch_label: String,
    /// Small hint below the launch button (e.g. reassurance that settings can be changed later).
    pub hint: String,
}

impl WizardCopy {
    /// Load wizard copy with TOML override fallback.
    ///
    /// Tries `{userdata_dir}/config/wizard_copy.toml` first.
    /// Falls back to embedded default if user override doesn't exist or is invalid.
    pub fn load(userdata_dir: &Path) -> Result<Self> {
        let override_path = userdata_dir.join("config").join("wizard_copy.toml");

        if override_path.exists() {
            match std::fs::read_to_string(&override_path) {
                Ok(contents) => match toml::from_str::<WizardCopy>(&contents) {
                    Ok(copy) => {
                        tracing::info!(
                            path = %override_path.display(),
                            "Loaded wizard copy from user override"
                        );
                        return Ok(copy);
                    }
                    Err(e) => {
                        tracing::warn!(
                            path = %override_path.display(),
                            error = %e,
                            "Failed to parse user wizard_copy.toml, falling back to default"
                        );
                    }
                },
                Err(e) => {
                    tracing::warn!(
                        path = %override_path.display(),
                        error = %e,
                        "Failed to read user wizard_copy.toml, falling back to default"
                    );
                }
            }
        }

        Self::load_default()
    }

    /// Load the embedded default copy. Always succeeds at compile time
    /// (the embedded TOML is validated by tests).
    pub fn load_default() -> Result<Self> {
        toml::from_str(DEFAULT_TOML).context("Failed to parse embedded wizard_copy.default.toml")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_default_parses() {
        let copy = WizardCopy::load_default().expect("default TOML must parse");
        assert!(!copy.greeting.title.is_empty());
        assert!(!copy.greeting.cta_label.is_empty());
        assert!(!copy.hardware.title.is_empty());
        assert!(!copy.models.title.is_empty());
    }

    #[test]
    fn greeting_contains_clyffy() {
        let copy = WizardCopy::load_default().expect("default TOML must parse");
        assert!(copy.greeting.title.contains("Clyffy"));
    }
}
