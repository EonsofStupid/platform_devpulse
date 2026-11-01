/**
 * @file primitives/tabs/types.ts
 * @kind tabs
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tabs primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 * Complex compound widget with roving tabindex focus management.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the tabs primitive */
export const tabsSlots = ["triggerList", "trigger", "content"] as const;
export type TabsSlot = (typeof tabsSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the tabs primitive */
export const tabsStateTokens = [
	"selected",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type TabsState = (typeof tabsStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each tabs slot to its allowed state tokens */
export const tabsSlotStates = {
	triggerList: [],
	trigger: ["selected", "focused", "focus-visible", "hover", "disabled"],
	content: ["selected"],
} as const satisfies SlotStateMap<TabsSlot, TabsState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * TabsTriggerListProps — props for the tab list container.
 *
 * Renders as a `<div>` with `role="tablist"` applied by the adapter layer.
 */
export interface TabsTriggerListProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * TabsTriggerProps — props for an individual tab trigger.
 *
 * Parameterized slot: each trigger is identified by its `value`.
 * Renders as a `<button>` with `role="tab"` applied by the adapter layer.
 */
export interface TabsTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	/** Unique value identifying this tab */
	value: string;
	children?: Snippet;
}

/**
 * TabsContentProps — props for a tab panel.
 *
 * Parameterized slot: each content panel corresponds to a trigger `value`.
 * Renders as a `<div>` with `role="tabpanel"` applied by the adapter layer.
 */
export interface TabsContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	/** Value matching the corresponding trigger */
	value: string;
	children?: Snippet;
}
