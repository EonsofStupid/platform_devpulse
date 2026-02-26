/**
 * @file builders/number-input/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the NumberInput builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { MaybeGetter } from "../_internal/types.js";

export type NumberInputProps = {
	/** Numeric value. Getter = controlled, static = uncontrolled. @default 0 */
	value?: MaybeGetter<number | undefined>;
	/** Called when value changes. */
	onValueChange?: (value: number) => void;
	/** Minimum allowed value. @default -Infinity */
	min?: MaybeGetter<number | undefined>;
	/** Maximum allowed value. @default Infinity */
	max?: MaybeGetter<number | undefined>;
	/** Step increment. @default 1 */
	step?: MaybeGetter<number | undefined>;
	/** Disable the number input. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Mark input as read-only. @default false */
	readonly?: MaybeGetter<boolean | undefined>;
	/** Mark input as required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Human-readable text alternative for aria-valuenow. */
	valueText?: MaybeGetter<string | undefined>;
	/** Accessible label for the group. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
};
