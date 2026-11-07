/**
 * @file primitives/loading-overlay/types.ts
 * @kind loading-overlay
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * LoadingOverlay primitive — full-area loading indicator overlay.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const loadingOverlaySlots = ["root", "spinner", "label"] as const;
export type LoadingOverlaySlot = (typeof loadingOverlaySlots)[number];

export const loadingOverlayStateTokens = ["loading", "visible", "hidden"] as const satisfies readonly StateToken[];
export type LoadingOverlayState = (typeof loadingOverlayStateTokens)[number];

export const loadingOverlaySlotStates = {
	root: ["loading", "visible", "hidden"],
	spinner: [],
	label: [],
} as const satisfies SlotStateMap<LoadingOverlaySlot, LoadingOverlayState>;

export interface LoadingOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
