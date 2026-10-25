/**
 * @file primitives/tabs/types.ts
 * @module @devpulse/coldlight/primitives/tabs
 * @layer primitives
 *
 * Type definitions for Tabs primitive.
 *
 * @since 1.0.0
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

// ============================================
// TABS SLOTS
// ============================================

/**
 * All slots emitted by Tabs primitive.
 * Used for CSS targeting via `data-slot`.
 */
export const TabsSlots = ["root", "list", "trigger", "content"] as const;

export type TabsSlot = (typeof TabsSlots)[number];

// ============================================
// TABS STATE
// ============================================

/**
 * State values for Tabs primitive.
 * Used for CSS targeting via `data-state`.
 */
export type TabsState = "active" | "inactive";

// ============================================
// TABS ORIENTATION
// ============================================

/**
 * Orientation of the tabs for keyboard navigation.
 * - `horizontal`: Arrow left/right to navigate
 * - `vertical`: Arrow up/down to navigate
 */
export type TabsOrientation = "horizontal" | "vertical";

// ============================================
// TABS ACTIVATION MODE
// ============================================

/**
 * How tabs are activated.
 * - `automatic`: Tab activates on focus (default)
 * - `manual`: Tab activates on Enter/Space
 */
export type TabsActivationMode = "automatic" | "manual";

// ============================================
// ROOT PROPS
// ============================================

/**
 * Props for Tabs.Root component.
 * Controls active tab state and provides context to children.
 */
export interface TabsRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/**
	 * Active tab value (bindable).
	 * Must match a Trigger's `value` prop.
	 */
	value?: string;

	/**
	 * Callback when active tab changes.
	 */
	onValueChange?: (value: string) => void;

	/**
	 * Tab orientation for keyboard navigation.
	 * @default "horizontal"
	 */
	orientation?: TabsOrientation;

	/**
	 * How tabs are activated.
	 * @default "automatic"
	 */
	activationMode?: TabsActivationMode;

	/**
	 * Whether keyboard navigation loops at ends.
	 * @default true
	 */
	loop?: boolean;

	/**
	 * Disable all tabs.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Children (List, Content).
	 */
	children?: Snippet;

	/**
	 * Stable ID for tooling/testing.
	 */
	"data-id"?: string;
}

// ============================================
// LIST PROPS
// ============================================

/**
 * Props for Tabs.List component.
 * Container for tab triggers with role="tablist".
 */
export interface TabsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/**
	 * Tab trigger children.
	 */
	children?: Snippet;

	/**
	 * Stable ID for tooling/testing.
	 */
	"data-id"?: string;
}

// ============================================
// TRIGGER PROPS
// ============================================

/**
 * Props for Tabs.Trigger component.
 * Individual tab button with role="tab".
 */
export interface TabsTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	/**
	 * Tab value (required).
	 * Links this trigger to a Content with matching value.
	 */
	value: string;

	/**
	 * Disable this specific tab.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Trigger content.
	 */
	children?: Snippet;

	/**
	 * Stable ID for tooling/testing.
	 */
	"data-id"?: string;
}

// ============================================
// CONTENT PROPS
// ============================================

/**
 * Props for Tabs.Content component.
 * Tab panel with role="tabpanel".
 */
export interface TabsContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/**
	 * Tab value (required).
	 * Links this content to a Trigger with matching value.
	 */
	value: string;

	/**
	 * Content to render when tab is active.
	 */
	children?: Snippet;

	/**
	 * Stable ID for tooling/testing.
	 */
	"data-id"?: string;
}
