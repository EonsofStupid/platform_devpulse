/**
 * @file api/adapters/meltui/_internal/slider/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI slider adapter.
 * Maps melt v0.44 Slider API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root, thumb
 * Slots structural (ColdLight): track, range
 * States: value
 *
 * Melt v0.44 Slider uses direct getter properties (.root, .thumb)
 * that return attribute objects — no .refs API. The root element
 * receives role="slider" with full ARIA (valuemin/max/now/orientation).
 *
 * Note: Melt v0.44 Slider has no `disabled` prop. Disabled state
 * must be handled at the component layer (aria-disabled, pointer-events).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface SliderTransportStates {
	/** The current slider value */
	value: number;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface SliderTransportConfig {
	/** Minimum slider value. @default 0 */
	min?: number;
	/** Maximum slider value. @default 100 */
	max?: number;
	/** Initial value. Pass a getter for controlled mode. */
	value?: number | (() => number);
	/** Step increment. @default 1 */
	step?: number;
	/** Slider orientation. @default "horizontal" */
	orientation?: "horizontal" | "vertical";
	/** Called when value changes. */
	onValueChange?: (value: number) => void;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight slider transport — the public contract for the melt slider adapter.
 *
 * Slots (melt-managed): root (role=slider + ARIA), thumb
 * Slots (structural): track, range
 * States: value
 */
export type SliderTransport = TransportAdapter<
	"root" | "track" | "range" | "thumb",
	SliderTransportStates
> & {
	readonly slots: {
		readonly root: SlotAttrs;
		readonly track: SlotAttrs;
		readonly range: SlotAttrs;
		readonly thumb: SlotAttrs;
	};
};
