/**
 * @file Toggle Types
 * @kind toggle
 * @layer components
 */

import type { TogglePrimitiveProps } from "$lib/design/primitives/toggle/index.js";

export type ToggleSize = "sm" | "md" | "lg";
export type TogglePreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface ToggleProps extends TogglePrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: TogglePreset;
	/** Size class. Default: "md" */
	size?: ToggleSize;
}
