/**
 * @file devtools/clyffy/memory/persona-graph/index.ts
 * @module @devpulse/devtools/clyffy/memory/persona-graph
 *
 * Persona surfaces — Clyffy's identity / knowledge graph view.
 * Backed by `#lib/sys/data-access/rro/brain.svc.ts` + `rroState.brainXxx`;
 * the data-layer extraction into this devtool is a follow-up. The route
 * hierarchy (`/devtools/clyffy/memory/persona-graph`) is the SSOT URL.
 */

export { default as PersonaGraphDevtool } from "./feature/PersonaGraphDevtool.svelte";
