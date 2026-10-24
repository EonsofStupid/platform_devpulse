/**
 * @file Dialog Blocks Barrel
 * @description Pre-composed WAI-ARIA APG dialog patterns built on top of
 * the ColdLight `dialog/` + `alert-dialog/` primitives. Every block
 * takes a single typed props struct (strings injected via the cascade,
 * never hardcoded English), composes primitives only, and inherits the
 * primitive's APG focus trap / Escape handling / aria-* plumbing.
 *
 * Pick the right block for the surface:
 *
 * - `ConfirmDialog` — binary destructive confirm. `role="alertdialog"`
 *   variant — focus auto-captured on Cancel by default for safety.
 * - `FormDialog` — typed form modal (Create Project, Add Reference,
 *   Edit Settings). `role="dialog"`. Submit + Cancel footer.
 * - `PickerDialog` — "pick one of many" generic list overlay with
 *   search input. Generic over the item type via Svelte `generics`.
 * - `WizardDialog` — multi-step wizard chrome. Always non-dismissible
 *   by default — wizard navigation lives in the footer slot.
 */

export { default as ConfirmDialog } from "./ConfirmDialog.svelte";
export { default as FormDialog } from "./FormDialog.svelte";
export { default as PickerDialog } from "./PickerDialog.svelte";
export { default as WizardDialog } from "./WizardDialog.svelte";
