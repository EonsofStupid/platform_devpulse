/**
 * @file InlineMessage Types
 * @kind inline-message
 * @layer components
 *
 * No matching primitive — uses UIBaseProps.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

export interface InlineMessageProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
		UIBaseProps {
	children?: Snippet;
	tone?: InlineMessageTone;
}
