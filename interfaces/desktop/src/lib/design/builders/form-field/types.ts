/**
 * @file builders/form-field/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the FormField builder.
 *
 * Compound wrapper linking label, control, description, and error elements.
 * Provides `aria-describedby`, `aria-invalid`, and `aria-required` linking
 * between elements automatically.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Constructor configuration for the FormField builder.
 *
 * Uses `MaybeGetter<T>` for reactive (controlled) or static (uncontrolled) values.
 */
export type FormFieldProps = {
	/**
	 * Whether the field is in an invalid state.
	 *
	 * When `true`, the control receives `aria-invalid="true"` and the
	 * error slot ID is appended to `aria-describedby`.
	 *
	 * @default false
	 */
	invalid?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the field is required.
	 *
	 * When `true`, the control receives `aria-required="true"` and
	 * `data-required` is applied to root, label, and control.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the field is disabled.
	 *
	 * When `true`, the control receives `aria-disabled` and
	 * `data-disabled` is applied to root, label, and control.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Error message text.
	 *
	 * Used for `aria-errormessage` association. When both `invalid` is `true`
	 * and this value is non-empty, the error element ID is included in
	 * `aria-describedby` on the control.
	 *
	 * @default undefined
	 */
	error?: MaybeGetter<string | undefined>;
};
