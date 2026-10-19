/**
 * @file Chat Block Types
 * @layer blocks
 */

import type { Snippet } from "svelte";
import type { ChatBubbleVariant } from "$lib/design/components/chat-bubble/types.js";

export interface ChatMessage {
	id: string;
	variant: ChatBubbleVariant;
	author?: string;
	content: string;
	timestamp?: string;
}

export interface ChatThread {
	id: string;
	label: string;
	active?: boolean;
	lastMessage?: string;
	timestamp?: string;
}

export interface ChatInputProps {
	placeholder?: string;
	onSend?: (message: string) => void;
	onVoice?: () => void;
	voiceActive?: boolean;
	disabled?: boolean;
	class?: string;
}

export interface ChatThreadProps {
	messages: ChatMessage[];
	/** Shown while there are no messages; the host decides what. */
	empty?: Snippet;
	class?: string;
}

export interface ChatPanelProps {
	title?: string;
	messages: ChatMessage[];
	onSend?: (message: string) => void;
	onVoice?: () => void;
	voiceActive?: boolean;
	/** Passed to the thread: shown while there are no messages. */
	empty?: Snippet;
	class?: string;
	children?: Snippet;
}

export interface ThreadListProps {
	threads: ChatThread[];
	activeId?: string;
	onSelect?: (threadId: string) => void;
	class?: string;
}
