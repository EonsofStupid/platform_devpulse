/**
 * @file src/lib/design/semantics/cards/index.ts
 * @layer semantics
 * @category cards
 *
 * @description
 * Card semantics SSOT.
 * All card semantic exports go through this file.
 *
 * @since 1.0.0
 */

// Temporarily re-export from block_library during migration
export { default as Card } from "../../block_library/Card.svelte";
export { default as Badge } from "../../block_library/Badge.svelte";

// Future: Export from local files
// export { default as GlassCard } from "./GlassCard.svelte";
// export { default as MetalCard } from "./MetalCard.svelte";
// export { default as StatCard } from "./StatCard.svelte";
