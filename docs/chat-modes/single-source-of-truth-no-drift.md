# Single source of truth — no drift

> Rust kernel owns it. UI consumes it. No parallel duplicates.

**Verified triggers (corpus document-frequency):** `SSOT` (88 hits), `source of truth` (54), `regen-bindings` (49 — appearing as a flow), `specta` (frequent), `vocabulary` (frequent), `ip boundary` (frequent).

**Promote to:** skill.
**Existing memory:** [feedback_ip_boundary_is_vocabulary_not_wrappers.md](../../memory/feedback_ip_boundary_is_vocabulary_not_wrappers.md), [project_cortex_surfaces.md](../../memory/project_cortex_surfaces.md), [project_user_config_pattern.md](../../memory/project_user_config_pattern.md).

## The recurring ask, in one sentence

The user repeatedly demands that a concept (config, slot definition, vocabulary, terminology, hardware tier, dev profile) live in exactly one place — typically the Rust kernel — and that other layers consume via codegen or vocabulary translation, never via parallel duplicates.

## The real underlying need

A clean contract where the Rust side owns canonical state and the frontend reads via generated types. Removes drift, removes "find/replace across N files," and makes the IP boundary work as a vocabulary layer rather than parallel DTOs.

## Automatic actions

- Before adding a type / enum / string label, search for an existing definition in `kernel/devpulse-clyffy` or `systems/devpulse-engine` and reuse it.
- When a kernel type needs to cross IPC, derive `specta::Type` on the kernel type — do not create an engine DTO mirror.
- Use the existing vocabulary registry (`ip_term!`, surface registry) for layman-facing labels.
- Run `cargo xtask regen-bindings` whenever a Rust type changes shape.
- Flag any duplicate storage of the same concept (preferences.json + libSQL + SurrealDB) as a STOP point.
- When asked to add a UI label, register it in the YAML/registry first, then consume the generated const.

## Anti-patterns

- `pub struct FooDto { ... } impl From<KernelFoo> for FooDto`.
- Hardcoding a string label in a Svelte file when a registered surface const exists.
- Adding a third storage location for an already-duplicated concept.
- Writing a parallel enum with the same variants for IPC.
- Maintaining synced copies of the same model list in Rust and TS.
