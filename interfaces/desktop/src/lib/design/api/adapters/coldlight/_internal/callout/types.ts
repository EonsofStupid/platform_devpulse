/**
 * @file builders/callout/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Callout builder.
 *
 * Contract: `role="note"` -- informational callout.
 * Supports semantic variants for tone differentiation.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/** Semantic variant for the callout tone. */
export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

/** Constructor config for the {@link Callout} builder. */
export type CalloutProps = {
	/**
	 * Semantic variant controlling the callout's visual tone.
	 *
	 * @default "info"
	 */
	variant?: MaybeGetter<CalloutVariant | undefined>;

	/**
	 * Accessible label for the callout region.
	 *
	 * Applied as `aria-label` on the root element.
	 *
	 * @default undefined
	 */
	"aria-label"?: MaybeGetter<string | undefined>;
};
