/**
 * @file src/lib/design/semantics/inputs/index.ts
 * @layer semantics
 * @category inputs
 *
 * @description
 * Input semantics SSOT.
 * All input semantic exports go through this file.
 *
 * @since 1.0.0
 */

// Temporarily re-export from block_library during migration
export { default as Input } from "../../block_library/Input.svelte";
export { default as Toggle } from "../../block_library/Toggle.svelte";

// Future: Export from local files
// export { default as GlassInput } from "./GlassInput.svelte";
// export { default as SearchInput } from "./SearchInput.svelte";
// export { default as TextArea } from "./TextArea.svelte";
