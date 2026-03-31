/**
 * @file Chat Domain Service
 * @module @devpulse/domains/chat/services
 *
 * IPC boundary for chat operations.
 * ALL Tauri invoke calls for chat go through here — nowhere else.
 * Mirrors devpulse.service.ts pattern.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { ChatMessage } from "../types/chat.types.js";

/**
 * Load recent chat messages from LibSQL via Tauri IPC.
 */
export async function loadMessages(): Promise<ChatMessage[]> {
	logInfo("chat", "Loading recent messages via IPC...");
	try {
		const messages = await invoke<ChatMessage[]>("load_recent");
		logInfo("chat", `Loaded ${messages.length} messages`);
		return messages;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("chat", `Message load FAILED: ${msg}`);
		throw e;
	}
}

/**
 * Send a chat message via Tauri IPC.
 * Backend persists to LibSQL and returns the stored message.
 */
export async function sendMessage(content: string): Promise<ChatMessage> {
	logInfo("chat", "Sending message via IPC...");
	try {
		const stored = await invoke<ChatMessage>("send_message", { content });
		logInfo("chat", `Message sent: id=${stored.id}`);
		return stored;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("chat", `Message send FAILED: ${msg}`);
		throw e;
	}
}
