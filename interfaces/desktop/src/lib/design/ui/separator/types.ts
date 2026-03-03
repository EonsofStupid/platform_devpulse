/**
 * @file Separator UI Types
 * @kind separator
 * @layer ui
 *
 * Styled separator — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/separator/.
 */

import type { SeparatorComponentProps } from "$lib/design/components/separator/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type { SeparatorOrientation, SeparatorVariant } from "$lib/design/components/separator/types.js";

/** Separator UI props — component (ARIA) + visual (ColdLight). */
export interface SeparatorUIProps extends SeparatorComponentProps, ColdLightProps {
	/** Visual line style variant */
	variant?: "solid" | "dashed" | "dotted";
}
