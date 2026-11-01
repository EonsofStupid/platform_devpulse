/**
 * @file primitives/sidebar/types.ts
 * @kind sidebar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sidebar primitive — Side navigation panel with header/content/footer.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the sidebar primitive */
export const sidebarSlots = ["root", "header", "content", "footer"] as const;
export type SidebarSlot = (typeof sidebarSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the sidebar primitive */
export const sidebarStateTokens = [
	"expanded",
	"collapsed",
] as const satisfies readonly StateToken[];
export type SidebarState = (typeof sidebarStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each sidebar slot to its allowed state tokens */
export const sidebarSlotStates = {
	root: ["expanded", "collapsed"],
	header: [],
	content: [],
	footer: [],
} as const satisfies SlotStateMap<SidebarSlot, SidebarState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SidebarProps — props for the sidebar primitive root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
