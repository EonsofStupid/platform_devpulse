/**
 * Chat Domain - Self-contained module
 *
 * Usage:
 *   import { chatStore, ChatView, ChatInput } from '$lib/domains/chat';
 *   import type { Message, ChatMode } from '$lib/domains/chat';
 */

// Components
export * from './components';

// Stores
export { chatStore, MODE_THEMES } from './stores';
export type { ChatMode, AssistantMode, PanelType, ConnectionStatus, ModeTheme } from './stores';

// Services
export { sendMessage, getHistory } from './services';

// Types
export type {
	ChatResult,
	Message,
	HistoryMessage,
	ChatFeatures
} from './types';
