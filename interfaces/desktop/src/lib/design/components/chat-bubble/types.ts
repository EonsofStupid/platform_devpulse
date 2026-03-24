/**
 * @file ChatBubble Types
 * @kind chat-bubble
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type ChatBubbleVariant = "ai" | "user" | "system";

export interface ChatBubbleProps extends UIBaseProps {
	/** Message variant — determines visual treatment */
	variant?: ChatBubbleVariant;
	/** Author display name */
	author?: string;
	/** Timestamp string */
	timestamp?: string;
	/** Message content */
	children?: Snippet;
}
