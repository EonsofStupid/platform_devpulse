/**
 * @file builders/toolbar/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Toolbar builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { MaybeGetter, Orientation } from "../_internal/types.js";

/** Constructor config for Toolbar. MaybeGetter for controlled/uncontrolled. */
export type ToolbarProps = {
	/** Accessible label for the toolbar. */
	label?: MaybeGetter<string | undefined>;
	/** Orientation for arrow key navigation. @default "horizontal" */
	orientation?: MaybeGetter<Orientation | undefined>;
	/** Disable the entire toolbar. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Whether arrow keys loop. @default true */
	loop?: MaybeGetter<boolean | undefined>;
};
