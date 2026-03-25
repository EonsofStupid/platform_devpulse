/**
 * @file ChatSidebar Types
 * @kind chat-sidebar
 * @layer components
 */

import type { UIBaseProps } from "$lib/design/components/_base/types.js";
import type { ChatMode } from "$lib/sys/runes/global.svelte.js";

export type { ChatMode };

export interface ChatSidebarProps extends UIBaseProps {
	/** Currently active chat mode */
	mode?: ChatMode;
	/** Available mode options */
	availableModes?: ChatMode[];
	/** Callback when mode is changed */
	onModeChange?: (mode: ChatMode) => void;
	/** Style preset identifier */
	style?: string;
}
