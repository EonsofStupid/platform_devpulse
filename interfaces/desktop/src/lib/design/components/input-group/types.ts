/**
 * @file Input Group Component Types
 * @kind input-group
 * @layer components
 *
 * Extends InputGroupPrimitiveProps with visual preset, size, and addon slots.
 */

import type { Snippet } from "svelte";
import type { InputGroupPrimitiveProps } from "$lib/design/behaviors/inputs/input-group/index.js";

export type InputGroupSize = "sm" | "md" | "lg";
export type InputGroupPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** InputGroup component props — extends primitive with preset + size + addon slots */
export interface InputGroupComponentProps extends Omit<InputGroupPrimitiveProps, "prefix"> {
	/** Style preset */
	preset?: InputGroupPreset;
	/** Prefix addon content */
	prefix?: Snippet;
	/** Suffix addon content */
	suffix?: Snippet;
	/** Size variant */
	size?: InputGroupSize;
}
