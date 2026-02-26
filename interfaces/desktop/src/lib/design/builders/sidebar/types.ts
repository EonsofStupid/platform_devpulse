/**
 * @file builders/sidebar/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Sidebar builder.
 * Side navigation panel with expand/collapse toggle.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Constructor config for Sidebar.
 *
 * All props support the `MaybeGetter<T>` pattern for controlled/uncontrolled usage.
 */
export type SidebarProps = {
	/**
	 * Whether the sidebar is expanded.
	 *
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default true
	 */
	expanded?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when expanded state changes.
	 *
	 * Receives the new expanded boolean value.
	 */
	onExpandedChange?: (expanded: boolean) => void;

	/**
	 * Accessible label for the sidebar navigation landmark.
	 *
	 * Applied as `aria-label` on the root `<aside>` element.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;
};
