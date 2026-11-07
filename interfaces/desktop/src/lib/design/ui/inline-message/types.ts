/**
 * @file InlineMessage UI Types
 * @kind inline-message
 * @layer ui
 *
 * Styled inline-message — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/inline-message/.
 */

import type { InlineMessageComponentProps } from "$lib/design/components/inline-message/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Re-export InlineMessageTone from component for consumer convenience. */
export type { InlineMessageTone } from "$lib/design/components/inline-message/types.js";

/** InlineMessage UI props — component (ARIA) + visual (ColdLight). */
export interface InlineMessageUIProps extends InlineMessageComponentProps, ColdLightProps {}
