/**
 * @file api/adapters/meltui/_internal/select/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI select adapter.
 * Maps melt v0.44 Select API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content, label
 * Slots dynamic (via method): option (created via select.getOption(value))
 * Slots structural: group
 *
 * Melt v0.44 Select extends BasePopover. Uses direct getter properties
 * (.trigger, .content, .label, .arrow) and getOption(value, label?) for
 * per-option attrs — no .refs API.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface SelectTransportStates<T = unknown> {
	/** Whether the select dropdown is currently open */
	open: boolean;
	/** The currently selected value (undefined when nothing selected) */
	value: T | undefined;
	/** The currently highlighted value (keyboard/hover focus) */
	highlighted: T | null;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface SelectTransportConfig<T = unknown> {
	/** Initial selected value. Pass a getter for controlled mode. */
	value?: T | (() => T | undefined);
	/** Called when selected value changes (undefined when deselected). */
	onValueChange?: (value: T | undefined) => void;
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Floating UI configuration (shift, flip, offset, arrow). */
	floatingConfig?: Record<string, unknown>;
	/** Timeout for typeahead search in milliseconds. @default 500 */
	typeaheadTimeout?: number;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight select transport — the public contract for the melt select adapter.
 *
 * Slots (melt-managed): trigger, content, label
 * Slots (dynamic): item — created via `transport.item(value)`
 * Slots (structural): group
 * States: open, value, highlighted
 */
export type SelectTransport<T = unknown> = TransportAdapter<
	"trigger" | "content" | "label" | "group",
	SelectTransportStates<T>
> & {
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
		readonly label: SlotAttrs;
		readonly group: SlotAttrs;
	};
	/** Create slot attrs for an individual option item */
	item(value: T, label?: string): SlotAttrs;
};
