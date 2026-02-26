/**
 * @file builders/nav-item/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the NavItem builder.
 * WAI-ARIA: link with `aria-current` support.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Constructor config for the NavItem builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type NavItemProps = {
	/**
	 * Whether this item represents the current page.
	 * When `true`, sets `aria-current="page"` and `data-active` on the root.
	 * Getter = controlled, static = uncontrolled.
	 * @default false
	 */
	active?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the nav item is disabled.
	 * When `true`, sets `aria-disabled`, `data-disabled`, and `tabindex="-1"`.
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * The href for the navigation link.
	 * Sets the `href` attribute on the root `<a>` element.
	 * @default ""
	 */
	href?: MaybeGetter<string | undefined>;
};
