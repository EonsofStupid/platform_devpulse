/**
 * @file Widget Block Types
 * @kind widget
 * @layer blocks
 * @package @devpulse/coldlight
 */

import type { Snippet, Component } from "svelte";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type WidgetSize = "sm" | "md" | "lg";

export interface WidgetTab {
	readonly id: string;
	readonly label: string;
}

export interface WidgetProps extends ColdLightProps {
	/** Widget title displayed in header. */
	title?: string;
	/** Lucide icon component rendered before the title. */
	icon?: Component<Record<string, unknown>>;
	/** Recipe ID override. @default "widget.glass.void" */
	recipe?: string;
	/** Tab definitions for chrome-style tab bar. */
	tabs?: WidgetTab[];
	/** Currently active tab ID. */
	activeTab?: string;
	/** Callback when active tab changes. */
	onTabChange?: (tabId: string) => void;
	/** Main content slot. */
	children?: Snippet;
	/** Custom header actions slot (right side of header). */
	actions?: Snippet;
	/** Custom footer slot. */
	footer?: Snippet;
	/** Additional CSS class for root. */
	class?: string;
}

export interface WidgetHeaderProps {
	/** Widget title text. */
	title?: string;
	/** Lucide icon component rendered before the title. */
	icon?: Component<Record<string, unknown>>;
	/** Class string from recipe. */
	class?: string;
	/** Title class from recipe. */
	titleClass?: string;
	/** Actions class from recipe. */
	actionsClass?: string;
	/** Custom header actions slot. */
	actions?: Snippet;
}

export interface WidgetTabsProps {
	/** Tab definitions. */
	tabs: WidgetTab[];
	/** Currently active tab ID. */
	activeTab?: string;
	/** Tab change callback. */
	onTabChange?: (tabId: string) => void;
	/** Tabs container class from recipe. */
	class?: string;
	/** Individual tab class from recipe. */
	tabClass?: string;
}

export interface WidgetContentProps {
	/** Class string from recipe. */
	class?: string;
	/** Content slot. */
	children?: Snippet;
}

export interface WidgetFooterProps {
	/** Class string from recipe. */
	class?: string;
	/** Footer slot. */
	children?: Snippet;
}
