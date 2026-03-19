/**
 * @file NavItem Component Types
 * @kind nav-item
 * @layer components
 *
 * Extends primitive with ARIA state props (active, disabled), sizing, and href.
 * Component layer owns ARIA -- primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type NavItemSize = "sm" | "md" | "lg";

/** NavItem component props — ColdLight 8-axis + ARIA + recipe */
export interface NavItemComponentProps
	extends Omit<HTMLAnchorAttributes, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Whether this item represents the current page */
	active?: boolean;
	/** Whether the nav item is disabled */
	disabled?: boolean;
	/** The href for the navigation link */
	href?: string;
	/** Size variant */
	size?: NavItemSize;
}
