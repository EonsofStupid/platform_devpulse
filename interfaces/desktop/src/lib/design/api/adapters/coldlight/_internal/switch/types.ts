/**
 * @file builders/switch/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Switch builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

export type SwitchProps = {
	/**
	 * Checked (on/off) state of the switch.
	 *
	 * Pass a getter for controlled mode (`() => boolean`), or a static
	 * value for uncontrolled mode. When the user interacts with the
	 * switch, `onCheckedChange` is called with the new value.
	 *
	 * @default false
	 */
	checked?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the checked state changes.
	 *
	 * Receives the new checked value (`true` for on, `false` for off).
	 * Use this to update your controlled state variable.
	 */
	onCheckedChange?: (checked: boolean) => void;

	/**
	 * Whether the switch is disabled.
	 *
	 * When disabled, the switch cannot be toggled via click or
	 * keyboard, and `aria-disabled` is set to `true`.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the switch is required.
	 *
	 * When true, `aria-required` is set to `true` on the root element.
	 * Does not enforce validation — that is the consumer's responsibility.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * Accessible label for the switch.
	 *
	 * Applied as `aria-label` on the root element. Use this when no
	 * visible label element exists.
	 */
	"aria-label"?: string;

	/**
	 * ID of the element that labels the switch.
	 *
	 * Applied as `aria-labelledby` on the root element. Prefer this
	 * over `aria-label` when a visible label exists.
	 */
	"aria-labelledby"?: string;

	/**
	 * ID of the element that describes the switch.
	 *
	 * Applied as `aria-describedby` on the root element. Use this
	 * for supplementary help text or instructions.
	 */
	"aria-describedby"?: string;
};
