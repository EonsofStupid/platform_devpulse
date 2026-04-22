//! Figment-layered config loader — defaults → overlay → env.
//!
//! # Status
//!
//! Scaffold only. The new loader lands alongside the first migrated
//! module; it composes three figment providers in strict precedence:
//!
//! 1. **Defaults** — ship-in-source TOML baked under `config/platform/`.
//!    Read-only. Authored once per module.
//! 2. **Overlay** — user-writable TOML under `{data_dir}/config/platform/`.
//!    Devtools write only here. Reset = delete the overlay file.
//! 3. **Env** — `DEVPULSE_*` environment variables. Highest precedence.
//!    Intended for CI and one-off dev overrides.
//!
//! # Migration note
//!
//! Today the legacy monolith at [`super::legacy::PlatformBootConfig::load`]
//! owns boot-time config. This loader takes over on a per-module basis
//! as each module migrates. When the last legacy re-export drops from
//! [`super::mod`], this loader becomes the sole entry point and
//! `legacy.rs` is deleted.
//!
//! The functions below are placeholders; each is authored as part of
//! the module that first needs it. Authoring them speculatively would
//! violate the "fix actual needs, not hypothetical ones" discipline.

// Placeholder module. First real loader function lands with the first
// migrated module (planned: `runtime::portable` — the smallest, so the
// pattern is visible before any complex module uses it).
