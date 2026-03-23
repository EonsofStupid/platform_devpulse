/**
 * @file DataTable Component Barrel
 * @kind data-table
 * @layer components
 */

export { contract as dataTableComponentContract } from "./contract.js";
export { default as DataTable } from "./DataTable.svelte";
export { dataTableComposition } from "./composition.js";
export type { DataTableComponentProps, DataTableSize, DataTableVariant } from "./types.js";
