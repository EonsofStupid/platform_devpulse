/**
 * @file builders/nav-item/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the NavItem builder.
 * WAI-ARIA: link with aria-current support.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for NavItem. */
export type NavItemProps = {
	/** Whether this item represents the current page. Getter = controlled, static = uncontrolled. @default false */
	active?: MaybeGetter<boolean | undefined>;
	/** Whether the nav item is disabled. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** The href for the navigation link. */
	href?: MaybeGetter<string | undefined>;
};
