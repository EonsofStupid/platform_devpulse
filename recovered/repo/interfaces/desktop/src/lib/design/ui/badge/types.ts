/**
 * @file Badge UI Types
 * @kind badge
 * @layer ui
 *
 * Styled badge — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/badge/.
 */

import type { BadgeComponentProps } from "$lib/design/components/badge/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { BadgeIntent, BadgeSize } from "$lib/design/components/badge/types.js";

import type { BadgeIntent } from "$lib/design/components/badge/types.js";

/** Intent -> preset mapping. Intent is syntactic sugar for named presets. */
export const BADGE_INTENT_PRESETS: Record<BadgeIntent, string> = {
	default: "badge-ghost",
	info: "badge-signal",
	success: "badge-accent",
	warning: "badge-signal",
	error: "badge-signal",
};

/** Badge UI props — component (ARIA) + visual (ColdLight). */
export interface BadgeUIProps extends BadgeComponentProps, ColdLightProps {
	/** Visual intent — drives color + surface via preset */
	intent?: BadgeIntent;
	/** Size variant — structural sizing via recipe */
	size?: "sm" | "md" | "lg";
}
