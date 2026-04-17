/**
 * @file domains/chat — public barrel (golden pattern)
 * @module @devpulse/domains/chat
 */

export { chatState } from "./data-access/chat.state.svelte.js";
export { sessionsState } from "./data-access/sessions.state.svelte.js";
export { ChatRoot } from "./feature/index.js";
export type {
	BlockChatMessage,
	ChatMessage,
	ChatMode,
	ExportFormat,
	Message,
	Session,
} from "./util/index.js";
