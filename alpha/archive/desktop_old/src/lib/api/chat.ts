/**
 * Chat API - Tauri command wrappers for chat functionality
 */
import { invoke } from '@tauri-apps/api/core';

export interface ChatResult {
	message: string;
	tokens_used: number;
	is_stub: boolean;
}

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	tokens_used?: number;
	is_stub?: boolean;
}

/** Backend history message format */
interface HistoryMessage {
	role: string;
	content: string;
	timestamp: number;
}

/**
 * Send a chat message and get a response
 */
export async function sendMessage(message: string): Promise<ChatResult> {
	return invoke<ChatResult>('chat', { message });
}

/**
 * Get chat history for current session
 * Returns messages in chronological order (oldest first)
 */
export async function getHistory(limit?: number): Promise<Message[]> {
	const messages = await invoke<HistoryMessage[]>('get_chat_history', { limit: limit ?? 100 });

	return messages.map((m, index) => ({
		id: `msg-${m.timestamp}-${index}`,
		role: m.role as 'user' | 'assistant' | 'system',
		content: m.content,
		timestamp: m.timestamp
	}));
}
