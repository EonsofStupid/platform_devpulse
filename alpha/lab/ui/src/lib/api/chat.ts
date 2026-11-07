// Chat API - History and messaging

import { get, post } from './client';

export interface ChatMessage {
	id: string;
	session_id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: string;
}

export interface SendMessageRequest {
	session_id: string;
	content: string;
}

export interface ChatSession {
	id: string;
	created_at: string;
	message_count: number;
}

export async function getHistory(sessionId: string): Promise<ChatMessage[]> {
	return get(`/api/chat/history?session_id=${sessionId}`);
}

export async function sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
	return post('/api/chat/send', { session_id: sessionId, content });
}

export async function getSessions(): Promise<ChatSession[]> {
	return get('/api/chat/sessions');
}

export async function createSession(): Promise<ChatSession> {
	return post('/api/chat/sessions', {});
}
