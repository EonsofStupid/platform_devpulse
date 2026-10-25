/**
 * @file domains/clyffy/persona/index.ts
 * @module @devpulse/domains/clyffy/persona
 *
 * Persona surfaces — Clyffy's identity / knowledge graph view.
 * Backed transitionally by `domains/sys/rro/data-access/brain.svc.ts`
 * + `rroState.brainXxx`; the data-layer extraction into this domain
 * is a follow-up. The visible UI lives here so the route hierarchy
 * (`/devtools/clyffy/memory/persona-graph`) is honest about ownership.
 */

export { default as PersonaGraphDevtool } from "./PersonaGraphDevtool.svelte";
