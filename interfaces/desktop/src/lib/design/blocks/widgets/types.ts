/**
 * @file Widget Block Types
 * @kind widget
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * DUMB block. Structure + slots only.
 * Visual treatment via class prop from caller.
 */

import type { Component, Snippet, SvelteComponent } from "svelte";
import type { ComponentSurfaceProps } from "$lib/design/components/types.js";

// Accepts both Svelte 5 Component and Svelte 4 class components (lucide-svelte)
// biome-ignore lint/suspicious/noExplicitAny: Svelte 5 Component + Svelte 4 class component union requires any
type IconComponent = Component<any> | (new (...args: any[]) => SvelteComponent);

export type WidgetSize = "sm" | "md" | "lg";

export interface WidgetTab {
	readonly id: string;
	readonly label: string;
}

export interface WidgetProps extends ComponentSurfaceProps {
	/** Semantic intent — resolved by StyleMacro to visual preset */
	intent?: string;
	/** Widget title displayed in header */
	title?: string;
	/** Lucide icon component rendered before the title */
	icon?: IconComponent;
	/** Size — drives structural classes */
	size?: WidgetSize;
	/** Tab definitions for chrome-style tab bar */
	tabs?: WidgetTab[];
	/** Currently active tab ID */
	activeTab?: string;
	/** Callback when active tab changes */
	onTabChange?: (tabId: string) => void;
	/** Main content slot */
	children?: Snippet;
	/** Custom header actions slot (right side of header) */
	actions?: Snippet;
	/** Custom footer slot */
	footer?: Snippet;
	/** CSS classes — structural + visual from caller */
	class?: string;
}

export interface WidgetHeaderProps {
	/** Widget title text */
	title?: string;
	/** Lucide icon component rendered before the title */
	icon?: IconComponent;
	/** Class string from recipe */
	class?: string;
	/** Title class from recipe */
	titleClass?: string;
	/** Actions class from recipe */
	actionsClass?: string;
	/** Custom header actions slot */
	actions?: Snippet;
}

export interface WidgetTabsProps {
	/** Tab definitions */
	tabs: WidgetTab[];
	/** Currently active tab ID */
	activeTab?: string;
	/** Tab change callback */
	onTabChange?: (tabId: string) => void;
	/** Tabs container class from recipe */
	class?: string;
	/** Individual tab class from recipe */
	tabClass?: string;
}

export interface WidgetContentProps {
	/** Class string from recipe */
	class?: string;
	/** Content slot */
	children?: Snippet;
}

export interface WidgetFooterProps {
	/** Class string from recipe */
	class?: string;
	/** Footer slot */
	children?: Snippet;
}
