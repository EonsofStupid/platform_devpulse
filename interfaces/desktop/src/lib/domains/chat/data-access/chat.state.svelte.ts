/**
 * @file Chat Domain Runes
 * @module @devpulse/domains/chat/runes
 *
 * Svelte 5 runes for chat state management.
 * Class-based singleton — matches DevPulseState pattern.
 * Domain boundary: calls service layer, never invoke() directly.
 */

import type { BlockChatMessage, ChatMessage, ChatThread } from "../util/chat.types.js";
import * as chatService from "./chat.service.js";

class ChatState {
	messages = $state<ChatMessage[]>([]);
	threads = $state<ChatThread[]>([
		{ id: "alpha", label: "ALPHA", active: true },
		{ id: "beta", label: "BETA", active: false },
		{ id: "gamma", label: "GAMMA", active: false },
	]);
	activeThreadId = $state<string>("alpha");
	loading = $state<boolean>(true);
	sending = $state<boolean>(false);
	error = $state<string | null>(null);

	/** Messages mapped to block format for ChatThread/ChatBubble components */
	get blockMessages(): BlockChatMessage[] {
		return this.messages.map((msg) => ({
			id: String(msg.id),
			variant: msg.role === "assistant" ? ("ai" as const) : ("user" as const),
			author: msg.role === "assistant" ? "Clyffy" : undefined,
			content: msg.content,
			timestamp: msg.created_at ? formatTime(msg.created_at) : undefined,
		}));
	}

	/** Currently active thread */
	get activeThread(): ChatThread | undefined {
		return this.threads.find((t) => t.id === this.activeThreadId);
	}

	/** Load messages from backend via service layer */
	async loadMessages(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			this.messages = await chatService.loadMessages();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/** Send a message via service layer */
	async sendMessage(content: string): Promise<void> {
		if (!content.trim() || this.sending) return;
		this.sending = true;
		try {
			const stored = await chatService.sendMessage(content.trim());
			this.messages = [...this.messages, stored];
		} catch (e) {
			const errorMsg: ChatMessage = {
				id: Date.now(),
				session_id: "",
				role: "assistant",
				content: `Error: ${e instanceof Error ? e.message : String(e)}`,
				created_at: Math.floor(Date.now() / 1000),
			};
			this.messages = [...this.messages, errorMsg];
		} finally {
			this.sending = false;
		}
	}

	/** Select a thread */
	selectThread(id: string): void {
		this.activeThreadId = id;
		this.threads = this.threads.map((t) => ({ ...t, active: t.id === id }));
	}
}

function formatTime(epoch: number): string {
	if (epoch === 0) return "";
	const date = new Date(epoch * 1000);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const chatState = new ChatState();
