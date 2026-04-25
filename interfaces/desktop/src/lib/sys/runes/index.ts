/**
 * @file sys/runes/index.ts
 * @module @devpulse/sys/runes
 * @description Barrel for the canonical Tauri-aware rune helpers.
 *
 * Convention:
 * - `TauriQuery` — fetch + result + loading + error
 * - `TauriEventStream` — listen + value + history (auto-cleanup via $effect)
 * - `PolledQuery` — TauriQuery + interval + visibility-aware pause
 *
 * Use `okQuery()` to wrap legacy bare-promise commands into the unified
 * Result-returning shape these helpers expect.
 */

export type { SpectaResult, SpectaThunk } from "./_shared.js";
export { okQuery, toCommandError } from "./_shared.js";
export type { PollOptions } from "./usePoll.svelte.js";
export { PolledQuery } from "./usePoll.svelte.js";
export type { TauriEventOptions } from "./useTauriEvent.svelte.js";
export { TauriEventStream } from "./useTauriEvent.svelte.js";
export type { TauriQueryOptions } from "./useTauriQuery.svelte.js";
export { TauriQuery } from "./useTauriQuery.svelte.js";
