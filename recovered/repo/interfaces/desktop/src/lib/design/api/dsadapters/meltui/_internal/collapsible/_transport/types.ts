/**
 * @file api/adapters/meltui/_internal/collapsible/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI collapsible adapter.
 * Maps melt v0.44 Collapsible API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface CollapsibleTransportStates {
	/** Whether the collapsible section is currently open */
	open: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface CollapsibleTransportConfig {
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Whether the collapsible is disabled. */
	disabled?: boolean;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight collapsible transport — the public contract for the melt collapsible adapter.
 *
 * Slots (melt-managed): trigger, content
 * States: open
 */
export type CollapsibleTransport = TransportAdapter<
	"trigger" | "content",
	CollapsibleTransportStates
> & {
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
	};
};
