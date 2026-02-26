/**
 * @file builders/checkbox/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Checkbox builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */

import type { MaybeGetter } from "../_internal/types.js";

export type CheckboxProps = {
	/**
	 * Checked state of the checkbox.
	 *
	 * Pass a getter for controlled mode (`() => boolean`), or a static
	 * value for uncontrolled mode. When the user interacts with the
	 * checkbox, `onCheckedChange` is called with the new value.
	 *
	 * @default false
	 */
	checked?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the checked state changes.
	 *
	 * Receives the new checked value. Use this to update your controlled
	 * state variable.
	 */
	onCheckedChange?: (checked: boolean) => void;

	/**
	 * Indeterminate (mixed) state of the checkbox.
	 *
	 * When true, the checkbox displays a mixed indicator and
	 * `aria-checked` is set to `"mixed"`. Toggling the checkbox
	 * will clear the indeterminate state.
	 *
	 * @default false
	 */
	indeterminate?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the indeterminate state changes.
	 *
	 * Receives the new indeterminate value. Fired when the checkbox
	 * is toggled out of the indeterminate state.
	 */
	onIndeterminateChange?: (indeterminate: boolean) => void;

	/**
	 * Whether the checkbox is disabled.
	 *
	 * When disabled, the checkbox cannot be toggled via click or
	 * keyboard, and `aria-disabled` is set to `true`.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the checkbox is required.
	 *
	 * When true, `aria-required` is set to `true` on the root element.
	 * Does not enforce validation — that is the consumer's responsibility.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * Accessible label for the checkbox.
	 *
	 * Applied as `aria-label` on the root element. Use this when no
	 * visible label element exists.
	 */
	"aria-label"?: string;

	/**
	 * ID of the element that labels the checkbox.
	 *
	 * Applied as `aria-labelledby` on the root element. Prefer this
	 * over `aria-label` when a visible label exists.
	 */
	"aria-labelledby"?: string;

	/**
	 * ID of the element that describes the checkbox.
	 *
	 * Applied as `aria-describedby` on the root element. Use this
	 * for supplementary help text or instructions.
	 */
	"aria-describedby"?: string;
};
