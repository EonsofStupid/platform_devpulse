/**
 * @file Label Types
 * @kind label
 * @layer components
 */

import type { LabelPrimitiveProps } from "$lib/design/primitives/label/index.js";

export type LabelSize = "sm" | "md" | "lg";
export type LabelPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface LabelProps extends LabelPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: LabelPreset;
	/** Size class. Default: "md" */
	size?: LabelSize;
	/** Whether the associated field is required (shows * indicator) */
	required?: boolean;
}
