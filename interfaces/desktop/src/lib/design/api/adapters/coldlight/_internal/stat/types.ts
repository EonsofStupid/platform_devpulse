/**
 * @file builders/stat/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Stat builder.
 *
 * Display statistic with label, value, and optional help text.
 * Contract: `role="group"` with `aria-label` or `aria-labelledby`.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Constructor config for the {@link Stat} builder. */
export type StatProps = {
	/**
	 * Accessible label for the stat group.
	 *
	 * When provided, applied as `aria-label` on root.
	 * When empty/absent, the root uses `aria-labelledby` pointing
	 * to the label slot element instead.
	 *
	 * @default ""
	 */
	label?: MaybeGetter<string | undefined>;
};
