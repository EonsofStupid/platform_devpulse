//! Container intents — thin wrappers over the engine's containers service
//! (`devpulse_engine::platform::containers`), which detects, advises, runs
//! each step only when asked, and publishes the `containers` state. No logic
//! here.

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::containers::{Answers, Containers, ContainersState, Step};
use tauri::State;

fn service(state: &PlatformState) -> Result<Arc<Containers>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())?;
    platform.containers().cloned().ok_or_else(|| {
        "Containers are unavailable: the user database is not open (see the boot log)".to_owned()
    })
}

/// The current containers state (the same value the `containers` signal carries).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn containers_state(state: State<'_, PlatformState>) -> Result<ContainersState, String> {
    Ok(service(&state)?.state().await)
}

/// Look at this machine again and recompute the advice.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn containers_check(state: State<'_, PlatformState>) -> Result<ContainersState, String> {
    service(&state)?.check().await.map_err(|e| format!("{e:#}"))
}

/// Store your answers and recompute the advice.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn containers_answer(
    answers: Answers,
    state: State<'_, PlatformState>,
) -> Result<ContainersState, String> {
    service(&state)?
        .answer(answers)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Run one step of the current advice (refused if it is not one of them).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn containers_run_step(
    step: Step,
    state: State<'_, PlatformState>,
) -> Result<ContainersState, String> {
    service(&state)?
        .run(step)
        .await
        .map_err(|e| format!("{e:#}"))
}
