/**
 * @file Chat view-model types (util layer)
 * @module @devpulse/domains/chat/util/chat.types
 */

export type { ChatMessage } from "$lib/sys/generated/bindings.js";

/** Block-level message for `MessageBubble` / legacy `ChatThread` bridge */
export interface BlockChatMessage {
	readonly id: string;
	readonly variant: "user" | "ai" | "system";
	readonly author?: string;
	readonly content: string;
	readonly timestamp?: string;
}

export type ChatMode = "developer" | "planning" | "image" | "general";
