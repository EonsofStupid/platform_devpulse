/**
 * @file ColorSwatch Component Types
 * @kind color-swatch
 * @layer components
 *
 * Presentational colored square. Displays a color value.
 * Single element — no compound, no interaction.
 * role="img" with auto-generated or custom accessible name.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";
import type { ColorValue } from "$lib/design/components/color-area/types.js";

export type ColorSwatchSize = "xs" | "sm" | "md" | "lg";
export type ColorSwatchRounding = "default" | "none" | "full";

export interface ColorSwatchProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir" | "role">,
		Omit<PreparedComponentProps, "size" | "children"> {
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
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Optional children rendered inside the swatch. */
	children?: Snippet;
}
