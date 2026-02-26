/**
 * @file builders/badge/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Badge builder.
 * Status/label indicator -- decorative or informational.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Badge variant for semantic styling. */
export type BadgeVariant = "default" | "info" | "success" | "warning" | "error";

/** Constructor config for Badge. */
export type BadgeProps = {
	/**
	 * Whether the badge is purely decorative (`aria-hidden`).
	 * When `true`, the badge is hidden from assistive technology.
	 * When `false`, `role="status"` is applied and `label` is used as `aria-label`.
	 *
	 * @default true
	 */
	decorative?: MaybeGetter<boolean | undefined>;

	/**
	 * Accessible label when informational (non-decorative).
	 * Applied as `aria-label` on the root element when `decorative` is `false`.
	 *
	 * @default ""
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Visual variant controlling the badge appearance.
	 *
	 * @default "default"
	 */
	variant?: MaybeGetter<BadgeVariant | undefined>;
};
