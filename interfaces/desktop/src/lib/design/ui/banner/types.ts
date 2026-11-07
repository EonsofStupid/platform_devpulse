/**
 * @file Banner UI Types
 * @kind banner
 * @layer ui
 *
 * Styled banner — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/banner/.
 */

import type { BannerComponentProps, BannerIntent } from "$lib/design/components/banner/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Intent → preset mapping. Intent is syntactic sugar for named presets. */
export const BANNER_INTENT_PRESETS: Record<BannerIntent, string> = {
	info: "banner-info",
	success: "banner-success",
	warning: "banner-warning",
	error: "banner-error",
};

/** Re-export BannerIntent for consumer convenience. */
export type { BannerIntent } from "$lib/design/components/banner/types.js";

/** Banner UI props — component (ARIA) + visual (ColdLight). */
export interface BannerUIProps extends BannerComponentProps, ColdLightProps {}
