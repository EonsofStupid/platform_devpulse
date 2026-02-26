/**
 * @file builders/textarea/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Textarea builder.
 * Native <textarea> element with implicit textbox role + aria-multiline.
 */

import type { MaybeGetter } from "../_internal/types.js";

export type TextareaProps = {
	/** Textarea value. Getter = controlled, static = uncontrolled. @default "" */
	value?: MaybeGetter<string | undefined>;
	/** Called when value changes. */
	onValueChange?: (value: string) => void;
	/** Disable the textarea. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Mark textarea as read-only. @default false */
	readonly?: MaybeGetter<boolean | undefined>;
	/** Mark textarea as required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Mark textarea as invalid. @default false */
	invalid?: MaybeGetter<boolean | undefined>;
	/** Number of visible text rows. */
	rows?: MaybeGetter<number | undefined>;
	/** Placeholder text. */
	placeholder?: string;
	/** Accessible label. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
	/** ID of the error message element. */
	"aria-errormessage"?: string;
};
