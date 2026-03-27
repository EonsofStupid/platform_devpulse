/**
 * @file Steps Component Types
 * @kind steps
 * @layer components
 *
 * Extends primitive with ARIA state props and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type StepsSize = "sm" | "md" | "lg";

export type StepsPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type StepsOrientation = "horizontal" | "vertical";

/** Steps component props — ARIA + composition + ColdLight 8-axis */
export interface StepsComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Size variant */
	size?: StepsSize;
	/** Orientation of the steps layout. @default "horizontal" */
	orientation?: StepsOrientation;
	/** Current active step index (zero-based). @default 0 */
	activeStep?: number;
	/** Called when active step changes. */
	onActiveStepChange?: (step: number) => void;
	/** Accessible label for the steps navigation. */
	label?: string;
	/** Whether steps must be completed sequentially. @default true */
	linear?: boolean;
	/** Disable the entire steps component. @default false */
	disabled?: boolean;
	/** Style preset. Default: "default". */
	preset?: StepsPreset;
}
