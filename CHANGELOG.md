# Changelog

All notable changes to the **public surface** of `devpulse-engine` (the
types and Tauri commands consumed by `interfaces/desktop` and any
future external consumers) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and the engine public surface follows
[Semantic Versioning](https://semver.org/) starting from the version
declared in `systems/devpulse-engine/Cargo.toml`.

What is **not** tracked here:
- Kernel internals (`devpulse-clyffy`, `model-loader`) — see commit log.
- Engine internals not re-exported from `platform/mod.rs`.
- Hand-mirrored frontend files — drift is caught by tests, not changelog.

## Unreleased

### Added
- Unified per-service status surface: `Platform::services_status()`
  returns `Vec<ServiceStatusSnapshot>` derived from `SERVICE_MANIFEST`,
  exposed via the `list_services` Tauri command. Replaces the legacy
  flat `DatabaseConfig` bool mirror.
- `ServiceRuntimeState` enum — `not-compiled` / `config-disabled` /
  `stopped` / `running` / `unknown` — for explicit service liveness
  reporting.
- `ServiceStatusSnapshot` struct exposed to TS bindings. Each entry
  carries the manifest metadata (role, scope, stage, public name,
  feature gate, step id, group) plus the three dynamic signals
  (`compiled_in`, `config_enabled`, `config_critical`,
  `runtime_state`).
- `PlatformBootConfig::service_flags(role, scope)` — uniform `(enabled,
  critical)` lookup for any `(ServiceRole, DataScope)` pair in
  `SERVICE_MANIFEST`.
- `SurrealdbSidecar` `ServiceRole` variant + `SERVICE_MANIFEST` /
  `BOOT_STEP_MANIFEST` entries. The previously orphaned `"SurrealDB
  sidecar"` boot step is now drift-protected.
- Drift-protection test `every_manifest_entry_has_config_flags` —
  every `SERVICE_MANIFEST` entry must round-trip through
  `service_flags`, preventing silent `ConfigDisabled` regressions.
- `specta` feature on `devpulse-clyffy` (optional). Lets kernel types
  derive `specta::Type` for IPC crossing without forcing specta into
  kernel-only builds.

### Changed
- `DataScope` now derives `Serialize` / `Deserialize` / `specta::Type`
  so it can cross the IPC boundary.
- The four `pub use devpulse_clyffy::...` blocks in
  `platform/mod.rs` are now annotated with `IP-NOTE:` comments
  explaining vocabulary safety / renames per group. No glob re-exports.
- `OllamaModel` derives `specta::Type` directly on the kernel type via
  the optional `specta` feature; the previous engine-side wrapper DTO
  has been removed.

### Removed
- `DatabaseConfig` struct + `databases: DatabaseConfig` field on
  `PlatformConfig` + `to_database_config()`. The hand-maintained flat
  bool mirror is replaced by the manifest-derived surface above.
  *Migration:* consumers of `platform.config().databases.<x>` should
  call `platform.services_status().await` and inspect entries by role.

### Fixed
- `xtask fetch-surreal` no longer fails to compile due to a `&str` vs
  `str` comparison.

---

## Versioning policy (target — applies once we cut 1.0)

- **Major** — any breaking change to a re-exported type's shape, a
  Tauri command's signature, a TOML config key's name or required-ness,
  or removal of a `SERVICE_MANIFEST` entry.
- **Minor** — additive changes: new types, new commands, new
  `SERVICE_MANIFEST` entries, new optional config keys.
- **Patch** — bug fixes that don't alter the public type signatures.

Until 1.0, the major-version slot is `0` and we treat **minor**
bumps as the breaking-change signal.
