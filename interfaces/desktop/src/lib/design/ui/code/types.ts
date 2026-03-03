/**
 * @file Code UI Types
 * @kind code
 * @layer ui
 *
 * Styled code — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/code/.
 */

import type { CodeComponentProps } from "$lib/design/components/code/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Re-export CodeLanguage from component for consumer convenience. */
export type { CodeLanguage } from "$lib/design/components/code/types.js";

/** Code UI props — component (ARIA) + visual (ColdLight). */
export interface CodeUIProps extends CodeComponentProps, ColdLightProps {}
