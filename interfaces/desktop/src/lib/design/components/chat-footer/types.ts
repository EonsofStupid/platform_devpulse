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
	/**
	 * Controlled input value. When provided alongside `onValueChange`,
	 * ChatFooter forwards every keystroke to the parent and renders the
	 * value the parent supplies. When `undefined`, ChatFooter keeps its
	 * legacy uncontrolled-internal-state behaviour. The two modes
	 * cannot be mixed — either pass both `value` and `onValueChange`,
	 * or pass neither.
	 */
	value?: string;
	/** Required in controlled mode — fires on every value change. */
	onValueChange?: (next: string) => void;
	/**
	 * Fires on every keystroke regardless of controlled / uncontrolled
	 * mode. Used by the chat-input suggestion surface to drive
	 * type-time recall against the user's prompt corpus.
	 */
	onInput?: (next: string) => void;
	/** Style preset identifier */
	style?: string;
}
