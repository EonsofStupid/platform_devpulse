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
const DEFAULT_TOML: &str = include_str!("../../../config/wizard_copy.default.toml");

/// All wizard copy. One root struct, one Tauri call to fetch everything.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
    /// Copy for the `HuggingFace` token entry modal.
    ///
    /// `#[serde(default)]` lets older user overrides that pre-date this
    /// section continue to parse — missing fields use struct `Default`.
    #[serde(default)]
    pub hf_token: HfTokenCopy,
    /// Copy for the download progress rows (per-download cancel, retry,
    /// speed, ETA). Rendered inside the overlay while downloads are active.
    #[serde(default)]
    pub downloads: DownloadsCopy,
    /// Copy for the per-slot model loading feedback (Clyffy spinner stage
    /// narration: reading, memory, warmup, ready, failed).
    #[serde(default)]
    pub loading: LoadingCopy,
    /// Copy for the four role cards (Thinking / Helpers / Searching / Talking).
    #[serde(default)]
    pub role_cards: RoleCardsCopy,
    /// Layman explanations for every "?" icon across the overlay.
    #[serde(default)]
    pub clyffy_tooltips: ClyffyTooltipsCopy,
    /// Copy for the standalone Model Downloader overlay — the search-
    /// driven modal that ANY surface can open to browse `HuggingFace`,
    /// tag a model with a slot role, confirm a bundle, and trigger an
    /// authenticated download. Lives outside the wizard's view chain;
    /// `#[serde(default)]` keeps older user overrides parsing cleanly.
    #[serde(default)]
    pub downloader: DownloaderCopy,
    /// Copy for the auth shell — sign-in route, sign-up route, sign-out
    /// affordances, error templates. Strings flow through this struct
    /// instead of being inlined in Svelte so Rule 6 (Rust SSOT for every
    /// visible string) stays satisfied. `#[serde(default)]` keeps older
    /// user `wizard_copy.toml` overrides parsing without `[auth]`.
    #[serde(default)]
    pub auth: AuthCopy,
    /// Copy for the post-login runtime picker — the embedder selector
    /// with the minion read-only section that lives at `/profile`.
    /// Distinct from `profile: ProfileCopy` (which is the wizard's
    /// "tell me about yourself" step). `#[serde(default)]` keeps
    /// older overrides parsing without `[runtime_picker]`.
    #[serde(default)]
    pub runtime_picker: RuntimePickerCopy,
    /// Copy for the connect (endpoint-entry) step — where the operator
    /// links the standalone Tier-1 app to a Clyffy endpoint (Local /
    /// GB10 over the mesh). The address itself is always operator-
    /// entered or discovered, never shipped in copy; these strings are
    /// the layman framing around that choice. `#[serde(default)]`
    /// keeps older user overrides parsing without `[connect]`.
    #[serde(default)]
    pub connect: ConnectCopy,
}

/// Welcome screen — Clyffy greeting and CTA.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ScanningCopy {
    /// Heading displayed while the hardware probe is running (e.g. "Checking your gear…").
    pub title: String,
    /// Secondary line that reassures the user while detection is in progress.
    pub subtitle: String,
    /// Alt text for the animated Clyffy mascot shown during the scanning state.
    pub mascot_alt: String,
}

/// Hardware detected screen — tier badge, metric cards, tooltips.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct BrowseCopy {
    /// Heading for the browse / search step (e.g. "Find a model").
    pub title: String,
    /// Supporting line explaining how to search `HuggingFace` or scan local folders.
    pub subtitle: String,
    /// Label for the in-popup tab that shows preset recommendations for the selected slot.
    pub recommended_tab_label: String,
    /// Label for the tab that lists models already downloaded to disk.
    pub local_tab_label: String,
    /// Label for the tab that searches the online model registry.
    pub online_tab_label: String,
    /// Label for the in-popup tab that opens a local file picker.
    pub local_browse_tab_label: String,
    /// Short description shown above the inline `HuggingFace` search panel.
    pub search_panel_description: String,
    /// Placeholder text inside the model search input field.
    pub search_placeholder: String,
    /// Screen-reader label for the model search input field.
    pub search_input_aria: String,
    /// Visible label on the search submit button.
    pub search_button_label: String,
    /// Label for the filter tab that shows every supported model format.
    pub all_formats_label: String,
    /// Tooltip text explaining what the all-formats filter does.
    pub all_formats_tooltip: String,
    /// Heading shown in the results area when a search returns no matches.
    pub no_results_title: String,
    /// Template shown when a search returns no matches; may include a `{query}` placeholder.
    pub no_results_title_template: String,
    /// Hint below the no-results heading suggesting alternative search terms or formats.
    pub no_results_hint: String,
    /// Heading shown in the results area before the user has typed a search query.
    pub welcome_search_title: String,
    /// Hint below the welcome heading that encourages the user to try a search.
    pub welcome_search_hint: String,
    /// Label shown above the quick-search chips after a failed search.
    pub popular_searches_label: String,
    /// Label shown above the quick-search chips before the first search.
    pub try_one_of_these_label: String,
    /// Heading for the collapsible section that explains supported model file formats.
    pub format_help_title: String,
    /// One-line description of the GGUF format shown in the format help section.
    pub format_gguf_help: String,
    /// One-line description of the Safetensors format shown in the format help section.
    pub format_safetensors_help: String,
    /// Template shown while the online search request is running; may include a `{query}` placeholder.
    pub search_loading_template: String,
    /// Secondary hint shown below the active search spinner.
    pub search_loading_hint: String,
    /// Label on the retry action inside the search error state.
    pub retry_label: String,
    /// Label on the clear action inside the search error state.
    pub clear_label: String,
    /// Singular noun used in the search result count.
    pub result_label_singular: String,
    /// Plural noun used in the search result count.
    pub result_label_plural: String,
    /// Section label shown above GGUF files inside a search result card.
    pub gguf_section_label: String,
    /// Section label shown above Safetensors shards inside a search result card.
    pub safetensors_section_label: String,
    /// Template for shard counts; may include `{count}` and `{plural}` placeholders.
    pub shard_count_template: String,
    /// Summary template for all Safetensors shards; may include `{count}`, `{plural}`, and `{size}` placeholders.
    pub all_shards_summary_template: String,
    /// Label shown before the per-file slot selector chips.
    pub install_to_label: String,
    /// Template for the GGUF download button; may include a `{slot}` placeholder.
    pub download_to_template: String,
    /// Label shown while a GGUF file download request is being dispatched.
    pub downloading_label: String,
    /// Template for the Safetensors download button; may include a `{slot}` placeholder.
    pub download_all_shards_template: String,
    /// Label shown while a Safetensors multi-file download request is being dispatched.
    pub downloading_all_shards_label: String,
    /// Warning shown when disk space is too low; may include `{needed}` and `{free}` placeholders.
    pub disk_space_warning_template: String,
    /// Template shown when a repository has no files matching the selected format; may include `{format}`.
    pub no_format_files_template: String,
    /// Label on the button that triggers a local-file import dialog.
    pub import_button_label: String,
    /// Label shown on the import button while a file is being copied / indexed.
    pub importing_label: String,
    /// Label on the button that fetches the next page of online search results.
    pub load_more_label: String,
    /// Label shown while the next page of online search results is loading.
    pub loading_more_label: String,
}

/// Clyffy chat activation screen.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CompletionCopy {
    /// Heading for the completion step (e.g. "You're all set!").
    pub title: String,
    /// Template subtitle shown below the heading; may include `{name}` placeholder for personalisation.
    pub subtitle_template: String,
    /// Section heading above the API-key summary list.
    pub api_section_label: String,
    /// Message shown inside the API section when no provider keys have been configured.
    pub api_empty_message: String,
    /// Label on the primary "Launch `DevPulse`" button that closes the wizard.
    pub launch_label: String,
    /// Small hint below the launch button (e.g. reassurance that settings can be changed later).
    pub hint: String,
}

/// Copy for the `HuggingFace` token entry modal.
///
/// Surface: a dialog rendered inside `SetupWizardOverlay` with a password
/// field, save / clear / cancel buttons, and a help link back to HF's
/// token settings page.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct HfTokenCopy {
    /// Dialog heading.
    pub title: String,
    /// One-line explanation of what the token unlocks.
    pub subtitle: String,
    /// Label beside the password input.
    pub field_label: String,
    /// Placeholder text inside the password input.
    pub field_placeholder: String,
    /// Label on the save button.
    pub save_label: String,
    /// `aria-label` on the save button.
    pub save_aria: String,
    /// Label on the clear button shown when a token is already stored.
    pub clear_label: String,
    /// `aria-label` on the clear button.
    pub clear_aria: String,
    /// Label on the cancel / dismiss button.
    pub cancel_label: String,
    /// `aria-label` on the top-right X-close button.
    pub close_aria: String,
    /// Badge text shown in the overlay header when a token is stored.
    pub saved_badge: String,
    /// Badge text shown when no token is stored.
    pub unsaved_badge: String,
    /// Label of the help link ("Where do I get one?").
    pub help_link_label: String,
    /// URL the help link points at.
    pub help_url: String,
    /// Error template for failed save / clear. `{error}` placeholder.
    pub save_error_template: String,
    /// `aria-label` for the lock-icon indicator pill.
    pub lock_icon_aria: String,
}

/// Copy for the download progress rows rendered inside the overlay while
/// downloads are active.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct DownloadsCopy {
    /// Section heading above the active downloads list.
    pub title: String,
    /// Message shown when no downloads are active.
    pub empty_message: String,
    /// `aria-label` template for a download row. Placeholders:
    /// `{model_name}`, `{percent}`, `{total_mb}`.
    pub row_aria_template: String,
    /// `aria-valuetext` template for the progress bar. Placeholders:
    /// `{percent}`, `{bytes_mb}`, `{total_mb}`, `{speed_mb_per_s}`.
    pub progress_aria_template: String,
    /// Visible speed template. Placeholder `{mb_per_s}`.
    pub speed_template: String,
    /// ETA template when remaining > 60 s. Placeholder `{minutes}`.
    pub eta_template: String,
    /// ETA template when remaining <= 60 s. Placeholder `{seconds}`.
    pub eta_seconds_template: String,
    /// Placeholder ETA label while the first sample is pending.
    pub eta_computing_label: String,
    /// Label while the engine is starting the HF request.
    pub starting_label: String,
    /// Label while the engine is hashing / verifying the file after download.
    pub verifying_label: String,
    /// Label while the engine is symlinking / copying into the registry.
    pub importing_label: String,
    /// Label on a completed row before it's dismissed.
    pub complete_label: String,
    /// Template for a failed row. Placeholder `{error}`.
    pub failed_label_template: String,
    /// Label on a cancelled row.
    pub cancelled_label: String,
    /// Cancel button label.
    pub cancel_label: String,
    /// `aria-label` on the cancel button.
    pub cancel_aria: String,
    /// Retry button label.
    pub retry_label: String,
    /// `aria-label` on the retry button.
    pub retry_aria: String,
    /// Dismiss button label on a completed / cancelled row.
    pub dismiss_label: String,
    /// `aria-label` on the dismiss button.
    pub dismiss_aria: String,
}

/// Copy for the per-slot model loading feedback. Rendered by
/// `ClyffyLoadSpinner` inside each role card while the slot is loading.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct LoadingCopy {
    /// Title template. Placeholder `{model_name}`.
    pub title_template: String,
    /// Subtitle template. Placeholders `{model_name}`, `{role}`.
    pub subtitle_template: String,
    /// Stage label — file mmap / disk read.
    pub stage_reading_label: String,
    /// Stage label — KV cache allocation / VRAM reservation.
    pub stage_memory_label: String,
    /// Stage label — warmup inference pass.
    pub stage_warmup_label: String,
    /// Stage label — ready.
    pub stage_ready_label: String,
    /// Stage label — failed.
    pub stage_failed_label: String,
    /// Retry button label on a failed load.
    pub retry_label: String,
    /// `aria-label` on the retry button.
    pub retry_aria: String,
    /// Alt text for the Clyffy loading mascot.
    pub mascot_alt: String,
    /// `aria-valuetext` template. Placeholders `{model_name}`, `{stage_label}`.
    pub progress_aria_template: String,
}

/// Copy for the four role cards (Thinking / Helpers / Searching / Talking).
///
/// Role colours come from the DTCG `wizard.role.{brain, minion, encoder,
/// voice}` tokens; this struct carries only strings.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct RoleCardsCopy {
    /// Section heading above the four-card grid.
    pub group_title: String,
    /// Supporting line under the section heading.
    pub group_subtitle: String,

    /// Brain card — layman name for the primary reasoning model.
    pub brain_title: String,
    /// Brain card — plain-English purpose line.
    pub brain_layman: String,
    /// Brain card — label shown when no model is assigned.
    pub brain_empty_label: String,
    /// Brain card — change button label.
    pub brain_change_label: String,
    /// Brain card — change button `aria-label`.
    pub brain_change_aria: String,

    /// Minion card — layman name for background helper models.
    pub minion_title: String,
    /// Minion card — plain-English purpose line.
    pub minion_layman: String,
    /// Minion card — label shown when no helpers are assigned.
    pub minion_empty_label: String,
    /// Minion card — change button label.
    pub minion_change_label: String,
    /// Minion card — change button `aria-label`.
    pub minion_change_aria: String,

    /// Encoder card — layman name for search / memory models.
    pub encoder_title: String,
    /// Encoder card — plain-English purpose line.
    pub encoder_layman: String,
    /// Encoder card — label shown when no search model is assigned.
    pub encoder_empty_label: String,
    /// Encoder card — change button label.
    pub encoder_change_label: String,
    /// Encoder card — change button `aria-label`.
    pub encoder_change_aria: String,

    /// Voice card — layman name for STT + TTS models.
    pub voice_title: String,
    /// Voice card — plain-English purpose line.
    pub voice_layman: String,
    /// Voice card — label shown when no voice models are assigned.
    pub voice_empty_label: String,
    /// Voice card — change button label.
    pub voice_change_label: String,
    /// Voice card — change button `aria-label`.
    pub voice_change_aria: String,

    /// Status badge — no model assigned.
    pub status_empty: String,
    /// Status badge — download in progress.
    pub status_downloading: String,
    /// Status badge — warming up on device.
    pub status_warming: String,
    /// Status badge — ready for inference.
    pub status_ready: String,
    /// Status badge — error state.
    pub status_error: String,
    /// VRAM estimate template. Placeholder `{mb}`.
    pub vram_estimate_template: String,
}

/// Layman explanations rendered by `ClyffyTooltip` components.
///
/// Every "?" icon in the overlay pulls its body text from this struct.
/// Fields are flat string keys so the frontend can reference them by
/// stable names without parsing a nested path.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct ClyffyTooltipsCopy {
    /// "What's an HF token?"
    pub hf_token_info: String,
    /// "What's VRAM?"
    pub vram_info: String,
    /// "What does the brain do?"
    pub role_brain_info: String,
    /// "What are helpers?"
    pub role_minion_info: String,
    /// "What does the search model do?"
    pub role_encoder_info: String,
    /// "How does voice work?"
    pub role_voice_info: String,
    /// "What's a preset?"
    pub preset_picker_info: String,
    /// "What's a symlink?"
    pub symlink_info: String,
}

/// Copy for the standalone Model Downloader overlay.
///
/// Surfaced by every "Download a model" CTA in the platform — the
/// `SlotsDevtool` browse buttons, the chat-side suggest CTAs, the
/// wizard's manual-add path, and any future devtool that needs a HF
/// fetch. The overlay walks five phases (search → confirm → downloading
/// → complete / error) and every visible string lives here so layman
/// English never lands inline in a Svelte file.
///
/// Naming convention: `<phase>_<element>_<kind>` where kind is one of
/// `label` (visible button / heading), `aria` (assistive-tech-only),
/// `template` (contains placeholders), `help` (longer descriptive
/// paragraph).
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct DownloaderCopy {
    // ── Dialog frame ───────────────────────────────────────────────
    /// Top-of-dialog heading rendered as the `aria-labelledby` target.
    pub dialog_title: String,
    /// One-line subtitle rendered as the `aria-describedby` target.
    pub dialog_subtitle: String,
    /// `aria-label` on the close (X) button in the dialog header.
    pub close_button_aria: String,
    /// Visible "Cancel" label on the close button when a download is
    /// NOT in flight — closes without confirmation.
    pub close_button_label: String,
    /// Confirmation prompt shown when the user tries to close mid-download.
    pub close_during_download_question: String,
    /// "Yes, stop the download" — confirms abandoning an in-flight bundle.
    pub close_during_download_confirm: String,
    /// "Keep downloading" — dismisses the confirmation, stays in the overlay.
    pub close_during_download_cancel: String,

    // ── Token strip ────────────────────────────────────────────────
    /// Section heading above the HF token row.
    pub token_section_heading: String,
    /// Placeholder text inside the token entry input.
    pub token_input_placeholder: String,
    /// Visible "Save token" button label.
    pub token_save_label: String,
    /// `aria-label` on the Save token button.
    pub token_save_aria: String,
    /// Visible "Clear" button label — removes the stored token.
    pub token_clear_label: String,
    /// `aria-label` on the Clear button.
    pub token_clear_aria: String,
    /// Template shown when a token IS stored. Placeholder `{suffix}`
    /// (last 4 chars). Surfaced so the user can confirm which token
    /// is live without us ever displaying the full value.
    pub token_stored_template: String,
    /// Layman explanation for "what is an HF token and why do I want one"
    /// — rendered next to the strip when no token is set.
    pub token_help: String,

    // ── Search phase ───────────────────────────────────────────────
    /// Heading above the search input.
    pub search_phase_heading: String,
    /// Placeholder inside the search input.
    pub search_input_placeholder: String,
    /// `aria-label` on the search input.
    pub search_input_aria: String,
    /// Empty-state message before the user types anything.
    pub search_empty_label: String,
    /// Status text while a query is in flight.
    pub search_busy_label: String,
    /// Status text when results land but the list is empty.
    pub search_no_results_template: String,
    /// Template for the error banner when the HF query fails.
    /// Placeholder `{error}`.
    pub search_error_template: String,

    // ── Confirm phase ──────────────────────────────────────────────
    /// Heading above the bundle preview.
    pub confirm_phase_heading: String,
    /// One-line summary of what "bundle" means in this context.
    pub confirm_bundle_help: String,
    /// Heading above the slot-tag dropdown.
    pub confirm_slot_label: String,
    /// Label for the "don't assign to any slot" option.
    pub confirm_slot_unassigned_label: String,
    /// Template above the bundle file list. Placeholders
    /// `{file_count}`, `{total_mb}`.
    pub confirm_bundle_summary_template: String,
    /// The yes/no question rendered before the second-acknowledgement
    /// button — final affordance to bail out.
    pub confirm_acknowledge_question: String,
    /// Visible "Download" button label on the confirm CTA.
    pub confirm_download_label: String,
    /// `aria-label` on the Download CTA.
    pub confirm_download_aria: String,
    /// "Back to search" button label.
    pub confirm_back_label: String,
    /// `aria-label` on the Back to search button.
    pub confirm_back_aria: String,

    // ── Downloading phase ──────────────────────────────────────────
    /// Heading while files are downloading.
    pub downloading_phase_heading: String,
    /// Template for the aggregate progress label. Placeholders
    /// `{percent}`, `{bytes_mb}`, `{total_mb}`, `{speed_mb_per_s}`.
    pub downloading_progress_template: String,
    /// `aria-valuetext` template for the aggregate progress bar.
    /// Same placeholders as `downloading_progress_template`.
    pub downloading_aria_template: String,
    /// Visible "Cancel download" button label.
    pub downloading_cancel_label: String,
    /// `aria-label` on the Cancel button.
    pub downloading_cancel_aria: String,

    // ── Complete phase ─────────────────────────────────────────────
    /// Heading shown when every file in the bundle has landed.
    pub complete_phase_heading: String,
    /// Template summarising what landed. Placeholders `{model_name}`,
    /// `{slot_label}` (when a slot was assigned; empty when not).
    pub complete_summary_template: String,
    /// "Browse for another model" button label.
    pub complete_browse_more_label: String,
    /// "Done" — closes the overlay.
    pub complete_done_label: String,

    // ── Error phase ────────────────────────────────────────────────
    /// Heading shown on the error overlay (download failed mid-flight).
    pub error_phase_heading: String,
    /// Template for the error body. Placeholder `{error}`.
    pub error_body_template: String,
    /// "Retry the download" button label.
    pub error_retry_label: String,
    /// `aria-label` on the Retry button.
    pub error_retry_aria: String,
    /// "Back to search" button label.
    pub error_back_label: String,

    // ── Scope indicator ────────────────────────────────────────────
    /// Tag shown above the search input when the downloader is opened
    /// in `DownloadScope::Project(id)` mode. Placeholder `{project_id}`.
    pub project_scope_indicator_template: String,
}

/// Copy for the post-login runtime picker — the embedder selector
/// + minion read-only section rendered at `/profile`.
///
/// Distinct from `ProfileCopy` (wizard's "tell me about yourself"
/// step). Named `RuntimePickerCopy` so the two never collide in
/// either Rust or TS bindings.
///
/// All templates use `{repo}`, `{size_mb}`, `{error}` placeholders the
/// frontend substitutes. Layman English only — no jargon like "slot,"
/// "runtime," "preset" in the customer-facing strings.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct RuntimePickerCopy {
    /// Heading above the embedder picker section.
    pub heading: String,
    /// One-line subtitle below the heading.
    pub subtitle: String,
    /// Label above the repo-id input.
    pub repo_field_label: String,
    /// Placeholder inside the repo-id input.
    pub repo_field_placeholder: String,
    /// `aria-label` on the repo-id input.
    pub repo_field_aria: String,
    /// Visible "Apply" button label.
    pub apply_label: String,
    /// `aria-label` on the Apply button.
    pub apply_aria: String,
    /// Apply button label while the install chain is in flight.
    pub apply_busy_label: String,
    /// Template — current loaded variant. Placeholder `{repo}`.
    pub status_currently_using_template: String,
    /// Template — recommended variant from the system scan. Placeholder `{repo}`.
    pub status_recommended_template: String,
    /// Template — success line after apply. Placeholders `{repo}` + `{size_mb}`.
    pub status_applied_template: String,
    /// Template — failure line. Placeholder `{error}`.
    pub status_failed_template: String,
    /// Heading above the minion read-only section.
    pub minion_section_heading: String,
    /// Template subtitle below the minion heading. Placeholder `{repo}`.
    pub minion_section_subtitle_template: String,
}

/// Copy for the auth shell — sign-in route, sign-up route, sign-out
/// affordances, error templates, "cloud not yet configured" empty state.
///
/// One struct covers both routes (sign-in + sign-up) and the headers
/// in the post-login screen because they all share the same vocabulary
/// surface ("account," "password," "sign in," "sign out"). Customer
/// copy — layman English only, no jargon like "credentials," "session,"
/// "JWT."
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct AuthCopy {
    // ── Sign-in route ──────────────────────────────────────────────
    /// Page heading on the sign-in route.
    pub sign_in_heading: String,
    /// Subtitle below the sign-in heading.
    pub sign_in_subtitle: String,
    /// Visible button label that submits the sign-in form.
    pub sign_in_submit_label: String,
    /// `aria-label` on the sign-in submit button.
    pub sign_in_submit_aria: String,
    /// Button label rendered while the sign-in request is in flight.
    pub sign_in_submit_busy_label: String,

    // ── Sign-up route ──────────────────────────────────────────────
    /// Page heading on the sign-up route.
    pub sign_up_heading: String,
    /// Subtitle below the sign-up heading.
    pub sign_up_subtitle: String,
    /// Visible button label that submits the sign-up form.
    pub sign_up_submit_label: String,
    /// `aria-label` on the sign-up submit button.
    pub sign_up_submit_aria: String,
    /// Button label rendered while the sign-up request is in flight.
    pub sign_up_submit_busy_label: String,
    /// Heading shown after a successful sign-up while the user is
    /// waiting for the email confirmation link.
    pub sign_up_confirmation_heading: String,
    /// Body shown after a successful sign-up. Placeholder `{email}`
    /// renders the address we sent the confirmation link to.
    pub sign_up_confirmation_body_template: String,

    // ── Form fields ────────────────────────────────────────────────
    /// Label above the email input.
    pub email_label: String,
    /// Placeholder inside the email input.
    pub email_placeholder: String,
    /// `aria-label` on the email input.
    pub email_aria: String,
    /// Label above the password input.
    pub password_label: String,
    /// Placeholder inside the password input.
    pub password_placeholder: String,
    /// `aria-label` on the password input.
    pub password_aria: String,
    /// Label above the confirm-password input (sign-up only).
    pub confirm_password_label: String,
    /// Placeholder inside the confirm-password input.
    pub confirm_password_placeholder: String,
    /// `aria-label` on the confirm-password input.
    pub confirm_password_aria: String,

    // ── Switch links ───────────────────────────────────────────────
    /// Link on the sign-in route that swaps to the sign-up route.
    pub to_sign_up_link_label: String,
    /// Link on the sign-up route that swaps back to the sign-in route.
    pub to_sign_in_link_label: String,

    // ── Sign-out affordance (post-login surfaces) ──────────────────
    /// Visible "Sign out" button label.
    pub sign_out_label: String,
    /// `aria-label` on the sign-out button.
    pub sign_out_aria: String,

    // ── Errors ─────────────────────────────────────────────────────
    /// Banner text when the user tries to submit with empty fields.
    pub error_credentials_required: String,
    /// Banner text when the two password inputs don't match on sign-up.
    pub error_passwords_dont_match: String,
    /// Banner text when Supabase rejects the credentials. Deliberately
    /// vague — doesn't reveal whether the email or password was wrong
    /// (auth UX standard).
    pub error_invalid_credentials: String,
    /// Banner text when the sign-in request can't reach Supabase
    /// (network / DNS / cloud outage).
    pub error_network: String,
    /// Banner text rendered when no Supabase anon key is in the OS
    /// keychain. Tells the operator where to set it.
    pub error_supabase_not_configured: String,
    /// Catch-all template for unexpected errors. Placeholder `{error}`.
    pub error_unknown_template: String,
}

/// Connect (endpoint-entry) step — linking standalone DevPulse to a
/// Clyffy endpoint. Two modes surface here: Local (this machine / LAN)
/// and GB10 (the box over the operator's private mesh). The endpoint
/// address is ALWAYS operator-entered or discovered at runtime — the
/// only address-shaped string in this copy is a placeholder example the
/// operator can edit in their `wizard_copy.toml` override. Layman
/// English only: "AI brain", never "inference endpoint".
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
pub struct ConnectCopy {
    /// Heading for the connect step.
    pub title: String,
    /// Supporting line — states the honest two-tier deal: DevPulse
    /// already works standalone; connecting lights up the AI features.
    pub subtitle: String,
    /// Alt text for the Clyffy mascot illustration on this step.
    pub mascot_alt: String,

    // ── Mode cards ─────────────────────────────────────────────────
    /// Visible label on the Local mode card (this machine / home network).
    pub mode_local_label: String,
    /// One-line layman hint under the Local mode label.
    pub mode_local_hint: String,
    /// Visible label on the GB10 mode card (the box over the mesh).
    pub mode_gb10_label: String,
    /// One-line layman hint under the GB10 mode label.
    pub mode_gb10_hint: String,

    // ── Address entry ──────────────────────────────────────────────
    /// Label above the endpoint address input.
    pub url_label: String,
    /// Placeholder inside the address input — an editable EXAMPLE, not
    /// a wired endpoint (the real address is what the operator types).
    pub url_placeholder: String,
    /// `aria-label` on the address input.
    pub url_aria: String,

    // ── Actions ────────────────────────────────────────────────────
    /// Visible label on the Connect button.
    pub connect_cta: String,
    /// `aria-label` on the Connect button.
    pub connect_aria: String,
    /// Visible label on the footer Back button.
    pub back_label: String,
    /// Visible label on the footer Continue button (advances the
    /// wizard — distinct from `connect_cta`, which dials the endpoint).
    pub continue_label: String,
    /// Visible label on the Skip button — standalone is a mode, not a
    /// failure, so this reads as a real choice.
    pub skip_label: String,
    /// `aria-label` on the Skip button.
    pub skip_aria: String,
    /// Small reassurance under the actions: connecting is available
    /// any time later.
    pub skip_hint: String,

    // ── Live status cues ───────────────────────────────────────────
    /// Status line while the probe dials the entered endpoint.
    pub status_connecting: String,
    /// Status line once the capability handshake lands.
    pub status_connected: String,
    /// Status line when the endpoint can't be reached — includes the
    /// honest note that the probe keeps retrying in the background.
    pub status_failed: String,

    // ── Validation ─────────────────────────────────────────────────
    /// Inline error when Connect is pressed with an empty address.
    pub error_empty: String,
}

impl WizardCopy {
    /// Load wizard copy with TOML override fallback.
    ///
    /// Tries `{userdata_dir}/config/wizard_copy.toml` first.
    /// Falls back to embedded default if user override doesn't exist or is invalid.
    ///
    /// # Errors
    ///
    /// Returns an error only when the embedded default `wizard_copy.default.toml`
    /// fails to parse via [`Self::load_default`]. User-override read or parse
    /// failures are logged as warnings and trigger fallback, not an error
    /// return.
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
    ///
    /// # Errors
    ///
    /// Returns an error if [`toml::from_str`] fails to deserialize the
    /// embedded `wizard_copy.default.toml` into [`WizardCopy`]. In practice
    /// this is unreachable because the embedded TOML is exercised by
    /// [`tests::embedded_default_parses`] at compile-test time, but the
    /// fallible signature is preserved for callers that want a `Result`.
    pub fn load_default() -> Result<Self> {
        toml::from_str(DEFAULT_TOML).context("Failed to parse embedded wizard_copy.default.toml")
    }
}

#[cfg(test)]
#[allow(clippy::expect_used)]
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
    fn embedded_default_has_connect_copy() {
        let copy = WizardCopy::load_default().expect("default TOML must parse");
        assert!(!copy.connect.title.is_empty());
        assert!(!copy.connect.connect_cta.is_empty());
        assert!(!copy.connect.skip_label.is_empty());
        assert!(!copy.connect.status_failed.is_empty());
        assert!(!copy.connect.error_empty.is_empty());
    }

    #[test]
    fn greeting_contains_clyffy() {
        let copy = WizardCopy::load_default().expect("default TOML must parse");
        assert!(copy.greeting.title.contains("Clyffy"));
    }
}
