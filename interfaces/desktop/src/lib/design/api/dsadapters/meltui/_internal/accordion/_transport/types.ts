/**
 * @file api/adapters/meltui/_internal/accordion/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI accordion adapter.
 * Maps melt v0.44 Accordion API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root (on Accordion), item/trigger/content (on AccordionItem)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { SvelteSet } from "svelte/reactivity";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface AccordionTransportStates {
	/** Currently expanded item IDs (string for single, SvelteSet<string> for multiple) */
	readonly value: string | SvelteSet<string> | undefined;
	/** Whether the accordion is disabled globally */
	readonly disabled: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface AccordionTransportConfig {
	/** Allow multiple items open. Pass a getter for controlled mode. */
	multiple?: boolean | (() => boolean | undefined);
	/** Whether the accordion is disabled. */
	disabled?: boolean | (() => boolean | undefined);
	/** Controlled value (expanded item ID or string[] for multiple). */
	value?: string | string[];
	/** Called when value changes. */
	onValueChange?: (value: string | string[]) => void;
}

// =============================================================================
// ACCORDION ITEM TRANSPORT
// =============================================================================

export interface AccordionItemTransport {
	/** Slot attributes per sub-component */
	readonly slots: {
		/** Heading wrapper attributes (role, aria-level) */
		readonly heading: SlotAttrs;
		/** Trigger button attributes (aria-expanded, aria-controls, onclick, onkeydown) */
		readonly trigger: SlotAttrs;
		/** Content panel attributes (data-state, data-value) */
		readonly content: SlotAttrs;
	};
	/** Reactive state for this item */
	readonly states: {
		/** Whether this item is currently expanded */
		readonly isExpanded: boolean;
		/** Whether this item is disabled */
		readonly isDisabled: boolean | undefined;
	};
	/** Expand this item */
	expand(): void;
	/** Collapse this item */
	collapse(): void;
	/** Toggle this item's expanded state */
	toggleExpanded(): void;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight accordion transport — the public contract for the melt accordion adapter.
 *
 * Slots (melt-managed): root (on accordion), heading/trigger/content (per item via getItem)
 * States: value, disabled
 */
export type AccordionTransport = TransportAdapter<
	"root",
	AccordionTransportStates
> & {
	readonly slots: {
		readonly root: SlotAttrs;
	};
	/** Get a sub-item transport for a specific accordion item */
	getItem(meta: { id: string; disabled?: boolean; headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 }): AccordionItemTransport;
	/** Check if a specific item is expanded */
	isExpanded(id: string): boolean;
};
