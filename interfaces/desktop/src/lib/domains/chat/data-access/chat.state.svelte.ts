/**
 * @file Chat rune singleton — active session + messages
 * @module @devpulse/domains/chat/data-access/chat.state.svelte
 */

import { devpulseState } from "$lib/domains/app/devpulse/index.js";
import type { ChatMessage } from "$lib/sys/generated/bindings.js";
import { globalState } from "$lib/sys/runes/global.svelte.js";
import type { ChatMode } from "../util/chat.types.js";
import { toBlockMessage } from "../util/format.js";
import * as chatService from "./chat.service.js";

class ChatState {
	messages = $state<ChatMessage[]>([]);
	sending = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);
	activeSessionId = $state<string | null>(null);

	blockMessages = $derived.by(() => this.messages.map(toBlockMessage));

	get mode(): ChatMode {
		return globalState.chat_mode;
	}

	setMode(mode: ChatMode): void {
		globalState.setMode(mode);
	}

	projectId(): string | null {
		return devpulseState.data.recentProjects[0]?.id ?? null;
	}

	async loadActive(): Promise<void> {
		this.loading = true;
		this.error = null;
		const pid = this.projectId();
		if (!pid) {
			this.messages = [];
			this.error = "No active project — open a project from the DevPulse hub.";
			this.loading = false;
			return;
		}
		try {
			this.messages = await chatService.loadRecent(pid, this.activeSessionId);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	async send(content: string): Promise<void> {
		const pid = this.projectId();
		if (!pid || !content.trim() || this.sending) return;
		this.sending = true;
		this.error = null;
		try {
			const stored = await chatService.sendMessage(pid, content.trim());
			this.messages = [...this.messages, stored];
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.sending = false;
		}
	}

	setActiveSession(id: string | null): void {
		this.activeSessionId = id;
	}
}

export const chatState = new ChatState();
