/**
 * @file AlertDialog Component Barrel
 * @kind alert-dialog
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as AlertDialog } from "./AlertDialog.svelte";
export { default as AlertDialogTrigger } from "./AlertDialogTrigger.svelte";
export { default as AlertDialogOverlay } from "./AlertDialogOverlay.svelte";
export { default as AlertDialogContent } from "./AlertDialogContent.svelte";
export { default as AlertDialogTitle } from "./AlertDialogTitle.svelte";
export { default as AlertDialogDescription } from "./AlertDialogDescription.svelte";
export { default as AlertDialogAction } from "./AlertDialogAction.svelte";
export { default as AlertDialogCancel } from "./AlertDialogCancel.svelte";

export { contract as alertDialogComponentContract } from "./contract.js";
export { alertDialogRecipe } from "./recipe.js";
export { setAlertDialogContext, getAlertDialogContext } from "./context.js";

export type {
	AlertDialogProps,
	AlertDialogTriggerProps,
	AlertDialogOverlayProps,
	AlertDialogContentProps,
	AlertDialogTitleProps,
	AlertDialogDescriptionProps,
	AlertDialogActionProps,
	AlertDialogCancelProps,
} from "./types.js";

export type { AlertDialogContext } from "./context.js";
