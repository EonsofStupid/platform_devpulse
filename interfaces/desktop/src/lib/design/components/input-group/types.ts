/**
 * @file Input Group Component Types
 * @kind input-group
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type InputGroupSize = "sm" | "md" | "lg";
export type InputGroupIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** InputGroup component props — builder state + composition + primitive */
export interface InputGroupComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "prefix" | "suffix">,
		BaseProps,
		ComponentProps {
	/** Main content slot (typically an input element) */
	children?: Snippet;
	/** Style intent preset */
	intent?: InputGroupIntent;
	/** Prefix addon content */
	prefix?: Snippet;
	/** Suffix addon content */
	suffix?: Snippet;
	/** Size variant */
	size?: InputGroupSize;
	/** Disable the entire input group. @default false */
	disabled?: boolean;
	/** Accessible label for the group. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
}
