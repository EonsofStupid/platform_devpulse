/**
 * @file List Component Barrel
 * @kind list
 * @layer components
 */

export { contract as listComponentContract } from "./contract.js";
export { default as List } from "./List.svelte";
export { listComposition } from "./composition.js";
export type { ListComponentProps, ListSize, ListSpacing, ListVariant } from "./types.js";
