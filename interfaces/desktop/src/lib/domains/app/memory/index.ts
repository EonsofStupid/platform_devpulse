/**
 * @file Memory domain — what your agents can remember.
 * @module @devpulse/domains/app/memory
 *
 * The kernel's persona service keeps the notes, the engine owns them in the
 * user database, and agent sessions reach them through their own bound relay
 * (plan 0001 B6.2). This domain is you reading and changing them.
 */

export { memoryState } from "./data-access/memory.state.svelte.js";
export { default as YourMemory } from "./feature/YourMemory.svelte";
