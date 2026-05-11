/**
 * @file Reasoning devtool shared primitives — barrel.
 * @module @devpulse/devtools/clyffy/reasoning/_shared
 *
 * Shared between the RRD and RRO devtools (both consume the same
 * topology visualization). Out-of-bounds creation guard: this dir
 * is the ONLY `_shared` allowed under `reasoning/` — feature-level
 * shared bits belong in their respective devtools, top-level shared
 * bits belong in `devtools/_shared/`.
 */

export type { NodeId as ReasoningNodeId } from "./ReasoningTopology.svelte";
export { default as ReasoningTopology } from "./ReasoningTopology.svelte";
