/**
 * @file Chat view-model types (util layer)
 * @module @devpulse/domains/chat/util/chat.types
 */

import type { Outcome } from "$lib/sys/generated/bindings.js";

export type { ChatMessage } from "$lib/sys/generated/bindings.js";

/** Block-level message for `MessageBubble` / legacy `ChatThread` bridge */
export interface BlockChatMessage {
	readonly id: string;
	readonly variant: "user" | "ai" | "system";
	readonly author?: string;
	readonly content: string;
	readonly timestamp?: string;
	/** How a room's run ended, when this is that entry. */
	readonly outcome?: Outcome;
	/** The JSON block a room seat ended its answer with. */
	readonly structured?: string;
	/** What to call that block where you can open it. */
	readonly structuredLabel?: string;
}

export type ChatMode = "developer" | "planning" | "image" | "general";
