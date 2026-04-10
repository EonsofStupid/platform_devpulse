/**
 * @file Popover Component Types
 * @kind popover
 * @layer components
 */

import type { Snippet } from "svelte";
import type { PopoverPrimitiveProps } from "$lib/design/behaviors/overlays/popover/index.js";

export type PopoverPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface PopoverProps extends PopoverPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: PopoverPreset;
	/** Trigger snippet rendered as a button */
	trigger?: Snippet;
	/** Content snippet rendered in the floating panel */
	content?: Snippet;
}
