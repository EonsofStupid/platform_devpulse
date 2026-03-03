/**
 * @file Heading UI Types
 * @kind heading
 * @layer ui
 *
 * Styled heading — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/heading/.
 */

import type { HeadingComponentProps } from "$lib/design/components/heading/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Re-export vocabulary types from component for consumer convenience. */
export type { HeadingLevel, HeadingSize } from "$lib/design/components/heading/types.js";

/** Heading UI props — component (ARIA) + visual (ColdLight). */
export interface HeadingUIProps extends HeadingComponentProps, Omit<ColdLightProps, "size"> {
	/** Visual size — decoupled from semantic level */
	size?: import("$lib/design/components/heading/types.js").HeadingSize;
}
