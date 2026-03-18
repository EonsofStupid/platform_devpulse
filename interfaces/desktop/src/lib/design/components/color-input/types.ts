/**
 * @file Color Input Component Types
 * @kind color-input
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type ColorInputSize = "sm" | "md" | "lg";

/** ColorInput component props — builder state + recipe + primitive */
export interface ColorInputComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Size variant */
	size?: ColorInputSize;
	/** Color value (hex string). @default "#000000" */
	value?: string;
	/** Called when color value changes. */
	onValueChange?: (value: string) => void;
	/** Disable the color input. @default false */
	disabled?: boolean;
	/** Mark input as required. @default false */
	required?: boolean;
	/** Mark input as invalid. @default false */
	invalid?: boolean;
	/** Label text for the color input. */
	label?: string;
	/** Accessible label for the color input. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
}
