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
	/** Whether the badge is purely decorative (aria-hidden). @default true */
	decorative?: MaybeGetter<boolean | undefined>;
	/** Accessible label when informational (non-decorative). */
	label?: MaybeGetter<string | undefined>;
	/** Visual variant. @default "default" */
	variant?: MaybeGetter<BadgeVariant | undefined>;
};
