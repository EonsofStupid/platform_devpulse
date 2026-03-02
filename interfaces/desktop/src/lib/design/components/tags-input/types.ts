/**
 * @file Tags Input Component Types
 * @kind tags-input
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type TagsInputSize = "sm" | "md" | "lg";

/** TagsInput component props — ColdLight 8-axis + ARIA + recipe */
export interface TagsInputComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Size variant */
	size?: TagsInputSize;
	/** Current tag values. @default [] */
	value?: string[];
	/** Called when tags change. */
	onValueChange?: (value: string[]) => void;
	/** Disable the tags input. @default false */
	disabled?: boolean;
	/** Mark input as invalid. @default false */
	invalid?: boolean;
	/** Maximum number of tags. @default undefined (unlimited) */
	max?: number;
	/** Placeholder text for the input. @default "Add tag..." */
	placeholder?: string;
	/** Accessible label for the tags input group. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
}
