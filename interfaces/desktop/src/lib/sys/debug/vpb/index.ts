/**
 * @file VPB — Visual Page Builder Barrel Export
 * @layer vpb
 * @package @devpulse/sys
 *
 * Public API for VPB. Import from here, not from internal paths. The
 * full-window builder (`Vpb.svelte`) is not here: the frame loads it on request,
 * since it brings the graph view.
 */

export * from "./components/index.js";
export { default as VPBFrame } from "./shell/frame.svelte";
export { dnd } from "./state/dnd.svelte.js";
export { vpb } from "./state/vpb.svelte.js";
export { vpbConnection } from "./state/vpb-connection.svelte.js";
export { vpbDocument } from "./state/vpb-document.svelte.js";
export { vpbPalette } from "./state/vpb-palette.svelte.js";
export { vpbVisual } from "./state/vpb-visual.svelte.js";
