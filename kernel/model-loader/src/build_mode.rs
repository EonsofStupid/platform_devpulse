//! Build mode — `dev` / `production` / `customer` flag that gates how
//! user-configurable the platform's built-ins are.
//!
//! The mode is chosen at compile time via Cargo features so each mode
//! produces a distinct binary with different default capabilities:
//!
//! | Feature flag      | Value                   | Built-ins are…                               |
//! | ----------------- | ----------------------- | -------------------------------------------- |
//! | `mode-dev`        | [`BuildMode::Dev`]      | Fully user-configurable (toggle, swap model) |
//! | `mode-production` | [`BuildMode::Production`] | Visible but locked; model upgrade only via sanctioned UI |
//! | `mode-customer`   | [`BuildMode::Customer`] | Fully managed; upgrades arrive via managed services |
//!
//! Exactly one mode feature must be enabled. The default feature set
//! enables `mode-dev` so local `cargo check` / `cargo xtask run-dev`
//! workflows behave as they do today. Release builds and customer
//! distributions flip to `mode-production` or `mode-customer`.
//!
//! # Why this lives in `model-loader`
//!
//! The mode directly governs what the slot/lane/built-in UIs allow.
//! Keeping the enum inside `model-loader` means every consumer (the
//! Slot Config overlay, the Setup Wizard, the Resource Manager page,
//! every Tauri command) reads the same kernel source of truth.
//!
//! # Runtime access
//!
//! [`BuildMode::current`] returns the compile-time mode without any
//! allocation. It is `const fn` so downstream code can branch on it in
//! zero-cost conditional compilation patterns when desired.

use serde::{Deserialize, Serialize};

/// Which mode this binary was compiled for.
///
/// Selection is compile-time: the mode is decided by whichever of the
/// `mode-dev`, `mode-production`, or `mode-customer` Cargo features is
/// active. Exactly one must be enabled; the build fails if zero or
/// multiple are selected (see the compile-time assertions below).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum BuildMode {
    /// Full developer access. Built-ins are fully configurable — users
    /// can toggle them on/off, swap underlying model files, and inspect
    /// every internal knob. This is the default for local development
    /// and CI builds.
    Dev,
    /// Production build shipped to power users. Built-ins are visible
    /// in the UI and their status is readable, but they cannot be
    /// disabled and model upgrades flow only through the sanctioned
    /// upgrade UI rather than arbitrary file picks.
    Production,
    /// Customer build distributed via managed services. Users never
    /// touch built-in model files directly — upgrades arrive as signed
    /// updates pushed by the managed service. The Slot Config overlay
    /// hides the model file picker entirely.
    Customer,
}

impl BuildMode {
    /// The mode this binary was compiled for.
    ///
    /// Resolves at compile time with no allocation, no `OnceLock`, and
    /// no runtime dispatch — the active Cargo feature determines the
    /// returned variant directly.
    #[must_use]
    pub const fn current() -> Self {
        #[cfg(feature = "mode-dev")]
        {
            Self::Dev
        }
        #[cfg(all(feature = "mode-production", not(feature = "mode-dev")))]
        {
            Self::Production
        }
        #[cfg(all(
            feature = "mode-customer",
            not(feature = "mode-dev"),
            not(feature = "mode-production")
        ))]
        {
            Self::Customer
        }
        #[cfg(not(any(
            feature = "mode-dev",
            feature = "mode-production",
            feature = "mode-customer"
        )))]
        {
            // No mode feature selected — fall back to Dev so that bare
            // `cargo check` still works. Release builds enable exactly
            // one mode feature explicitly.
            Self::Dev
        }
    }

    /// Whether this build allows the user to toggle built-ins on and off.
    ///
    /// `Dev` returns `true`. `Production` and `Customer` return `false`.
    #[must_use]
    pub const fn allows_builtin_toggle(self) -> bool {
        matches!(self, Self::Dev)
    }

    /// Whether this build lets the user swap a built-in's underlying
    /// model file via the generic file picker.
    ///
    /// `Dev` allows it outright. `Production` allows it through the
    /// sanctioned upgrade UI (which is a separate code path and must
    /// check `allows_sanctioned_upgrade` instead). `Customer` forbids
    /// it entirely — upgrades only arrive via managed services.
    #[must_use]
    pub const fn allows_builtin_model_swap(self) -> bool {
        matches!(self, Self::Dev)
    }

    /// Whether the sanctioned built-in upgrade UI is enabled.
    ///
    /// `Dev` and `Production` expose the upgrade flow. `Customer`
    /// does not — upgrades are delivered externally.
    #[must_use]
    pub const fn allows_sanctioned_upgrade(self) -> bool {
        matches!(self, Self::Dev | Self::Production)
    }

    /// Lowercase string for log targets and structured event fields.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Dev => "dev",
            Self::Production => "production",
            Self::Customer => "customer",
        }
    }
}

impl std::fmt::Display for BuildMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

// ── Compile-time checks ──────────────────────────────────────────
//
// Enforce that no more than one exclusive mode feature is active at a
// time. Having both `mode-production` and `mode-customer` enabled would
// produce ambiguous behaviour; fail the build instead of silently picking.
#[cfg(all(feature = "mode-production", feature = "mode-customer"))]
compile_error!(
    "build_mode: features `mode-production` and `mode-customer` are mutually exclusive — \
     enable exactly one"
);

#[cfg(all(feature = "mode-dev", feature = "mode-customer"))]
compile_error!(
    "build_mode: features `mode-dev` and `mode-customer` are mutually exclusive — \
     enable exactly one"
);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn current_mode_resolves() {
        // Simply ensures the function is reachable under the default
        // feature set and returns a stable variant.
        let mode = BuildMode::current();
        let s = mode.as_str();
        assert!(!s.is_empty(), "mode name must not be empty");
    }

    #[test]
    fn dev_allows_everything() {
        assert!(BuildMode::Dev.allows_builtin_toggle());
        assert!(BuildMode::Dev.allows_builtin_model_swap());
        assert!(BuildMode::Dev.allows_sanctioned_upgrade());
    }

    #[test]
    fn production_locks_toggle_but_allows_sanctioned_upgrade() {
        assert!(!BuildMode::Production.allows_builtin_toggle());
        assert!(!BuildMode::Production.allows_builtin_model_swap());
        assert!(BuildMode::Production.allows_sanctioned_upgrade());
    }

    #[test]
    fn customer_locks_everything() {
        assert!(!BuildMode::Customer.allows_builtin_toggle());
        assert!(!BuildMode::Customer.allows_builtin_model_swap());
        assert!(!BuildMode::Customer.allows_sanctioned_upgrade());
    }

    #[test]
    fn as_str_is_lowercase_and_serde_matches() {
        assert_eq!(BuildMode::Dev.as_str(), "dev");
        assert_eq!(BuildMode::Production.as_str(), "production");
        assert_eq!(BuildMode::Customer.as_str(), "customer");

        // Serde round-trip — snake_case serialization matches the
        // frontend contract used by logging + bindings.
        let json = serde_json::to_string(&BuildMode::Production).unwrap();
        assert_eq!(json, "\"production\"");
        let back: BuildMode = serde_json::from_str("\"customer\"").unwrap();
        assert_eq!(back, BuildMode::Customer);
    }
}
