/**
 * @file ChatFrame Types
 * @kind chat-frame
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export interface ChatFrameProps extends UIBaseProps {
	/** Frame visibility state */
	state?: "open" | "minimized" | "closed";
	/** Whether the user is actively engaged in conversation */
	engaged?: boolean;
	/** Whether the context panel is collapsed */
	contextCollapsed?: boolean;
	/** Style preset identifier */
	style?: string;
	/** Frame content — topbar, sidebar, dashboard, footer, context panel */
	children: Snippet;
}
