/**
 * @file EmptyState UI Types
 * @kind empty-state
 * @layer ui
 *
 * Styled empty-state — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/empty-state/.
 */

import type { EmptyStateComponentProps } from "$lib/design/components/empty-state/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type EmptyStateSize = "sm" | "md" | "lg";

/** EmptyState UI props — component (ARIA) + visual (ColdLight). */
export interface EmptyStateUIProps extends EmptyStateComponentProps, ColdLightProps {
	/** Size variant — controls padding and icon/text sizing */
	size?: EmptyStateSize;
}
