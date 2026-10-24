/**
 * @file ChatDashboard Types
 * @kind chat-dashboard
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export interface ChatDashboardProps extends UIBaseProps {
	/** Style preset identifier */
	style?: string;
	/** Chat message content */
	children?: Snippet;
}
