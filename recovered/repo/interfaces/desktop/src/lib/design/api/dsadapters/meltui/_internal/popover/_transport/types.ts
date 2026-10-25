/**
 * @file api/adapters/meltui/_internal/popover/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI popover adapter.
 * Maps melt v0.44 Popover API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content, arrow
 * States: open
 *
 * Melt v0.44 Popover uses direct getter properties (.trigger, .content, .arrow)
 * that return attribute objects — no .refs API. Getters are mapped to SlotAttrs.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/popover/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface PopoverTransportStates {
	/** Whether the popover is currently open */
	open: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface PopoverTransportConfig {
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** If the popover visibility should be controlled by the user. @default false */
	forceVisible?: boolean | (() => boolean);
	/** If the popover should have the same width as the trigger. @default false */
	sameWidth?: boolean | (() => boolean);
	/** Close on Escape key. @default true */
	closeOnEscape?: boolean | (() => boolean);
	/** Close on outside click. @default true */
	closeOnOutsideClick?: boolean | (() => boolean);
	/** Floating UI configuration (shift, flip, offset, arrow). */
	floatingConfig?: Record<string, unknown>;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight popover transport — the public contract for the melt popover adapter.
 *
 * Slots (melt-managed): trigger, content, arrow
 *   - trigger: onclick, popovertarget, onfocus, onfocusout, data-melt-popover-trigger
 *   - content: id, popover="manual", inert, data-open, ontoggle, data-melt-popover-content
 *   - arrow: data-arrow, aria-hidden, data-open, data-melt-popover-arrow
 * States: open (getter/setter)
 */
export type PopoverTransport = TransportAdapter<
	"trigger" | "content" | "arrow",
	PopoverTransportStates
> & {
	/** Slot attrs for each popover slot */
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
		readonly arrow: SlotAttrs;
	};
	/** Close the popover programmatically */
	close(): void;
};
