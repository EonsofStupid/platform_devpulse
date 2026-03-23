/**
 * @file Form Field Component Types
 * @kind form-field
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type FormFieldSize = "sm" | "md" | "lg";

/** FormField component props — builder state + recipe + primitive */
export interface FormFieldComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	/** Control input slot */
	children?: Snippet;
	/** Label text */
	label?: string;
	/** Description / help text */
	description?: string;
	/** Error message text */
	error?: string;
	/** Size variant */
	size?: FormFieldSize;
	/** Whether the field is invalid. @default false */
	invalid?: boolean;
	/** Whether the field is required. @default false */
	required?: boolean;
	/** Whether the field is disabled. @default false */
	disabled?: boolean;
}
