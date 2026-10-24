/**
 * @file devtools/runtimes/orchestrator/slots/index.ts
 * @module @devpulse/devtools/runtimes/orchestrator/slots
 *
 * Slot Orchestrator devtool surface — view + manage slot↔model
 * assignments, per-slot load/unload, VRAM headroom.
 *
 * Layer contract (Nx library-types):
 *   feature/      — SlotsDevtool (orchestrating component)
 */

export { default as SlotsDevtool } from "./feature/SlotsDevtool.svelte";
