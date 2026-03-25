/**
 * @file ChatTopBar Types
 * @kind chat-topbar
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export interface ChatTopBarProps extends UIBaseProps {
	/** Hub label displayed in the topbar */
	hubLabel?: string;
	/** Chat title */
	title?: string;
	/** Style preset identifier */
	style?: string;
	/** Callback when minimize button is clicked */
	onMinimize?: () => void;
	/** Callback when close button is clicked */
	onClose?: () => void;
	/** Optional custom content */
	children?: Snippet;
}
