# `domains/chat` — Golden Chat Reference

This domain is the **reference implementation** for DevPulse desktop library-types:

- **`util/`** — ArkType contracts, pure helpers, view-model types. Imports nothing else in-domain.
- **`data-access/`** — Svelte 5 class singletons (`chatState`, `sessionsState`), IPC only in `chat.service.ts`.
- **`ui/`** — Presentational Svelte; `renderForge` + token presets; may import `util` only.
- **`feature/`** — Smart composition (`ChatRoot` is the only exported feature); may import `ui`, `data-access`, `util`.
- **`index.ts`** — Public barrel: `ChatRoot`, `chatState`, `sessionsState`, and shared types.

## Copy pattern

When authoring a new domain, duplicate this folder layout and dependency arrows, swap IPC services for your domain’s `*.service.ts`, and register ColdLight presets under `packages/coldlight/visual/presets/<domain>.ts` + `ALL_PRESETS`.

## Persistence SSOT

Chat persistence is **`sessions` + `turns`** in the engine user-scoped Turso schema. The Tauri command layer (`src-tauri/src/commands/chat/`) is the IPC boundary; the UI never calls `@tauri-apps/api` outside `chat.service.ts`.

## Motion rules

Intent-driven motion only: `TypingIndicator` uses infinite `cl-breathe`; structural surfaces do not ambient-scale (`neuroElevated.animation = none`).
