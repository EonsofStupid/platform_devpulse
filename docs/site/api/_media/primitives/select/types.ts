/**
 * @file primitives/select/types.ts
 * @kind select
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Select primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 * Complex compound widget with activedescendant focus management.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the select primitive */
export const selectSlots = ["trigger", "content", "option", "label"] as const;
export type SelectSlot = (typeof selectSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the select primitive */
export const selectStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];
export type SelectState = (typeof selectStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each select slot to its allowed state tokens */
export const selectSlotStates = {
	trigger: ["open", "focused", "focus-visible", "hover", "disabled"],
	content: ["open", "closed"],
	option: ["selected", "focused", "hover", "disabled"],
	label: ["disabled"],
} as const satisfies SlotStateMap<SelectSlot, SelectState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SelectTriggerProps — props for the select trigger button.
 *
 * Renders as a `<button>` with `role="combobox"` applied by the adapter layer.
 * Opens/closes the listbox.
 */
export interface SelectTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * SelectContentProps — props for the select listbox container.
 *
 * Renders as a `<div>` with `role="listbox"` applied by the adapter layer.
 */
export interface SelectContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * SelectOptionProps — props for an individual select option.
 *
 * Parameterized slot: each option is identified by its `value`.
 * Renders as a `<div>` with `role="option"` applied by the adapter layer.
 */
export interface SelectOptionProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	/** Unique value identifying this option */
	value: string;
	/** Display label for this option */
	label: string;
	children?: Snippet;
}

/**
 * SelectLabelProps — props for the select label.
 *
 * Renders as a `<span>` with no special ARIA role (native semantics).
 */
export interface SelectLabelProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
