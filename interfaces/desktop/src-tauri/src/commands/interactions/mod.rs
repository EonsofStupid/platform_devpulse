//! Tauri command surface for kernel interaction templates.
//!
//! Exposes the [`InteractionTemplate`] loader so the frontend can
//! ask the kernel for a parsed template by id. The dispatcher
//! (frontend-side, in `SetupWizardOverlay`) consumes the template
//! to render the right phase-component chain.
//!
//! Today's surface:
//!
//! - [`get_interaction_template`] — load a template by id
//!   (`"setup"` or `"welcome-back"`). Returns parsed phases +
//!   triggers + entry_phase via the typed specta binding.
//!
//! Trigger evaluation (does THIS interaction fire RIGHT NOW?) is
//! a separate concern that depends on persisted state
//! (`last_seen_at`, slot health, etc.) — that landing in a later
//! slice keeps this module focused on the template loader path.

use devpulse_engine::platform::{InteractionTemplate, Platform};
use std::sync::Arc;
use tauri::State;

use crate::state::PlatformState;

/// Load a parsed kernel interaction template by id.
///
/// Supported ids: `"setup"`, `"welcome-back"`. Each id maps to the
/// matching `InteractionTemplate::<id>` constructor on the kernel
/// side; templates are bundled at compile time via `include_str!`
/// so this command never touches disk except to read user
/// overrides at `{userdata_dir}/config/interactions/<id>.toml`.
///
/// # Errors
/// Returns the kernel's parse / validation error message as a
/// string when the embedded default or the user override fails to
/// parse. Returns `"Unknown interaction id: <id>"` when the id
/// doesn't match a built-in template.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_interaction_template(
    id: String,
    state: State<'_, PlatformState>,
) -> Result<InteractionTemplate, String> {
    let platform: Arc<Platform> = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let userdata_dir = platform.data_dir();

    let template = match id.as_str() {
        "setup" => InteractionTemplate::setup(userdata_dir),
        "welcome-back" => InteractionTemplate::welcome_back(userdata_dir),
        other => return Err(format!("Unknown interaction id: {other}")),
    };

    template.map_err(|e| format!("Interaction template load failed: {e}"))
}
