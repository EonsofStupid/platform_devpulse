/**
 * @file builders/checkbox/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Checkbox builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */

import type { MaybeGetter } from "../_internal/types.js";

export type CheckboxProps = {
	/** Checked state. Getter = controlled, static = uncontrolled. @default false */
	checked?: MaybeGetter<boolean | undefined>;
	/** Called when checked state changes. */
	onCheckedChange?: (checked: boolean) => void;
	/** Indeterminate (mixed) state. @default false */
	indeterminate?: MaybeGetter<boolean | undefined>;
	/** Called when indeterminate state changes. */
	onIndeterminateChange?: (indeterminate: boolean) => void;
	/** Disable the checkbox. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Whether the checkbox is required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Accessible label. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
};
