/**
 * @file builders/skip-link/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the SkipLink builder.
 * Accessibility skip-to-content link.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for SkipLink. */
export type SkipLinkProps = {
	/** Target element ID to skip to (e.g. "#main-content"). Getter = controlled, static = uncontrolled. */
	href?: MaybeGetter<string | undefined>;
	/** Visible label text. @default "Skip to main content" */
	label?: MaybeGetter<string | undefined>;
};
