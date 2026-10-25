/**
 * Window API - Tauri command wrappers for window management
 */
import { invoke } from '@tauri-apps/api/core';

/**
 * Open the chat window
 */
export async function openChatWindow(): Promise<void> {
	return invoke('open_chat_window');
}

/**
 * Close the chat window
 */
export async function closeChatWindow(): Promise<void> {
	return invoke('close_chat_window');
}

/**
 * Dock chat window to main window edge
 */
export async function dockChatWindow(edge: 'left' | 'right'): Promise<void> {
	return invoke('dock_chat_window', { edge });
}

/**
 * Navigate main window to a route
 */
export async function navigateMainWindow(route: string): Promise<void> {
	return invoke('navigate_main_window', { route });
}

/**
 * Focus the main window (bring to front)
 */
export async function focusMainWindow(): Promise<void> {
	return invoke('focus_main_window');
}

/**
 * Restore main window if minimized
 */
export async function restoreMainWindow(): Promise<void> {
	return invoke('restore_main_window');
}
