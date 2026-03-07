/**
 * @file Chat IPC payload types
 * @module @devpulse/sys/generated/chat
 *
 * Matches Rust struct `ChatMessage` from commands/chat/mod.rs.
 * Keep in sync with the Rust definition.
 */

export interface ChatMessage {
	readonly id: number;
	readonly session_id: string;
	readonly role: "user" | "assistant";
	readonly content: string;
	readonly created_at: number;
}
