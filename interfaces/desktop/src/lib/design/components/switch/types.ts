/**
 * @file Switch Types
 * @kind switch
 * @layer components
 */

import type { SwitchPrimitiveProps } from "$lib/design/primitives/switch/index.js";

export type SwitchSize = "sm" | "md" | "lg";
export type SwitchPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SwitchProps extends SwitchPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: SwitchPreset;
	/** Size class. Default: "md" */
	size?: SwitchSize;
}
