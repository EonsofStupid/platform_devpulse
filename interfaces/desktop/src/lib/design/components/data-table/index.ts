/**
 * @file DataTable Component Barrel
 * @kind data-table
 * @layer components
 */

export { contract as dataTableComponentContract } from "./contract.js";
export { default as DataTable } from "./DataTable.svelte";
export { dataTableRecipe } from "./recipe.js";
export type { DataTableComponentProps, DataTableSize, DataTableVariant } from "./types.js";
