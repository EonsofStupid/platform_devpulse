/**
 * @file Sessions sidebar state
 * @module @devpulse/domains/chat/data-access/sessions.state.svelte
 */

import type { ChatSession } from "$lib/sys/generated/bindings.js";
import * as chatService from "./chat.service.js";

class SessionsState {
	items = $state<ChatSession[]>([]);
	private generation = 0;
	loading = $state(false);
	error = $state<string | null>(null);

	async refresh(): Promise<void> {
		const generation = ++this.generation;
		this.loading = true;
		this.error = null;
		try {
			const items = await chatService.listSessions();
			if (generation === this.generation) this.items = items;
		} catch (e) {
			if (generation === this.generation) this.error = e instanceof Error ? e.message : String(e);
		} finally {
			if (generation === this.generation) this.loading = false;
		}
	}

	async delete(id: string): Promise<void> {
		await chatService.deleteSession(id);
		await this.refresh();
	}

	async clearAll(): Promise<void> {
		await chatService.clearAllChatHistory();
		await this.refresh();
	}
}

export const sessionsState = new SessionsState();
