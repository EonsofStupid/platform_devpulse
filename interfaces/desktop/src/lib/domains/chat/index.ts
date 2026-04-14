/**
 * @file domains/chat/index.ts
 * @module @devpulse/domains/chat
 * @description Chat domain public API (Nx library-types)
 */

export { loadMessages, sendMessage } from "./data-access/chat.service.js";
export { chatState } from "./data-access/chat.state.svelte.js";
export type {
	BlockChatMessage,
	ChatMessage,
	ChatMode,
	ChatThread,
} from "./util/chat.types.js";
