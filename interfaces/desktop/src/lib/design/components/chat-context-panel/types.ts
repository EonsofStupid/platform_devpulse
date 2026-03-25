/**
 * @file ChatContextPanel Types
 * @kind chat-context-panel
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export interface ChatContextPanelProps extends UIBaseProps {
	/** Whether the panel is collapsed */
	collapsed?: boolean;
	/** Style preset identifier */
	style?: string;
	/** Panel content — cortex visualization or custom content */
	children?: Snippet;
}
