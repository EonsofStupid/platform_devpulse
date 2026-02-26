/**
 * @file builders/label/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Label builder.
 * Native <label> element with for= attribute association.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Label. MaybeGetter for controlled/uncontrolled. */
export type LabelProps = {
	/** ID of the associated form control (sets the `for` attribute). */
	htmlFor?: MaybeGetter<string | undefined>;
	/** Whether the associated control is disabled. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
};
