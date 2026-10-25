/**
 * @file Card UI Types
 * @kind card
 * @layer ui
 *
 * Styled card — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/card/.
 */

import type { CardComponentProps } from "$lib/design/components/card/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { CardSize, CardVariant } from "$lib/design/components/card/types.js";

import type { CardVariant } from "$lib/design/components/card/types.js";

/** Variant -> preset mapping. Variant is syntactic sugar for named presets. */
export const CARD_VARIANT_PRESETS: Record<CardVariant, string> = {
	default: "card-default",
	outlined: "card-default",
	elevated: "card-elevated",
	ghost: "card-default",
	glow: "card-glow",
};

/** Card UI props — component (ARIA) + visual (ColdLight). */
export interface CardUIProps extends CardComponentProps, ColdLightProps {
	/** Visual variant — maps to named preset */
	variant?: CardVariant;
	/** Size variant — structural sizing via recipe */
	size?: "sm" | "md" | "lg";
}
