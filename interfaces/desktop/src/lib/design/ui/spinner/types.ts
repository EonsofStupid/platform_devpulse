/**
 * @file Spinner UI Types
 * @kind spinner
 * @layer ui
 *
 * Styled spinner — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/spinner/.
 */

import type { SpinnerComponentProps } from "$lib/design/components/spinner/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { SpinnerSize } from "$lib/design/components/spinner/recipe.js";

/** Re-export SpinnerSize from recipe for consumer convenience. */
export type { SpinnerSize } from "$lib/design/components/spinner/recipe.js";

/** Spinner UI props — component (ARIA) + visual (ColdLight). */
export interface SpinnerUIProps extends SpinnerComponentProps, ColdLightProps {
	/** Size variant — structural sizing via recipe */
	size?: SpinnerSize;
}
