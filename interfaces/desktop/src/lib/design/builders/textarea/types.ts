/**
 * @file builders/textarea/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Textarea builder.
 *
 * All state props accept `MaybeGetter<T>` — pass a static value for
 * uncontrolled mode or a getter function `() => T` for controlled
 * (reactive) mode.
 *
 * WAI-ARIA: Native `<textarea>` element provides implicit textbox role
 * with `aria-multiline="true"`.
 */

import type { MaybeGetter } from "../_internal/types.js";

export type TextareaProps = {
	/**
	 * Textarea value.
	 *
	 * Pass a getter for controlled mode (`() => string`), or a static
	 * value for uncontrolled mode. When the user types, `onValueChange`
	 * is called with the new value.
	 *
	 * @default ""
	 */
	value?: MaybeGetter<string | undefined>;

	/**
	 * Called when the textarea value changes.
	 *
	 * Receives the new string value on every input event.
	 * Use this to update your controlled state variable.
	 */
	onValueChange?: (value: string) => void;

	/**
	 * Whether the textarea is disabled.
	 *
	 * When disabled, the native `disabled` attribute is set and
	 * `aria-disabled` is `true`. The textarea cannot receive focus
	 * or user input.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the textarea is read-only.
	 *
	 * When true, the native `readonly` attribute is set and
	 * `aria-readonly` is `true`. The textarea is focusable but
	 * its value cannot be changed by the user.
	 *
	 * @default false
	 */
	readonly?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the textarea is required.
	 *
	 * When true, the native `required` attribute and `aria-required`
	 * are set. Does not enforce validation — that is the consumer's
	 * responsibility.
	 *
	 * @default false
	 */
	required?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the textarea is in an invalid state.
	 *
	 * When true, `aria-invalid` is set to `true` and
	 * `aria-errormessage` is linked (if provided). Useful for
	 * form validation feedback.
	 *
	 * @default false
	 */
	invalid?: MaybeGetter<boolean | undefined>;

	/**
	 * Number of visible text rows.
	 *
	 * Controls the native `rows` attribute on the `<textarea>`.
	 * Determines the initial visible height of the textarea.
	 *
	 * @default 3
	 */
	rows?: MaybeGetter<number | undefined>;

	/**
	 * Placeholder text displayed when the textarea is empty.
	 *
	 * Applied as the native `placeholder` attribute on the `<textarea>`.
	 */
	placeholder?: string;

	/**
	 * Accessible label for the textarea.
	 *
	 * Applied as `aria-label` on the root element. Use this when no
	 * visible label element exists.
	 */
	"aria-label"?: string;

	/**
	 * ID of the element that labels the textarea.
	 *
	 * Applied as `aria-labelledby` on the root element. Prefer this
	 * over `aria-label` when a visible label exists.
	 */
	"aria-labelledby"?: string;

	/**
	 * ID of the element that describes the textarea.
	 *
	 * Applied as `aria-describedby` on the root element. Use this
	 * for supplementary help text or instructions.
	 */
	"aria-describedby"?: string;

	/**
	 * ID of the element that contains the error message.
	 *
	 * Applied as `aria-errormessage` on the root element when the
	 * textarea is in an invalid state (`invalid: true`). Otherwise
	 * the attribute is omitted.
	 */
	"aria-errormessage"?: string;
};
