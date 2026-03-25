/**
 * @file Toggle Group Component Types
 * @kind toggle-group
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SvelteSet } from "svelte/reactivity";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ToggleGroupSize = "sm" | "md" | "lg";

export type ToggleGroupIntent = "default" | "stark" | "glass" | "flat" | "matte";
export type ToggleGroupOrientation = "horizontal" | "vertical";

/** Item definition for toggle group */
export interface ToggleGroupItem {
	value: string;
	label: string;
	disabled?: boolean;
}

/** ToggleGroup component props — builder state + composition + primitive */
export interface ToggleGroupComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Toggle items to render */
	items?: ToggleGroupItem[];
	/** Size variant */
	size?: ToggleGroupSize;
	/** Current value(s). */
	value?: string | Iterable<string>;
	/** Called when value changes (single mode). */
	onValueChange?: ((value: string | undefined) => void) | ((value: SvelteSet<string>) => void);
	/** Allow multiple items pressed simultaneously. @default false */
	multiple?: boolean;
	/** Disable the entire group. @default false */
	disabled?: boolean;
	/** Orientation for arrow key navigation. @default "horizontal" */
	orientation?: ToggleGroupOrientation;
	/** Whether arrow keys loop. @default true */
	loop?: boolean;
	/** Style intent. Default: "default". */
	intent?: ToggleGroupIntent;
}
