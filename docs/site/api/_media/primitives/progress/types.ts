/**
 * @file primitives/progress/types.ts
 * @kind progress
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Progress primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the progress primitive */
export const progressSlots = ["root", "indicator"] as const;
export type ProgressSlot = (typeof progressSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the progress primitive */
export const progressStateTokens = [
	"loading",
	"pending",
] as const satisfies readonly StateToken[];
export type ProgressState = (typeof progressStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each progress slot to its allowed state tokens */
export const progressSlotStates = {
	root: [],
	indicator: [],
} as const satisfies SlotStateMap<ProgressSlot, ProgressState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ProgressRootProps — props for the progress root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ProgressRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	/** Current progress value */
	value: number;
	/** Maximum progress value */
	max: number;
}

/**
 * ProgressIndicatorProps — props for the progress indicator (bar) slot.
 */
export interface ProgressIndicatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {}
