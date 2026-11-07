/**
 * @file api/adapters/coldlight/_internal/alert-dialog/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the ColdLight alert dialog builder.
 * Maps ColdLightAlertDialog → ColdLight slot vocabulary.
 *
 * Differs from DialogTransport:
 * - Uses "cancel" + "action" slots instead of generic "close"
 * - role="alertdialog" instead of role="dialog"
 * - No outside click dismiss
 *
 * Slots: trigger, overlay, content, title, description, cancel, action, portal
 * States: open
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import type { TransportAdapter } from "../../../_transport/types.js";

/** Alert dialog slot names. */
type AlertDialogSlot = "trigger" | "overlay" | "content" | "title" | "description" | "cancel" | "action" | "portal";

export interface AlertDialogTransportStates {
    open: boolean;
}

export type AlertDialogTransport = TransportAdapter<AlertDialogSlot, AlertDialogTransportStates>;

export interface AlertDialogTransportConfig {
    /** Whether the alert dialog is open. */
    open?: boolean;
    /** Called when open state changes. */
    onOpenChange?: (value: boolean) => void;
    /** Whether Escape closes the dialog. @default false */
    closeOnEscape?: boolean;
    /** Whether to lock body scroll. @default true */
    preventScroll?: boolean;
}

export interface AlertDialogAttachments {
    /** Attach to the <dialog> content element. */
    attachContent: (node: HTMLDialogElement) => { destroy(): void };
    /** Attach to the overlay element. */
    attachOverlay: (node: HTMLElement) => { destroy(): void };
    /** Attach to the trigger element. */
    attachTrigger: (node: HTMLElement) => { destroy(): void };
}
