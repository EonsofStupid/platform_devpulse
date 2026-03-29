/**
 * @file Checkbox Types
 * @kind checkbox
 * @layer components
 */

import type { CheckboxPrimitiveProps } from "$lib/design/primitives/checkbox/index.js";

export type CheckboxPreset = "default";
export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends CheckboxPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: CheckboxPreset;
	/** Size class. Default: "md" */
	size?: CheckboxSize;
}
