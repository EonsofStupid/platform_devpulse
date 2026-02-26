/**
 * @file builders/form-field/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the FormField builder.
 * Compound wrapper: label + control + description + error.
 * Provides aria-describedby, aria-invalid, aria-required linking.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for FormField. MaybeGetter for controlled/uncontrolled. */
export type FormFieldProps = {
	/** Whether the field is invalid. @default false */
	invalid?: MaybeGetter<boolean | undefined>;
	/** Whether the field is required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Whether the field is disabled. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Error message text (for aria-errormessage association). */
	error?: MaybeGetter<string | undefined>;
};
