/**
 * @file builders/callout/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Callout builder.
 * Contract: role="note" — informational callout.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Semantic variant for the callout tone. */
export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

/** Constructor config for Callout builder. */
export type CalloutProps = {
	/** Semantic variant. @default "info" */
	variant?: MaybeGetter<CalloutVariant | undefined>;
	/** Accessible label for the callout region. */
	"aria-label"?: MaybeGetter<string | undefined>;
};
