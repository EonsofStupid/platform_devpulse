/**
 * @file Progress Types
 * @kind progress
 */

import type { ProgressPrimitiveProps } from "$lib/design/behaviors/display/progress/index.js";

export type ProgressPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps extends ProgressPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: ProgressPreset;
	/** Size class. Default: "md" */
	size?: ProgressSize;
}
