/**
 * @file api/adapters/meltui/_internal/tabs/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI tabs adapter.
 * Maps melt v0.44 Tabs API → ColdLight slot vocabulary.
 *
 * CRITICAL: getTrigger(value) and getContent(value) are PARAMETERIZED.
 * They are functions that take a tab value and return SlotAttrs.
 * The component uses $derived(transport.slots.getTrigger(value)).
 *
 * Slot mapping:
 *   melt tabs.triggerList        → slots.list
 *   melt tabs.getTrigger(value)  → slots.getTrigger(value)  ← FUNCTION
 *   melt tabs.getContent(value)  → slots.getContent(value)  ← FUNCTION
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface TabsTransportStates<T extends string = string> {
	/** The currently active tab value */
	value: T;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface TabsTransportConfig<T extends string = string> {
	/** The active tab value. Required. Pass a getter for controlled mode. */
	value: T | (() => T);
	/** Called when the active tab changes. */
	onValueChange?: (value: T) => void;
	/** Whether selecting a trigger on focus (vs only on click). @default true */
	selectWhenFocused?: boolean | (() => boolean);
	/** Whether arrow navigation loops. @default true */
	loop?: boolean | (() => boolean);
	/** Orientation for arrow key navigation. @default "horizontal" */
	orientation?: "horizontal" | "vertical" | (() => "horizontal" | "vertical");
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight tabs transport — the public contract for the melt tabs adapter.
 *
 * Slots:
 *   list            — spread on the tablist container element
 *   getTrigger(v)   — FUNCTION: call per tab to get trigger attrs
 *   getContent(v)   — FUNCTION: call per tab to get content panel attrs
 *
 * States:
 *   value — currently active tab string
 *
 * Usage:
 * ```svelte
 * const transport = createTabsTransport({ value: "tab1" });
 *
 * <div {...transport.slots.list}>
 *   <button {...transport.slots.getTrigger("tab1")}>Tab 1</button>
 *   <button {...transport.slots.getTrigger("tab2")}>Tab 2</button>
 * </div>
 * <div {...transport.slots.getContent("tab1")}>Content 1</div>
 * <div {...transport.slots.getContent("tab2")}>Content 2</div>
 * ```
 */
export interface TabsTransport<T extends string = string> {
	readonly slots: {
		/** Attrs for the tablist container — spread on the list wrapper element */
		readonly list: SlotAttrs;
		/**
		 * Returns attrs for a tab trigger. Call once per tab value.
		 * Use $derived in Svelte: `$derived(transport.slots.getTrigger(value))`
		 */
		getTrigger: (value: T) => SlotAttrs;
		/**
		 * Returns attrs for a tab content panel. Call once per tab value.
		 * Use $derived in Svelte: `$derived(transport.slots.getContent(value))`
		 */
		getContent: (value: T) => SlotAttrs;
	};
	readonly states: TabsTransportStates<T>;
}
