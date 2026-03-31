/**
 * @file domains/chat/index.ts
 * @module @devpulse/domains/chat
 * @description Chat domain — state, services, types
 */

export { chatState } from "./runes/chat.runes.svelte.js";
export { loadMessages, sendMessage } from "./services/chat.service.js";
export type { BlockChatMessage, ChatMessage, ChatMode, ChatThread } from "./types/chat.types.js";
