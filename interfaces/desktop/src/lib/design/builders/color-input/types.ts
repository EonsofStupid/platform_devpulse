/**
 * @file builders/color-input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColorInput builder.
 * Color picker input with swatch preview using native <input type="color">.
 */

import type { MaybeGetter } from "../_internal/types.js";

export type ColorInputProps = {
	/** Color value (hex string). Getter = controlled, static = uncontrolled. @default "#000000" */
	value?: MaybeGetter<string | undefined>;
	/** Called when color value changes. */
	onValueChange?: (value: string) => void;
	/** Disable the color input. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Mark input as required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Mark input as invalid. @default false */
	invalid?: MaybeGetter<boolean | undefined>;
	/** Accessible label for the color input. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
};
