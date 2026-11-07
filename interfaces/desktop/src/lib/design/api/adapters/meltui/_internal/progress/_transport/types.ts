/**
 * @file api/adapters/meltui/_internal/progress/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI progress adapter.
 * Maps melt v0.44 Progress API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root (maps to .root), indicator (maps to .progress)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface ProgressTransportStates {
	/** Current progress value */
	value: number;
	/** Maximum value for the progress bar */
	max: number;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface ProgressTransportConfig {
	/** Maximum value for the progress bar. @default 100 */
	max?: number;
	/** Initial progress value. */
	value?: number;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight progress transport — the public contract for the melt progress adapter.
 *
 * Slots (melt-managed): root, indicator
 * States: value, max
 *
 * Note: ColdLight maps melt's `.progress` getter to `slots.indicator`
 * for consistent naming across the design system.
 */
export type ProgressTransport = TransportAdapter<
	"root" | "indicator",
	ProgressTransportStates
> & {
	readonly slots: {
		readonly root: SlotAttrs;
		readonly indicator: SlotAttrs;
	};
};
