/**
 * @file builders/switch/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Switch builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */

import type { MaybeGetter } from "../_internal/types.js";

export type SwitchProps = {
	/** Checked (on/off) state. Getter = controlled, static = uncontrolled. @default false */
	checked?: MaybeGetter<boolean | undefined>;
	/** Called when checked state changes. */
	onCheckedChange?: (checked: boolean) => void;
	/** Disable the switch. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Whether the switch is required. @default false */
	required?: MaybeGetter<boolean | undefined>;
	/** Accessible label. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
};
