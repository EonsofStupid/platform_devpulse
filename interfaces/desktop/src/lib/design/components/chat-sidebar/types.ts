/**
 * @file ChatSidebar Types
 * @kind chat-sidebar
 * @layer components
 */

import type { UIBaseProps } from "$lib/design/components/_base/types.js";

/** One mode the sidebar offers: its id and its short visible label. */
export interface ChatSidebarMode {
	id: string;
	label: string;
}

export interface ChatSidebarProps extends UIBaseProps {
	/** The modes to offer, in order; the host supplies ids and labels. */
	modes: ChatSidebarMode[];
	/** Id of the active mode. */
	mode?: string;
	/** Called with a mode's id when it is chosen. */
	onModeChange?: (id: string) => void;
	/** Style preset identifier */
	style?: string;
}
