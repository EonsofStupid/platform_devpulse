/**
 * @file builders/label/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Label builder.
 * Native `<label>` element with `for` attribute association.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Constructor config for Label. MaybeGetter for controlled/uncontrolled. */
export type LabelProps = {
	/**
	 * ID of the associated form control.
	 * Sets the `for` attribute on the `<label>` element.
	 *
	 * @default undefined
	 */
	htmlFor?: MaybeGetter<string | undefined>;

	/**
	 * Whether the associated control is disabled.
	 * When `true`, `data-disabled` is present on the root element for styling hooks.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
};
