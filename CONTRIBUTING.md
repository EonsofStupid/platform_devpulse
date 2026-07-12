# Contributing to DevPulse

Thanks for your interest. Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first
— it explains the layered design and what lives where.

## What's stable, what's not

DevPulse has three layers; each has a different stability promise.

| Layer | Stability | What you can rely on |
|---|---|---|
| **`devpulse-engine` public surface** | Semver. Breaking changes go in `CHANGELOG.md` with a major bump. | Re-exported types in `platform/mod.rs`, Tauri commands in the generated `bindings.ts`, `SERVICE_MANIFEST` shape, TOML config keys. |
| **`devpulse-engine` internals** | Unstable. May change between minor versions without notice. | Don't import from `devpulse_engine::platform::services::<x>::internal::...` etc. — only the surface re-exported in `mod.rs`. |
| **`clyffyos-wire` types** | Owned by the `clyffyos` repo (pinned git dep) — the Tier-2 wire contract SSOT. | `EndpointCapability`, `LoadedSlotSummary`, `SlotStatus` flow through `devpulse-gb10-client`. One serde definition, two consumers — no parallel DTOs. |

Frontend binding files (`interfaces/desktop/src/lib/sys/generated/*`)
are **regenerated**, not hand-edited. Don't modify them directly.

## Making changes

### Bug fix or small feature in the engine
1. Open an issue describing the change.
2. Implement.
3. Run `cargo check -p devpulse-engine` and `cargo test -p devpulse-engine`
   (per-crate — never workspace-wide for the dev loop).
4. If you touched a Tauri command return type or added a new command,
   run `cargo xtask regen-bindings` and commit the diff in
   `bindings.ts` with your change.
5. If you touched the Svelte UI, run `pnpm check` from
   `interfaces/desktop/`.
6. Open a PR.

### New managed service
See `ARCHITECTURE.md` § Service lifecycle. The drift-protection tests
will tell you if you missed a step.

### New engine type that crosses to the frontend
1. Add `derive(specta::Type)` to the engine struct.
2. Re-export from `systems/devpulse-engine/src/platform/mod.rs` with an
   `IP-NOTE:` comment explaining why the name is layman-safe (or what
   rename you applied at the seam).
3. Use it from a Tauri command.
4. Run `cargo xtask regen-bindings` and commit the TS diff.

**Anti-pattern** — do NOT author a desktop-side DTO struct that mirrors
an engine (or `clyffyos-wire`) type with an `impl From<EngineFoo> for
DesktopFoo`. Derive on the owning type and re-export it. The boundary is
vocabulary, not duplicate types.

### Renaming an internal concept for the public surface
Use the `as` re-export at the seam:

```rust
// systems/devpulse-engine/src/platform/knowledge/mod.rs
pub use types::{
    EntryType,  // surfaces as the knowledge entry type — layman name chosen at the seam
    ...
};
```

For deeper renames (e.g. an internal sub-agent identity that should
never leak), use `ip_term!()` and the registry at
`systems/devpulse-engine/ip/signals.registry.yaml`.

## What we won't merge

- Glob re-exports across the engine surface (`pub use internal::*`).
- Desktop-side wrapper structs that duplicate engine or `clyffyos-wire`
  types just to add specta.
- AI/inference crates in this workspace — the AI layer is Clyffy's
  (`github.com/EonsofStupid/clyffyos`), reached over the wire only;
  `cargo xtask verify-ip-boundary` + cargo-deny enforce it.
- Frontend code that bypasses the engine surface (the frontend consumes
  Rust only via the generated `bindings.ts`).
- Hand-edited `bindings.ts` or other generated files.
- Stubs / placeholders / TODO-wire-this-later commits.

## Running locally

```sh
# First-time deps
pnpm install

# Fetch native sidecars
cargo xtask fetch-surreal --target <your-target>
cargo xtask fetch-devforge --target <your-target>

# Run dev
cargo xtask run-dev
```

See `ARCHITECTURE.md` for the full set of xtask commands and target triples.

## Vocabulary discipline

DevPulse renames internal terms at the engine/desktop seam to keep the
shipping product consistent for a layman audience. If an engine-internal
name should surface on the public side, **rename it at the seam**, don't
use the internal name in user-visible copy. The vocabulary SSOT is
`systems/devpulse-engine/ip/kernel_terms.toml`; the `ip_term!()` macro
and lefthook hook catch most accidents at commit time.

## Repo layout

See `ARCHITECTURE.md`. Every crate-boundary rule and naming convention
is documented there.
