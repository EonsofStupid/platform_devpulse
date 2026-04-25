# Contributing to DevPulse

Thanks for your interest. Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first
— it explains the layered design and what lives where.

## What's stable, what's not

DevPulse has three layers; each has a different stability promise.

| Layer | Stability | What you can rely on |
|---|---|---|
| **`devpulse-engine` public surface** | Semver. Breaking changes go in `CHANGELOG.md` with a major bump. | Re-exported types in `platform/mod.rs`, Tauri commands in the generated `bindings.ts`, `SERVICE_MANIFEST` shape, TOML config keys. |
| **`devpulse-engine` internals** | Unstable. May change between minor versions without notice. | Don't import from `devpulse_engine::platform::services::<x>::internal::...` etc. — only the surface re-exported in `mod.rs`. |
| **kernel (`devpulse-clyffy`, `model-loader`)** | Unstable from outside the workspace. Internal interface — engine pins via path dep. | If you need kernel functionality from outside, request the engine expose it through its facade. |

Frontend binding files (`interfaces/desktop/src/lib/sys/generated/*`)
are **regenerated**, not hand-edited. Don't modify them directly.

## Making changes

### Bug fix or small feature in the engine
1. Open an issue describing the change.
2. Implement.
3. Run `cargo check --workspace` and `cargo test -p devpulse-engine`.
4. If you touched a Tauri command return type or added a new command,
   run `cargo xtask regen-bindings` and commit the diff in
   `bindings.ts` with your change.
5. If you touched the Svelte UI, run `pnpm check` from
   `interfaces/desktop/`.
6. Open a PR.

### New managed service
See `ARCHITECTURE.md` § Service lifecycle. The drift-protection tests
will tell you if you missed a step.

### New kernel type that crosses to the frontend
1. Add `#[cfg_attr(feature = "specta", derive(specta::Type))]` to the
   kernel struct. (Specta is gated on an optional feature so kernel-only
   builds don't pull it in.)
2. Re-export from `systems/devpulse-engine/src/platform/mod.rs` with an
   `IP-NOTE:` comment explaining why the type is vocabulary-safe (or
   what rename you applied at the seam).
3. Use it from a Tauri command.
4. Run `cargo xtask regen-bindings` and commit the TS diff.

**Anti-pattern** — do NOT author an engine-side DTO struct that mirrors
a kernel struct with an `impl From<KernelFoo> for EngineFoo`. Add the
specta derive to the kernel type and re-export it. The boundary is
vocabulary, not duplicate types.

### Renaming a kernel concept for the public surface
Use the `as` re-export at the seam:

```rust
// systems/devpulse-engine/src/platform/mod.rs
pub use devpulse_clyffy::cortex::knowledge::{
    EntryType as KnowledgeEntryType,  // kernel "EntryType" → public "KnowledgeEntryType"
    ...
};
```

For deeper renames (e.g. an internal sub-agent identity that should
never leak), use `ip_term!()` and the registry at
`systems/devpulse-engine/ip/signals.registry.yaml`.

## What we won't merge

- Glob re-exports from kernel into engine (`pub use devpulse_clyffy::*`).
- Engine-side wrapper structs that duplicate kernel types just to
  add specta.
- Kernel imports of engine types (kernel never depends on engine).
- Frontend imports of `devpulse_clyffy` or `model_loader` (frontend
  goes through `devpulse_engine` only).
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
shipping product consistent for a layman audience. If you see something
in the kernel referred to by an internal name and you want to surface
it on the public side, **rename it at the seam**, don't use the kernel
name in user-visible copy. The `ip_term!()` macro and lefthook hook
catch most accidents at commit time.

## Repo layout

See `ARCHITECTURE.md`. Every kernel reachability rule and naming
convention is documented there.
