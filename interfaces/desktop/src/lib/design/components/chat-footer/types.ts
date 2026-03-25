/**
 * @file ChatFooter Types
 * @kind chat-footer
 * @layer components
 */

import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export interface ChatFooterProps extends UIBaseProps {
	/** Callback when a message is sent */
	onSend?: (content: string) => void;
	/** Callback when voice button is toggled */
	onVoice?: () => void;
	/** Whether voice input is currently active */
	voiceActive?: boolean;
	/** Whether the input is disabled */
	disabled?: boolean;
	/** Style preset identifier */
	style?: string;
}
