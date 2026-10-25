/**
 * Chat Components - Core chat UI using chatStore (Svelte 5 runes)
 *
 * MaestroFab = Floating action button (opens chat window)
 * ChatView = message list + input (used in chat window)
 * TaskPanel = Maestro-generated task list
 * MessageList = displays chat messages
 * ChatInput = input field for messages
 * DebugPanel = Toggle controls for testing modes
 * ChatOverlay = Legacy overlay (deprecated, use MaestroFab + separate window)
 */

export { default as MaestroFab } from './MaestroFab.svelte';
export { default as ChatView } from './ChatView.svelte';
export { default as TaskPanel } from './TaskPanel.svelte';
export { default as MessageList } from './MessageList.svelte';
export { default as ChatInput } from './ChatInput.svelte';
export { default as DebugPanel } from './DebugPanel.svelte';
export { default as ChatOverlay } from './ChatOverlay.svelte';
