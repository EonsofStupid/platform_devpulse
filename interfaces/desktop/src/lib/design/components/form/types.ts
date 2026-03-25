/**
 * @file Form Component Types
 * @kind form
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLFormAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type FormSize = "sm" | "md" | "lg";
export type FormIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** Form component props — builder state + composition + primitive */
export interface FormComponentProps
	extends Omit<HTMLFormAttributes, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent preset */
	intent?: FormIntent;
	/** Size variant — propagates to child form fields via CSS */
	size?: FormSize;
	/** Accessible label for the form. */
	label?: string;
	/** Disable the entire form. @default false */
	disabled?: boolean;
	/** Whether the form is in a pending/submitting state. @default false */
	pending?: boolean;
	/** Called on form submit. Receives the native SubmitEvent. */
	onSubmit?: (e: SubmitEvent) => void;
	/** Called on form reset. */
	onReset?: () => void;
}
