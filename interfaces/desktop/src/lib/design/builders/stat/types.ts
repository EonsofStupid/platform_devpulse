/**
 * @file builders/stat/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Stat builder.
 * Display statistic with label, value, and help text.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Stat. */
export type StatProps = {
	/** Accessible label for the stat group. */
	label?: MaybeGetter<string | undefined>;
};
