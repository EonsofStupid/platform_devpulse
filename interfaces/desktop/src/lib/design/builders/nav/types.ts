/**
 * @file builders/nav/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Nav builder.
 * WAI-ARIA: navigation landmark.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Nav. */
export type NavProps = {
	/** Accessible label for the navigation landmark. Getter = controlled, static = uncontrolled. */
	label?: MaybeGetter<string | undefined>;
};
