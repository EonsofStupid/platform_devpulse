/**
 * @file primitives/combobox/types.ts
 * @kind combobox
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Combobox primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 * Complex compound widget with activedescendant focus management.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the combobox primitive */
export const comboboxSlots = ["input", "trigger", "content", "option", "label"] as const;
export type ComboboxSlot = (typeof comboboxSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the combobox primitive */
export const comboboxStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];
export type ComboboxState = (typeof comboboxStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each combobox slot to its allowed state tokens */
export const comboboxSlotStates = {
	input: ["focused", "focus-visible", "disabled"],
	trigger: ["open", "focused", "hover"],
	content: ["open", "closed"],
	option: ["selected", "focused", "hover", "disabled"],
	label: ["disabled"],
} as const satisfies SlotStateMap<ComboboxSlot, ComboboxState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ComboboxInputProps — props for the combobox text input.
 *
 * Renders as an `<input>` with `role="combobox"` applied by the adapter layer.
 */
export interface ComboboxInputProps extends Omit<HTMLInputAttributes, "style" | "children">, BaseProps {}

/**
 * ComboboxTriggerProps — props for the combobox trigger button.
 *
 * Renders as a `<button>` with `role="button"` applied by the adapter layer.
 * Toggles the listbox open/closed.
 */
export interface ComboboxTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * ComboboxContentProps — props for the combobox listbox container.
 *
 * Renders as a `<div>` with `role="listbox"` applied by the adapter layer.
 */
export interface ComboboxContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * ComboboxOptionProps — props for an individual combobox option.
 *
 * Parameterized slot: each option is identified by its `value`.
 * Renders as a `<div>` with `role="option"` applied by the adapter layer.
 */
export interface ComboboxOptionProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	/** Unique value identifying this option */
	value: string;
	/** Display label for this option */
	label: string;
	children?: Snippet;
}

/**
 * ComboboxLabelProps — props for the combobox label.
 *
 * Renders as a `<label>` with no special ARIA role (native semantics).
 */
export interface ComboboxLabelProps extends Omit<HTMLLabelAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
