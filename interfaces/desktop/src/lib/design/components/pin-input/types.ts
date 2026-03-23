/**
 * @file Pin Input Component Types
 * @kind pin-input
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type PinInputSize = "sm" | "md" | "lg";

/** PinInput component props — ColdLight 8-axis + ARIA + recipe */
export interface PinInputComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Size variant */
	size?: PinInputSize;
	/** Number of pin fields. @default 4 */
	length?: number;
	/** Current pin value. @default "" */
	value?: string;
	/** Called when pin value changes. */
	onValueChange?: (value: string) => void;
	/** Called when all fields are filled. */
	onComplete?: (value: string) => void;
	/** Disable the pin input. @default false */
	disabled?: boolean;
	/** Mask the input (like password). @default false */
	mask?: boolean;
	/** Placeholder character for empty fields. @default "○" */
	placeholder?: string;
	/** Accessible label for the pin input group. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
}
