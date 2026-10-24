/**
 * @file ColorSwatch Component Types
 * @kind color-swatch
 * @layer components
 *
 * Presentational colored square. Displays a color value.
 * Single element — no compound, no interaction.
 * role="img" with auto-generated or custom accessible name.
 *
 * No matching primitive — extends UIBaseProps.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";
import type { ColorValue } from "#coldlight/components/color-area/types.js";

export type ColorSwatchSize = "xs" | "sm" | "md" | "lg";
export type ColorSwatchRounding = "default" | "none" | "full";

export type ColorSwatchPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface ColorSwatchProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "class" | "dir" | "role">,
		UIBaseProps {
	/** Element ID. */
	id?: string;
	/** The color value to display. */
	color: ColorValue;
	/** Accessible name override (e.g., "Pantone 2728C"). Auto-generated from color if omitted. */
	colorName?: string;
	/** Swatch size. Default: "md". */
	size?: ColorSwatchSize;
	/** Corner rounding. Default: "default". */
	rounding?: ColorSwatchRounding;
	/** Style preset. Default: "default". */
	preset?: ColorSwatchPreset;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Optional children rendered inside the swatch. */
	children?: Snippet;
}
