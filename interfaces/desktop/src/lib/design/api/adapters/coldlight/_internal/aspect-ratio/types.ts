/**
 * @file builders/aspect-ratio/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight AspectRatio builder.
 *
 * Contract: primitives/aspect-ratio/contract.ts
 * - role: "none" -- transparent layout wrapper.
 * - No ARIA attributes, no keyboard, no focus strategy.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Constructor config for the {@link AspectRatio} builder. */
export type AspectRatioProps = {
	/**
	 * Aspect ratio value (width / height).
	 *
	 * Pass a getter for controlled (reactive) mode or a static value
	 * for uncontrolled mode.
	 *
	 * @default 1
	 */
	ratio?: MaybeGetter<number | undefined>;
};
