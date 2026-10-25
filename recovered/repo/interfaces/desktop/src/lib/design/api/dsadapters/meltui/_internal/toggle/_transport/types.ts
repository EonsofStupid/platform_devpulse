/**
 * @file api/adapters/meltui/_internal/toggle/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI toggle adapter.
 * Maps melt v0.44 Toggle API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface ToggleTransportStates {
	/** Whether the toggle is currently pressed */
	pressed: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface ToggleTransportConfig {
	/** Initial pressed state. Pass a getter for controlled mode. */
	value?: boolean | (() => boolean);
	/** Called when pressed state changes. */
	onValueChange?: (value: boolean) => void;
	/** Whether the toggle is disabled. */
	disabled?: boolean | (() => boolean | undefined);
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight toggle transport — the public contract for the melt toggle adapter.
 *
 * Slots (melt-managed): trigger
 * States: pressed
 */
export type ToggleTransport = TransportAdapter<
	"trigger",
	ToggleTransportStates
> & {
	readonly slots: {
		readonly trigger: SlotAttrs;
	};
};
