/**
 * @file primitives/tanstack/index.ts
 * @layer primitives
 *
 * Svelte 5 adapter for TanStack Table.
 * Re-exports table-core plus custom Svelte 5 bindings.
 *
 * Usage:
 * ```ts
 * import {
 *   createSvelteTable,
 *   createColumnHelper,
 *   getCoreRowModel,
 *   FlexRender,
 *   renderComponent,
 *   renderSnippet,
 * } from "$lib/design/primitives/tanstack";
 * ```
 */

// Re-export everything from table-core
export * from "@tanstack/table-core";

// Svelte 5 adapter exports
export { default as FlexRender } from "./flex-render.svelte";
export { renderComponent, renderSnippet } from "./render-component.js";
export { createSvelteTable } from "./table.svelte.js";
