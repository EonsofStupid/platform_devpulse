/**
 * @file VibePulse — Devtools Suite Central Import
 * @module @devpulse/sys/debug
 * @layer lib
 *
 * VibePulse is the devtools overlay portal (V icon).
 * Advanced tools are included in the shipped application.
 *
 * Devtools:
 *   - VPB (Visual Page Builder) — `vpb/`, the root layout mounts it for the
 *     Advanced display; its route is /devtools/system/design/vpb
 *   - (future devtools register here)
 */

export { default as HfTokenPanel } from "./HfTokenPanel.svelte";

/** Load the VPB when the Advanced display asks for it; the Simple display never loads it. */
export const loadVisualPageBuilder = () => import("./vpb/index.js");
