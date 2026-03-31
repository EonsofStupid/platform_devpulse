/**
 * @file Chat Domain Types
 * @module @devpulse/domains/chat/types
 *
 * Immutable domain types for the chat domain.
 * IPC payload type re-exported from sys/generated.
 */

/** IPC payload — matches Rust ChatMessage struct */
export type { ChatMessage } from "$lib/sys/generated/chat.types.js";

/** Block-level message format consumed by ChatThread/ChatBubble */
export interface BlockChatMessage {
	readonly id: string;
	readonly variant: "user" | "ai";
	readonly author?: string;
	readonly content: string;
	readonly timestamp?: string;
}

/** Thread in the thread selector */
export interface ChatThread {
	readonly id: string;
	readonly label: string;
	readonly active: boolean;
}

/** Chat modes — matches globalState.chat_mode */
export type ChatMode = "developer" | "planning" | "image" | "general";
