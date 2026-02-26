/**
 * @file builders/sidebar/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Sidebar builder.
 * Side navigation panel with expand/collapse toggle.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Sidebar. MaybeGetter for controlled/uncontrolled. */
export type SidebarProps = {
	/** Whether the sidebar is expanded. Getter = controlled, static = uncontrolled. @default true */
	expanded?: MaybeGetter<boolean | undefined>;
	/** Called when expanded state changes. */
	onExpandedChange?: (expanded: boolean) => void;
	/** Accessible label for the sidebar navigation. */
	label?: MaybeGetter<string | undefined>;
};
