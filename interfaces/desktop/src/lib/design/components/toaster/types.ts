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
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ToasterPreset = "default" | "stark" | "glass" | "flat" | "matte";

export type ToasterPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

/** Toaster component props — ColdLight 8-axis + ARIA + composition + primitive */
export interface ToasterComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Position of the toast container. @default "bottom-right" */
	position?: ToasterPosition;
	/** Style preset. Default: "default". */
	preset?: ToasterPreset;
	/** Default auto-dismiss delay in ms. @default 5000 */
	closeDelay?: number;
}
