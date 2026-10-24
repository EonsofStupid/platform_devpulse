/**
 * @file Kbd Types
 * @kind kbd
 * @layer components
 */

import type { KbdPrimitiveProps } from "#coldlight/behaviors/display/kbd/index.js";

export type KbdSize = "sm" | "md" | "lg";
export type KbdPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface KbdProps extends KbdPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: KbdPreset;
	/** Size class. Default: "md" */
	size?: KbdSize;
}
