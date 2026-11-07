/**
 * @file src/lib/design/semantics/panels/index.ts
 * @layer semantics
 * @category panels
 *
 * @description
 * Panel semantics SSOT.
 * All panel semantic exports go through this file.
 *
 * @since 1.0.0
 */

// Temporarily re-export from block_library during migration
export { default as Panel } from "../../block_library/Panel.svelte";
export { default as GlassPanel } from "../../block_library/Panel.svelte";

// Future: Export from local files
// export { default as GlassPanel } from "./GlassPanel.svelte";
// export { default as MattePanel } from "./MattePanel.svelte";
// export { default as MetalPanel } from "./MetalPanel.svelte";
