/**
 * @file NavItem Component Types
 * @kind nav-item
 * @layer components
 *
 * The primitive's props with sizing.
 */

import type { NavItemPrimitiveProps } from "#coldlight/primitives/nav-item/types.js";
import type { NavItemSize } from "./nav-item.generated.js";

export type { NavItemSize } from "./nav-item.generated.js";

/** NavItem component props */
export interface NavItemComponentProps extends NavItemPrimitiveProps {
	/** Size variant */
	size?: NavItemSize;
}
