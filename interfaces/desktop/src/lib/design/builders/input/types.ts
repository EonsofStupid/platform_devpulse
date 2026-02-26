/**
 * @file builders/input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Input builder.
 * Native <input> element with implicit textbox role.
 */

import type { MaybeGetter } from "../_internal/types.js";

export type InputProps = {
	/** Input value. Getter = controlled, static = uncontrolled. @default "" */
	value?: MaybeGetter<string | undefined>;
	/** Called when value changes. */
	onValueChange?: (value: string) => void;
	/** Disable the input. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Mark input as read-only. @default false */
	readonly?: MaybeGetter<boolean | undefined>;
	/** Mark input as required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Mark input as invalid. @default false */
	invalid?: MaybeGetter<boolean | undefined>;
	/** Input type attribute (text, email, password, etc.). @default "text" */
	type?: MaybeGetter<string | undefined>;
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
