/**
 * @file Component Types
 * @description Shared types for ColdLight styled components.
 */

import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

/** All styled components accept these surface prop overrides */
export interface ComponentSurfaceProps extends Partial<DsSurfaceProps> {
	/** Override the default recipe ID */
	recipe?: string;
}
