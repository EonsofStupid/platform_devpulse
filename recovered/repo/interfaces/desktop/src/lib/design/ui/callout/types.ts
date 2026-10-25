/**
 * @file Callout UI Types
 * @kind callout
 * @layer ui
 *
 * Styled callout — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/callout/.
 */

import type { CalloutComponentProps, CalloutVariant } from "$lib/design/components/callout/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Variant → preset mapping. Variant is syntactic sugar for named presets. */
export const CALLOUT_VARIANT_PRESETS: Record<CalloutVariant, string> = {
	info: "callout-info",
	success: "callout-info",
	warning: "callout-warning",
	error: "callout-warning",
	tip: "callout-tip",
};

/** Re-export CalloutVariant for consumer convenience. */
export type { CalloutVariant } from "$lib/design/components/callout/types.js";

/** Callout UI props — component (ARIA) + visual (ColdLight). */
export interface CalloutUIProps extends CalloutComponentProps, ColdLightProps {}
