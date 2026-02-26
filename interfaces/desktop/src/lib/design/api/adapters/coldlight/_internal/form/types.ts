/**
 * @file builders/form/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Form builder.
 *
 * Native `<form>` element wrapper with submit/reset handling,
 * `aria-label`, disabled state, and pending/submitting tracking.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/**
 * Constructor configuration for the Form builder.
 *
 * Uses `MaybeGetter<T>` for reactive (controlled) or static (uncontrolled) values.
 */
export type FormProps = {
	/**
	 * Accessible label for the form.
	 *
	 * Maps to `aria-label` on the root `<form>` element. Recommended when
	 * the form purpose is not obvious from a visible heading.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Disable the entire form.
	 *
	 * When `true`, submit and reset events are suppressed, and
	 * `data-disabled` is applied to the root element.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the form is in a pending/submitting state.
	 *
	 * When `true`, the root receives `aria-busy="true"` and
	 * `data-state="pending"`. Submit events are prevented while pending.
	 *
	 * @default false
	 */
	pending?: MaybeGetter<boolean | undefined>;

	/**
	 * Called on form submit.
	 *
	 * Receives the native `SubmitEvent`. The handler is NOT called when
	 * the form is disabled or pending.
	 */
	onSubmit?: (e: SubmitEvent) => void;

	/**
	 * Called on form reset.
	 *
	 * The handler is NOT called when the form is disabled.
	 */
	onReset?: () => void;
};
