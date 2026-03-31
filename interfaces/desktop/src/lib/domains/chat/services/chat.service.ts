/**
 * @file Chat Domain Service
 * @module @devpulse/domains/chat/services
 *
 * IPC boundary for chat operations.
 * ALL Tauri invoke calls for chat go through here — nowhere else.
 * Mirrors devpulse.service.ts pattern.
 */

import { invoke } from "@tauri-apps/api/core";
import { generateText } from "$lib/domains/app/models/services/inference.service.js";
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

/**
 * Send a message and get an AI response from the loaded brain model.
 *
 * 1. Persist user message via IPC
 * 2. Attempt local inference via chat.brain slot
 * 3. Return both user message and AI response (or error)
 */
export async function sendMessageWithInference(
	content: string,
): Promise<{ userMessage: ChatMessage; aiResponse: string | null; error: string | null }> {
	// Step 1: persist user message
	const userMessage = await sendMessage(content);

	// Step 2: try local inference
	try {
		const response = await generateText("chat.brain", content, 256, 0.7);
		logInfo("chat", `AI response generated: ${response.length} chars`);
		return { userMessage, aiResponse: response, error: null };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logInfo("chat", `No AI response (model may not be loaded): ${msg}`);
		return { userMessage, aiResponse: null, error: msg };
	}
}
