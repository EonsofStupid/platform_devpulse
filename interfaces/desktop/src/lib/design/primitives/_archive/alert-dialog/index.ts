/**
 * @file primitives/alert-dialog/index.ts
 * @layer primitives
 *
 * AlertDialog primitive namespace export.
 * AlertDialog is for destructive/confirmation actions requiring explicit user decision.
 *
 * @example
 * ```svelte
 * import { AlertDialog } from "$lib/design/primitives";
 *
 * <AlertDialog.Root bind:open>
 *   <AlertDialog.Trigger>Delete Item</AlertDialog.Trigger>
 *   <AlertDialog.Portal>
 *     <AlertDialog.Overlay />
 *     <AlertDialog.Content>
 *       <AlertDialog.Title>Are you sure?</AlertDialog.Title>
 *       <AlertDialog.Description>
 *         This action cannot be undone.
 *       </AlertDialog.Description>
 *       <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
 *       <AlertDialog.Action onclick={handleDelete}>Delete</AlertDialog.Action>
 *     </AlertDialog.Content>
 *   </AlertDialog.Portal>
 * </AlertDialog.Root>
 * ```
 */

// ============================================
// COMPONENTS
// ============================================

export { default as Action } from "./Action.svelte";
export { default as Cancel } from "./Cancel.svelte";
export { default as Content } from "./Content.svelte";
export { default as Description } from "./Description.svelte";
export { default as Overlay } from "./Overlay.svelte";
export { default as Portal } from "./Portal.svelte";
export { default as Root } from "./Root.svelte";
export { default as Title } from "./Title.svelte";
export { default as Trigger } from "./Trigger.svelte";

// ============================================
// TYPES
// ============================================

export type {
	AlertDialogActionProps,
	AlertDialogCancelProps,
	AlertDialogContentProps,
	AlertDialogDescriptionProps,
	AlertDialogOverlayProps,
	AlertDialogPortalProps,
	AlertDialogRootProps,
	AlertDialogSlot,
	AlertDialogState,
	AlertDialogTitleProps,
	AlertDialogTriggerProps,
} from "./types.js";

export { AlertDialogSlots } from "./types.js";
