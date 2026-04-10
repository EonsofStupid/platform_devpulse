/**
 * @file Heading Types
 * @kind heading
 */

import type { HeadingPrimitiveProps } from "$lib/design/behaviors/display/heading/index.js";

export type { HeadingLevel } from "$lib/design/behaviors/display/heading/index.js";

export type HeadingPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface HeadingProps extends HeadingPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: HeadingPreset;
	/** Size class — independent from heading level. Default: "lg" */
	size?: HeadingSize;
}
