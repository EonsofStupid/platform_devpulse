/**
 * @file api/adapters/coldlight/_internal/alert-dialog/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight alert dialog transport from ColdLightAlertDialog.
 * Maps internal class → ColdLight slot vocabulary.
 */

import { ColdLightAlertDialog } from "../alert-dialog.svelte.js";
import type {
    AlertDialogAttachments,
    AlertDialogTransport,
    AlertDialogTransportConfig,
} from "./types.js";

/**
 * Create a ColdLight alert dialog transport.
 *
 * @example
 * ```svelte
 * const alertDialog = createAlertDialogTransport({
 *   open: false,
 *   onOpenChange: (v) => console.log("open:", v),
 * });
 *
 * <button {...alertDialog.slots.trigger}>Delete</button>
 * <dialog use:alertDialog.attachContent {...alertDialog.slots.content}>
 *   <h2 {...alertDialog.slots.title}>Are you sure?</h2>
 *   <p {...alertDialog.slots.description}>This cannot be undone.</p>
 *   <button {...alertDialog.slots.cancel}>Cancel</button>
 *   <button {...alertDialog.slots.action} onclick={handleDelete}>Delete</button>
 * </dialog>
 * ```
 */
export function createAlertDialogTransport(
    config?: AlertDialogTransportConfig,
): AlertDialogTransport & AlertDialogAttachments {
    const dialog = new ColdLightAlertDialog({
        open: config?.open,
        onOpenChange: config?.onOpenChange,
        closeOnEscape: config?.closeOnEscape,
        preventScroll: config?.preventScroll,
    });

    return {
        slots: {
            get trigger() {
                return dialog.trigger;
            },
            get content() {
                return dialog.content;
            },
            get overlay() {
                return dialog.overlay;
            },
            get portal() {
                return dialog.portal;
            },
            get title() {
                return dialog.title;
            },
            get description() {
                return dialog.description;
            },
            get cancel() {
                return dialog.cancel;
            },
            get action() {
                return dialog.action;
            },
        },
        states: {
            get open() {
                return dialog.open;
            },
            set open(v: boolean) {
                dialog.open = v;
            },
        },
        attachContent: (node) => dialog.attachContent(node),
        attachOverlay: (node) => dialog.attachOverlay(node),
        attachTrigger: (node) => dialog.attachTrigger(node),
    };
}
