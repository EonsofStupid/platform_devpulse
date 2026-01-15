# Interfaces: Desktop (The World)

> **ROLE**: The User Interface. Layman Visuals.
> **ACCESS**: Wry, Tauri, Svelte. "The Glass".
> **VISIBILITY**: The Product Binary.

## The Law
1.  **No Business Logic**: The backend (`src-tauri`) dispatches commands. It does not "Think".
2.  **Functional Commands**: `commands/mod.rs` is the registry.
3.  **Visuals First**: `src/lib/` (Svelte) drives the experience.

## Manifest (The Blueprint)
- `src-tauri/src/commands/`: The API Surface.
- `src-tauri/src/sys/`: Guard, Config, Logger.
- `src/lib/layouts/`: The Shells (Chat vs App).
- `src/lib/domains/`: Bounded Visual Contexts (DevMaestro, WiredFront).

## Maintenance Checklist
- [ ] **Command Register**: Did you add your new command to `commands/mod.rs` implementation AND `connect_commands()`?
- [ ] **Duplicate UI**: Check `lib/components/ui` for primitives before building custom.
