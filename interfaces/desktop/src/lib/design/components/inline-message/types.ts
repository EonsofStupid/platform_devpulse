/**
 * @file InlineMessage Types
 * @kind inline-message
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

export interface InlineMessageProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	tone?: InlineMessageTone;
}
