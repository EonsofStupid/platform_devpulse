/**
 * @file api/adapters/meltui/_internal/accordion/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI accordion adapter.
 * Maps melt v0.44 Accordion API → ColdLight slot vocabulary.
 *
 * The accordion is a compound component: root + N items.
 * Each item has its own sub-transport with heading, trigger, content slots.
 *
 * Slots (root): root
 * Slots (per-item): heading, trigger, content
 * States (root): value, disabled, multiple
 * States (per-item): isExpanded, isDisabled
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// ITEM META — passed to getItem() to create per-item transports
// =============================================================================

export interface AccordionItemMeta<Meta extends Record<string, unknown> = Record<never, never>> {
	/** Unique identifier for the accordion item. */
	id: string;
	/** Disables this specific accordion item. */
	disabled?: boolean;
	/** Heading level (1–6) for the item header. */
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

// =============================================================================
// ITEM TRANSPORT — per-item slots + states + actions
// =============================================================================

export interface AccordionItemTransportStates {
	/** Whether this item is currently expanded */
	readonly isExpanded: boolean;
	/** Whether this item is disabled */
	readonly isDisabled: boolean | undefined;
}

export interface AccordionItemTransport {
	/** Per-item slot attributes */
	readonly slots: {
		readonly heading: SlotAttrs;
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
	};
	/** Per-item reactive states */
	readonly states: AccordionItemTransportStates;
	/** Expand this item */
	expand(): void;
	/** Collapse this item */
	collapse(): void;
	/** Toggle this item's expanded state */
	toggleExpanded(): void;
}

// =============================================================================
// TRANSPORT STATES (root-level)
// =============================================================================

export interface AccordionTransportStates {
	/** Currently expanded item value(s) */
	value: string | string[];
	/** Whether the entire accordion is disabled */
	readonly disabled: boolean;
	/** Whether multiple items can be expanded simultaneously */
	readonly multiple: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface AccordionTransportConfig<Multiple extends boolean = false> {
	/** Allow multiple items to be expanded at once. @default false */
	multiple?: Multiple;
	/** Disable the entire accordion. @default false */
	disabled?: boolean;
	/** Initial/controlled expanded value. String for single, string[] for multiple. */
	value?: Multiple extends true ? string[] : string;
	/** Called when the expanded value changes. */
	onValueChange?: (value: Multiple extends true ? string[] : string) => void;
}

// =============================================================================
// TRANSPORT ADAPTER (root-level)
// =============================================================================

/**
 * ColdLight accordion transport — compound component transport.
 *
 * Root: slots.root, states (value, disabled, multiple)
 * Items: getItem(meta) returns AccordionItemTransport with heading/trigger/content slots
 */
export type AccordionTransport = TransportAdapter<"root", AccordionTransportStates> & {
	/** Create a per-item transport for the given item metadata */
	getItem<Meta extends Record<string, unknown> = Record<never, never>>(
		meta: AccordionItemMeta<Meta>,
	): AccordionItemTransport;
	/** Check if a specific item is expanded */
	isExpanded(id: string): boolean;
	/** Expand a specific item */
	expand(id: string): void;
	/** Collapse a specific item */
	collapse(id: string): void;
	/** Toggle a specific item's expanded state */
	toggleExpanded(id: string): void;
};
