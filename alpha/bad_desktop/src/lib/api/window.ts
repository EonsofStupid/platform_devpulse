/**
 * Window API - Tauri command wrappers for Steam-style window management
 *
 * Chat window is INDEPENDENT (not a child):
 * - Own taskbar entry
 * - Can minimize independently
 * - Closes when main closes (owner relationship)
 */
import { invoke } from '@tauri-apps/api/core';

/**
 * Open the chat window (Steam-style independent window)
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
 * Minimize chat window to taskbar
 */
export async function minimizeChatWindow(): Promise<void> {
	return invoke('minimize_chat_window');
}

/**
 * Toggle chat window always-on-top
 * @returns New always-on-top state
 */
export async function toggleChatAlwaysOnTop(): Promise<boolean> {
	return invoke('toggle_chat_always_on_top');
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
