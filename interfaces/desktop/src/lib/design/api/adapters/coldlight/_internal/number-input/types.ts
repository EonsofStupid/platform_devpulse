/**
 * @file builders/number-input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the NumberInput builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { MaybeGetter } from "../../builders/types.js";

export type NumberInputProps = {
	/**
	 * Numeric value.
	 *
	 * Pass a getter for controlled mode (`() => number`), or a static
	 * value for uncontrolled mode. When the user changes the value,
	 * `onValueChange` is called with the new clamped value.
	 *
	 * @default 0
	 */
	value?: MaybeGetter<number | undefined>;

	/**
	 * Called when the numeric value changes.
	 *
	 * Receives the new value after clamping to min/max bounds.
	 * Use this to update your controlled state variable.
	 */
	onValueChange?: (value: number) => void;

	/**
	 * Minimum allowed value.
	 *
	 * The value is clamped to this lower bound. When finite, pressing
	 * the Home key sets the value to this minimum. The decrement
	 * button is disabled when the value equals this minimum.
	 *
	 * @default -Infinity
	 */
	min?: MaybeGetter<number | undefined>;

	/**
	 * Maximum allowed value.
	 *
	 * The value is clamped to this upper bound. When finite, pressing
	 * the End key sets the value to this maximum. The increment
	 * button is disabled when the value equals this maximum.
	 *
	 * @default Infinity
	 */
	max?: MaybeGetter<number | undefined>;

	/**
	 * Step increment for ArrowUp/ArrowDown and increment/decrement buttons.
	 *
	 * Determines the amount by which the value changes on each
	 * increment or decrement action.
	 *
	 * @default 1
	 */
	step?: MaybeGetter<number | undefined>;

	/**
	 * Whether the number input is disabled.
	 *
	 * When disabled, the input and both buttons are non-interactive,
	 * `aria-disabled` is set to `true`, and keyboard handlers are
	 * suppressed.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the number input is read-only.
	 *
	 * When true, the native `readonly` attribute is set and
	 * `aria-readonly` is `true`. The input is focusable and
	 * keyboard-navigable but its value cannot be changed.
	 *
	 * @default false
	 */
	readonly?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the number input is required.
	 *
	 * When true, `aria-required` is set to `true` on the input element.
	 * Does not enforce validation — that is the consumer's responsibility.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * Human-readable text alternative for `aria-valuenow`.
	 *
	 * Applied as `aria-valuetext` on the input element. Useful for
	 * providing contextual descriptions (e.g., "50 percent", "Medium").
	 * When empty or undefined, the attribute is omitted.
	 *
	 * @default ""
	 */
	valueText?: MaybeGetter<string | undefined>;

	/**
	 * Accessible label for the group container.
	 *
	 * Applied as `aria-label` on the root `role="group"` element.
	 * Describes the purpose of the entire number input composite.
	 */
	"aria-label"?: string;

	/**
	 * ID of the element that describes the number input.
	 *
	 * Applied as `aria-describedby` on the input element. Use this
	 * for supplementary help text or instructions.
	 */
	"aria-describedby"?: string;
};
