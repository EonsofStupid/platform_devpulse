/**
 * @file Number Input Component Types
 * @kind number-input
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type NumberInputSize = "sm" | "md" | "lg";

/** NumberInput component props — builder state + recipe + primitive */
export interface NumberInputComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Size variant */
	size?: NumberInputSize;
	/** Numeric value. @default 0 */
	value?: number;
	/** Called when value changes. */
	onValueChange?: (value: number) => void;
	/** Minimum allowed value. @default -Infinity */
	min?: number;
	/** Maximum allowed value. @default Infinity */
	max?: number;
	/** Step increment. @default 1 */
	step?: number;
	/** Disable the number input. @default false */
	disabled?: boolean;
	/** Mark input as read-only. @default false */
	readonly?: boolean;
	/** Mark input as required. @default false */
	required?: boolean;
	/** Human-readable text alternative for aria-valuenow. */
	valueText?: string;
	/** Accessible label for the group. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
}
