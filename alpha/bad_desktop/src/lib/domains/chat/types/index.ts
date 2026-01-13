/**
 * Chat Domain Types
 */

// === API Types ===
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

export interface HistoryMessage {
	role: string;
	content: string;
	timestamp: number;
}

// === Store Types ===
export type ChatMode = 'closed' | 'minimized' | 'open';
export type AssistantMode = 'chat' | 'dev' | 'image' | 'thinkspace' | 'planning' | 'promptrecipe';
export type PanelType = 'dev' | 'plan' | 'training' | 'personality' | 'gallery';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ModeTheme {
	hue: number;
	accentHue: number;
	label: string;
	icon: string;
}

export interface ChatFeatures {
	streaming: boolean;
	voiceInput: boolean;
	voiceOutput: boolean;
	driftGuard: boolean;
}
