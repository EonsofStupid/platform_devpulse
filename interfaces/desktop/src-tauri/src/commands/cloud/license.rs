//! License validation — dev-mode bypass + Supabase-backed check (stub).
//!
//! Today this surface returns a hard-coded `Pro` tier with `source =
//! Dev` so the auth shell and downstream surfaces have a stable shape
//! to consume. The Supabase `licenses` table schema + the actual
//! check-against-cloud path land in a follow-up slice — wiring them
//! now would require schema migrations, a row-level-security policy,
//! and an offline cache that aren't part of this auth-shell slice.
//!
//! When that slice lands, the only change here is `validate_license`'s
//! body — the surface (`LicenseStatus`, `LicenseSummary`, `LicenseTier`,
//! `LicenseSource`) stays stable so frontend consumers don't churn.
//!
//! # Source semantics
//!
//! - `Dev`            — debug builds or `DEVPULSE_LICENSE_BYPASS=1`.
//!   Never reach the cloud. Always `Pro` tier.
//! - `Supabase`       — pulled live from the `licenses` table keyed
//!   by the signed-in user's id (FUTURE).
//! - `OfflineBypass`  — signed offline token verified in-process
//!   (FUTURE; for air-gapped enterprise installs).
//!
//! The `tier` field controls feature unlocks in the UI. The `active`
//! flag is the boolean the auth gate consults — if `active = false`,
//! the post-login surface renders the "license expired" empty state
//! instead of the workspace.

use crate::commands::_util::CommandError;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Feature tier the operator's license unlocks. Mirrors the tiers the
/// public pricing page advertises so the UI can map 1:1 without a
/// translation table.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum LicenseTier {
    /// Free local-only tier — no cloud features, no team seats.
    Free,
    /// Paid individual tier — cloud features, single seat.
    Pro,
    /// Org tier — cloud features, multi-seat, SSO, audit log.
    Enterprise,
}

/// Where the license verdict came from. Drives UX copy on the
/// "subscription" panel — `Dev` shows a "developer bypass" badge,
/// `Supabase` shows the live verification timestamp, `OfflineBypass`
/// shows the signed-token expiry.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum LicenseSource {
    /// Debug build or `DEVPULSE_LICENSE_BYPASS=1` env var.
    Dev,
    /// Live verification against the Supabase `licenses` table (FUTURE).
    Supabase,
    /// Signed offline token for air-gapped installs (FUTURE).
    OfflineBypass,
}

/// Concrete license state — boolean active flag plus the tier the
/// feature-flag system reads.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LicenseStatus {
    /// `true` when the license is in-period and the auth gate should
    /// admit the user past the login screen.
    pub active: bool,
    /// Feature tier — drives UI unlocks.
    pub tier: LicenseTier,
    /// ISO 8601 expiry timestamp. `None` for the free tier and
    /// `Dev` source (which has no expiry concept).
    pub expires_at: Option<String>,
    /// How many seats this license has consumed.
    pub seats_used: u32,
    /// Total seat allowance.
    pub seats_allowed: u32,
}

/// Full license summary — wraps `LicenseStatus` with the source the
/// settings panel renders alongside it.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LicenseSummary {
    /// The license verdict.
    pub status: LicenseStatus,
    /// Email of the user the license is bound to. `None` until the
    /// Supabase path is wired AND the user has signed in.
    pub user_email: Option<String>,
    /// Where the verdict came from.
    pub source: LicenseSource,
}

/// Validate the operator's license.
///
/// Today: returns `Pro` tier with `source = Dev`. The hard-coded
/// verdict is intentional — see the module docstring.
///
/// # Errors
/// Reserved for the future Supabase path (network / DB failure).
#[tauri::command]
#[specta::specta]
pub async fn validate_license() -> Result<LicenseStatus, CommandError> {
    if is_dev_bypass() {
        return Ok(dev_bypass_status());
    }
    // FUTURE: query Supabase `licenses` table here.
    // For now the offline-bypass code path falls through to the dev
    // bypass — production is gated behind the future slice.
    Ok(dev_bypass_status())
}

/// Get the full license summary for the settings panel.
///
/// # Errors
/// Reserved for the future Supabase path.
#[tauri::command]
#[specta::specta]
pub async fn get_license_summary() -> Result<LicenseSummary, CommandError> {
    Ok(LicenseSummary {
        status: validate_license().await?,
        user_email: None,
        source: LicenseSource::Dev,
    })
}

/// `true` when the build is debug OR the env-var bypass is set. The
/// debug-build check means `cargo run` never asks for a license
/// during local development; the env-var check means an internal
/// release build can short-circuit by setting `DEVPULSE_LICENSE_BYPASS=1`.
fn is_dev_bypass() -> bool {
    if cfg!(debug_assertions) {
        return true;
    }
    matches!(
        std::env::var("DEVPULSE_LICENSE_BYPASS").as_deref(),
        Ok("1" | "true" | "TRUE")
    )
}

/// Synthetic dev-mode license — Pro tier, no expiry, single seat.
fn dev_bypass_status() -> LicenseStatus {
    LicenseStatus {
        active: true,
        tier: LicenseTier::Pro,
        expires_at: None,
        seats_used: 1,
        seats_allowed: 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dev_bypass_returns_pro_tier() {
        let status = dev_bypass_status();
        assert!(status.active);
        assert_eq!(status.tier, LicenseTier::Pro);
        assert_eq!(status.expires_at, None);
    }

    #[test]
    fn dev_bypass_in_debug_builds() {
        // `cfg!(debug_assertions)` is true under `cargo test` so the
        // env-var check is irrelevant here — the build flavour wins.
        assert!(is_dev_bypass());
    }
}
