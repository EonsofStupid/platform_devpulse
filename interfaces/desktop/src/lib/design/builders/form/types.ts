/**
 * @file builders/form/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Form builder.
 * Native <form> element with submit/reset handling and aria-label.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Form. MaybeGetter for controlled/uncontrolled. */
export type FormProps = {
	/** Accessible label for the form. */
	label?: MaybeGetter<string | undefined>;
	/** Disable the entire form. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Whether the form is in a pending/submitting state. @default false */
	pending?: MaybeGetter<boolean | undefined>;
	/** Called on form submit. Receives the native SubmitEvent. */
	onSubmit?: (e: SubmitEvent) => void;
	/** Called on form reset. */
	onReset?: () => void;
};
