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
import type { CardVariant } from "#coldlight/components/card/card.types.js";
import type { ComponentSurfaceProps } from "#coldlight/components/types.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";

// Accepts both Svelte 5 Component and Svelte 4 class components (lucide-svelte)
// biome-ignore lint/suspicious/noExplicitAny: Svelte 5 Component + Svelte 4 class component union requires any
type IconComponent = Component<any> | (new (...args: any[]) => SvelteComponent);

export type WidgetSize = "sm" | "md" | "lg";

export interface WidgetTab {
	readonly id: string;
	readonly label: string;
}

/**
 * The remaining visual axis props (depth, bevel, glow, frame, radius, motion,
 * transition) are accepted and not yet drawn (owner, 2026-10-22: kept until the
 * model draws them; glow → data-accent in plan 0006 0s.7).
 */
export interface WidgetProps extends Omit<ComponentSurfaceProps, "surface" | "preset"> {
	/** Family for this widget and what it contains; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** The card's surface role. Default: "elevated" */
	variant?: CardVariant;
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
