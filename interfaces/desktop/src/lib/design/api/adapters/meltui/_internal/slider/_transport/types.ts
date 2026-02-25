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
 * The `refs` object exposes melt's attachment API for DOM registration.
 * Components use: `use:transport.refs.attach("root")` on the root element.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { Attachment } from "svelte/attachments";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface SliderTransportStates {
	/** The current slider value */
	value: number;
}

// =============================================================================
// TRANSPORT REFS — Svelte attachment protocol for DOM registration
// =============================================================================

export interface SliderTransportRefs {
	/** Attach to the root slider container element. */
	root: () => Attachment<HTMLElement>;
	/** Attach to the thumb element. Required for drag interaction. */
	thumb: () => Attachment<HTMLElement>;
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
	/** Whether the slider is disabled. */
	disabled?: boolean | (() => boolean);
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight slider transport — the public contract for the melt slider adapter.
 *
 * Slots (melt-managed): root, thumb
 * Slots (structural): track, range
 * States: value
 * Refs: Svelte attachments for DOM lifecycle
 */
export type SliderTransport = TransportAdapter<
	"root" | "track" | "range" | "thumb",
	SliderTransportStates
> & {
	/** Svelte attachment protocol — use these on the corresponding DOM elements */
	readonly refs: SliderTransportRefs;
	/** Slot attrs for each slider slot */
	readonly slots: {
		readonly root: SlotAttrs;
		readonly track: SlotAttrs;
		readonly range: SlotAttrs;
		readonly thumb: SlotAttrs;
	};
};
