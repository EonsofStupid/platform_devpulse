/**
 * @file builders/aspect-ratio/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight AspectRatio builder.
 * Mirrors primitives/aspect-ratio/contract.ts — role: "none", zero ARIA.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for AspectRatio builder. */
export type AspectRatioProps = {
	/** Aspect ratio value (width / height). @default 1 */
	ratio?: MaybeGetter<number | undefined>;
};
