/**
 * @file Stat UI Types
 * @kind stat
 * @layer ui
 *
 * Styled stat — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/stat/.
 */

import type { StatComponentProps } from "$lib/design/components/stat/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { StatSize } from "$lib/design/components/stat/types.js";

/** Stat UI props — component (ARIA) + visual (ColdLight). */
export interface StatUIProps extends StatComponentProps, ColdLightProps {
	/** Size variant — controls text sizing and spacing via recipe */
	size?: "sm" | "md" | "lg";
}
