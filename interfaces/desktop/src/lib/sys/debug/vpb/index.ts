/**
 * @file VPB — Visual Page Builder Barrel Export
 * @layer vpb
 * @package @devpulse/sys
 *
 * Public API for VPB. Import from here, not from internal paths.
 */

export { vpbConnection } from "./state/vpb-connection.svelte.js";
export { vpbDocument } from "./state/vpb-document.svelte.js";
export { vpbPalette } from "./state/vpb-palette.svelte.js";
export { vpbVisual } from "./state/vpb-visual.svelte.js";
export { default as Vpb } from "./Vpb.svelte";
