/**
 * @file api/adapters/meltui/_internal/radiogroup/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI radio group adapter.
 * Maps melt v0.44 RadioGroup API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root, label, hiddenInput
 * Slots dynamic (via method): item (created via radiogroup.item(value))
 * States: value
 *
 * The `refs` object exposes melt's attachment API for DOM registration.
 * Components use: `use:transport.refs.attach("root")` on the root element.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { Attachment } from "svelte/attachments";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface RadioGroupTransportStates {
	/** The currently selected radio value */
	value: string;
}

// =============================================================================
// TRANSPORT REFS — Svelte attachment protocol for DOM registration
// =============================================================================

export interface RadioGroupTransportRefs {
	/** Attach to the root radio group container element. */
	root: () => Attachment<HTMLElement>;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface RadioGroupTransportConfig {
	/** Initial selected value. Pass a getter for controlled mode. */
	value?: string | (() => string);
	/** Called when selected value changes. */
	onValueChange?: (value: string) => void;
	/** Whether the radio group is disabled. */
	disabled?: boolean | (() => boolean);
	/** Whether the radio group is required for form validation. */
	required?: boolean | (() => boolean);
	/** Whether keyboard navigation loops from last to first. @default true */
	loop?: boolean | (() => boolean);
	/** Whether an item is selected on focus. @default true */
	selectWhenFocused?: boolean;
	/** Radio group orientation. @default "vertical" */
	orientation?: "horizontal" | "vertical";
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight radio group transport — the public contract for the melt radio group adapter.
 *
 * Slots (melt-managed): root, label, hiddenInput
 * Slots (dynamic): item — created via `transport.item(value)`
 * States: value
 * Refs: Svelte attachments for DOM lifecycle
 */
export type RadioGroupTransport = TransportAdapter<
	"root" | "label" | "hiddenInput",
	RadioGroupTransportStates
> & {
	/** Svelte attachment protocol — use these on the corresponding DOM elements */
	readonly refs: RadioGroupTransportRefs;
	/** Slot attrs for each radio group slot */
	readonly slots: {
		readonly root: SlotAttrs;
		readonly label: SlotAttrs;
		readonly hiddenInput: SlotAttrs;
	};
	/** Create slot attrs for an individual radio item */
	item(value: string): SlotAttrs;
};
