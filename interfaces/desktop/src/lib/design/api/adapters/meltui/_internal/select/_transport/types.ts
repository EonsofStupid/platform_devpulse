/**
 * @file api/adapters/meltui/_internal/select/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI select adapter.
 * Maps melt v0.44 Select API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content, label
 * Slots dynamic (via method): item (created via select.item(value))
 * Slots structural: group
 *
 * The `refs` object exposes melt's attachment API for DOM registration.
 * Components use: `use:transport.refs.attach("trigger")` on the trigger element.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { Attachment } from "svelte/attachments";
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
	/** The currently selected value */
	value: T;
	/** The currently highlighted value (keyboard/hover focus) */
	highlighted: T | null;
}

// =============================================================================
// TRANSPORT REFS — Svelte attachment protocol for DOM registration
// =============================================================================

export interface SelectTransportRefs {
	/** Attach to the trigger button element. Required for positioning anchor. */
	trigger: () => Attachment<HTMLElement>;
	/** Attach to the dropdown content element. Required for floating positioning. */
	content: () => Attachment<HTMLElement>;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface SelectTransportConfig<T = unknown> {
	/** Initial selected value. Pass a getter for controlled mode. */
	value?: T | (() => T);
	/** Called when selected value changes. */
	onValueChange?: (value: T) => void;
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Floating UI positioning configuration. */
	positioning?: Record<string, unknown>;
	/** Timeout for typeahead search in milliseconds. */
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
 * Refs: Svelte attachments for DOM lifecycle
 */
export type SelectTransport<T = unknown> = TransportAdapter<
	"trigger" | "content" | "label" | "group",
	SelectTransportStates<T>
> & {
	/** Svelte attachment protocol — use these on the corresponding DOM elements */
	readonly refs: SelectTransportRefs;
	/** Slot attrs for each select slot */
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
		readonly label: SlotAttrs;
		readonly group: SlotAttrs;
	};
	/** Create slot attrs for an individual option item */
	item(value: T): SlotAttrs;
};
