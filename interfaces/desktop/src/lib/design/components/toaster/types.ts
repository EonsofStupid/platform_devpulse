/**
 * @file Toaster Component Types
 * @kind toaster
 * @layer components
 *
 * Extends primitive with ColdLight 8-axis visual props.
 * Component layer owns ARIA — primitive is structureless.
 * Wraps MeltUI toaster via transport adapter.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ToasterPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

/** Toaster component props — ColdLight 8-axis + ARIA + recipe + primitive */
export interface ToasterComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Position of the toast container. @default "bottom-right" */
	position?: ToasterPosition;
	/** Default auto-dismiss delay in ms. @default 5000 */
	closeDelay?: number;
}
