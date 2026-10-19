/**
 * @file Sheet Component Types
 * @kind sheet
 * @layer components
 */

import type { Snippet } from "svelte";
import type { SheetPrimitiveProps } from "#coldlight/behaviors/overlays/sheet/index.js";

export type { SheetSide } from "#coldlight/behaviors/overlays/sheet/index.js";

export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";
export type SheetPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SheetComponentProps extends SheetPrimitiveProps {
	/** Trigger snippet rendered as a button that opens the sheet */
	trigger?: Snippet;
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: SheetPreset;
	/** Sheet width/height. Default: "md" */
	size?: SheetSize;
	/** Accessible label for the sheet */
	label?: string;
}
