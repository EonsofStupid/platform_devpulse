/**
 * @file ColorSwatchPicker Component Types
 * @kind color-swatch-picker
 * @layer components
 *
 * Selectable grid of ColorSwatch components.
 * role="listbox" with role="option" on each swatch wrapper.
 * Keyboard arrow navigation, Enter/Space to select.
 *
 * No matching primitive — extends UIBaseProps.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";
import type { ColorValue } from "#coldlight/components/color-area/types.js";
import type {
	ColorSwatchRounding,
	ColorSwatchSize,
} from "#coldlight/components/color-swatch/types.js";

export interface ColorSwatchPickerChangeDetails {
	value: ColorValue;
}

export interface ColorSwatchPickerIds {
	root?: string;
}

export type ColorSwatchPickerDensity = "compact" | "regular" | "spacious";

export type ColorSwatchPickerPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface ColorSwatchPickerRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "class" | "dir">,
		UIBaseProps {
	ids?: Partial<ColorSwatchPickerIds>;
	/** Controlled selected color value. */
	value?: ColorValue;
	/** Initial value when uncontrolled. */
	defaultValue?: ColorValue;
	/** Callback when selection changes. */
	onChange?: (details: ColorSwatchPickerChangeDetails) => void;
	/** Swatch size passed to children. Default: "md". */
	size?: ColorSwatchSize;
	/** Swatch rounding passed to children. Default: "none". */
	rounding?: ColorSwatchRounding;
	/** Gap density. Default: "regular". */
	density?: ColorSwatchPickerDensity;
	/** Style preset. Default: "default". */
	preset?: ColorSwatchPickerPreset;
	/** Whether the picker is disabled. */
	isDisabled?: boolean;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** ColorSwatch children. */
	children?: Snippet;
}
