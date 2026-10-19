import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Alert Dialog primitive.
 *
 * Alert dialogs require explicit user decisions — they cannot be casually dismissed.
 * Unlike regular dialogs, they use `role="alertdialog"` which triggers urgent
 * screen reader announcements, and focus starts on the cancel (least destructive) button.
 *
 * Use for: delete confirmations, unsaved changes warnings, irreversible actions.
 *
 * @example
 * ```svelte
 * <button {...alertDialogAnatomy.attrs.trigger}>Delete account</button>
 * <dialog {...alertDialogAnatomy.attrs.content} role="alertdialog" aria-modal="true">
 *   <h2 {...alertDialogAnatomy.attrs.title}>Delete your account?</h2>
 *   <p {...alertDialogAnatomy.attrs.description}>This cannot be undone.</p>
 *   <button {...alertDialogAnatomy.attrs.cancel}>Cancel</button>
 *   <button {...alertDialogAnatomy.attrs.action}>Delete</button>
 * </dialog>
 * ```
 */
export interface AlertDialogPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the alert dialog */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether the dialog is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Callback when the action button is pressed (confirm/destructive action) */
	onAction?: () => void;
	/** Callback when the cancel button is pressed or Escape is pressed */
	onCancel?: () => void;
}
