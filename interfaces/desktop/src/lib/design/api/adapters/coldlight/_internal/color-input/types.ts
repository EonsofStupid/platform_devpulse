/**
 * @file builders/color-input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColorInput builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA: Native `<input type="color">` semantics within a
 * `role="group"` container.
 */

import type { MaybeGetter } from "../../builders/types.js";

export type ColorInputProps = {
	/**
	 * Color value as a hex string.
	 *
	 * Pass a getter for controlled mode (`() => string`), or a static
	 * value for uncontrolled mode. When the user picks a color,
	 * `onValueChange` is called with the new hex value.
	 *
	 * @default "#000000"
	 */
	value?: MaybeGetter<string | undefined>;

	/**
	 * Called when the color value changes.
	 *
	 * Receives the new hex string value when the user interacts
	 * with the native color picker.
	 */
	onValueChange?: (value: string) => void;

	/**
	 * Whether the color input is disabled.
	 *
	 * When disabled, the native `disabled` attribute is set and
	 * `aria-disabled` is `true`. The color picker cannot be opened.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the color input is required.
	 *
	 * When true, the native `required` attribute and `aria-required`
	 * are set. Does not enforce validation — that is the consumer's
	 * responsibility.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the color input is in an invalid state.
	 *
	 * When true, `aria-invalid` is set to `true` on the input element.
	 * Useful for form validation feedback when the selected color
	 * does not meet requirements.
	 *
	 * @default false
	 */
	invalid?: MaybeGetter<boolean | undefined>;

	/**
	 * Accessible label for the color input.
	 *
	 * Applied as `aria-label` on the `<input type="color">` element.
	 * Use this when no visible label element exists.
	 *
	 * @default "Choose color"
	 */
	"aria-label"?: string;

	/**
	 * ID of the element that labels the color input group.
	 *
	 * Applied as `aria-labelledby` on the root `role="group"` element.
	 * When not provided, defaults to the builder's own label element ID.
	 */
	"aria-labelledby"?: string;

	/**
	 * ID of the element that describes the color input.
	 *
	 * Applied as `aria-describedby` on the input element. Use this
	 * for supplementary help text or instructions.
	 */
	"aria-describedby"?: string;
};
