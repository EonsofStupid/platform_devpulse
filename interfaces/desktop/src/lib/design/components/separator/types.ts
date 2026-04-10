/**
 * @file Separator Types
 * @kind separator
 * @layer components
 */

import type { SeparatorPrimitiveProps } from "$lib/design/behaviors/display/separator/index.js";

export type { SeparatorOrientation } from "$lib/design/behaviors/display/separator/index.js";

export type SeparatorVariant = "solid" | "dashed" | "dotted";
export type SeparatorPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SeparatorProps extends SeparatorPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: SeparatorPreset;
	/** Line style variant */
	variant?: SeparatorVariant;
}
