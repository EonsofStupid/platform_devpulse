/**
 * @file Pin Input Component Types
 * @kind pin-input
 * @layer components
 *
 * No matching primitive — extends UIBaseProps.
 */

import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type PinInputSize = "sm" | "md" | "lg";
export type PinInputPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** PinInput component props — UIBaseProps + HTML + domain */
export interface PinInputComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
		UIBaseProps {
	/** Style preset */
	preset?: PinInputPreset;
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
