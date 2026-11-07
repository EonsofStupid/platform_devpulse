/**
 * @file api/adapters/coldlight/_internal/dropdown-menu/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the ColdLight dropdown menu builder.
 * Maps ColdLightDropdownMenu → ColdLight slot vocabulary.
 *
 * Composes trigger semantics (aria-haspopup, aria-expanded) with
 * menu content (role="menu") from the shared ColdLightMenu base.
 *
 * Slots (static): trigger, content, separator
 * Slots (parameterized): getItem(meta), getGroup(label)
 * States: open, orientation
 * Attachments: attachContent, attachTrigger
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/
 */

import type { SlotAttrs, TransportAdapter } from "../../../_transport/types.js";
import type { MenuItemMeta } from "../../menu/_transport/types.js";

// Re-export for consumers
export type { MenuItemMeta };

// ─────────────────────────────────────────────────────────
// TRANSPORT STATES
// ─────────────────────────────────────────────────────────

export interface DropdownMenuTransportStates {
    /** Whether the dropdown menu is open. */
    open: boolean;
    /** Menu orientation. */
    readonly orientation: "horizontal" | "vertical";
}

// ─────────────────────────────────────────────────────────
// TRANSPORT CONFIG
// ─────────────────────────────────────────────────────────

export interface DropdownMenuTransportConfig {
    /** Whether the menu is open. */
    open?: boolean;
    /** Called when open state changes. */
    onOpenChange?: (value: boolean) => void;
    /** Menu orientation. @default "vertical" */
    orientation?: "horizontal" | "vertical";
    /** Whether arrow keys loop. @default true */
    loop?: boolean;
    /** Typeahead timeout in ms. @default 500 */
    typeaheadTimeout?: number;
    /** Whether outside click closes. @default true */
    closeOnOutsideClick?: boolean;
    /** Whether Escape closes. @default true */
    closeOnEscape?: boolean;
}

// ─────────────────────────────────────────────────────────
// TRANSPORT ACTIONS (parameterized slots)
// ─────────────────────────────────────────────────────────

export interface DropdownMenuActions {
    /** Get slot attrs for a menu item. */
    getItem(meta: MenuItemMeta): SlotAttrs;
    /** Get slot attrs for a labeled group. */
    getGroup(label: string): SlotAttrs;
}

// ─────────────────────────────────────────────────────────
// TRANSPORT ATTACHMENTS
// ─────────────────────────────────────────────────────────

export interface DropdownMenuAttachments {
    /** Attach to the menu content element. */
    attachContent: (node: HTMLElement) => { destroy(): void };
    /** Attach to the trigger element. */
    attachTrigger: (node: HTMLElement) => { destroy(): void };
}

// ─────────────────────────────────────────────────────────
// TRANSPORT ADAPTER
// ─────────────────────────────────────────────────────────

/**
 * ColdLight dropdown menu transport — trigger-activated menu popup.
 *
 * Static slots: trigger, content, separator
 * Parameterized: getItem(meta), getGroup(label)
 * Attachments: attachContent (dismiss + escape + presence), attachTrigger
 */
export type DropdownMenuTransport = TransportAdapter<
    "trigger" | "content" | "separator",
    DropdownMenuTransportStates
> &
    DropdownMenuActions &
    DropdownMenuAttachments;
