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
import type { BaseProps } from "$lib/design/primitives/types.js";

export type NavItemSize = "sm" | "md" | "lg";

/** NavItem component props -- ARIA + recipe + primitive */
export interface NavItemComponentProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
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
