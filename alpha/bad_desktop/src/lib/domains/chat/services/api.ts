/**
 * Chat API - Tauri command wrappers
 */
import { invoke } from '@tauri-apps/api/core';
import type { ChatResult, Message, HistoryMessage } from '../types';

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
