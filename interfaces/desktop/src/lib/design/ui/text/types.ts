/**
 * @file Text UI Types
 * @kind text
 * @layer ui
 *
 * Styled text — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/text/.
 */

import type { TextComponentProps } from "$lib/design/components/text/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Re-export vocabulary types from component for consumer convenience. */
export type { TextSize, TextWeight, TextColor, TextAs } from "$lib/design/components/text/types.js";

/** Text UI props — component (ARIA) + visual (ColdLight). */
export interface TextUIProps extends TextComponentProps, Omit<ColdLightProps, "size"> {
	/** Font size variant */
	size?: import("$lib/design/components/text/types.js").TextSize;
	/** Font weight variant */
	weight?: import("$lib/design/components/text/types.js").TextWeight;
	/** Text color variant */
	color?: import("$lib/design/components/text/types.js").TextColor;
}
