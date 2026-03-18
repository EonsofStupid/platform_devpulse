/**
 * @file InlineMessage Types
 * @kind inline-message
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

export interface InlineMessageProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	tone?: InlineMessageTone;
}
