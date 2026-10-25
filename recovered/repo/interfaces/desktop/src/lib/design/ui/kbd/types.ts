/**
 * @file Kbd UI Types
 * @kind kbd
 * @layer ui
 *
 * Styled kbd — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/kbd/.
 */

import type { KbdComponentProps } from "$lib/design/components/kbd/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Re-export KbdSize from component for consumer convenience. */
export type { KbdSize } from "$lib/design/components/kbd/types.js";

/** Kbd UI props — component (ARIA) + visual (ColdLight). */
export interface KbdUIProps extends KbdComponentProps, ColdLightProps {}
