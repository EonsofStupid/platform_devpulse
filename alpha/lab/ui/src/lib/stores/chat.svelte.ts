// Chat Store - Svelte 5 runes for chat history and messaging

import * as api from '$lib/api/chat';

class ChatStore {
	sessions = $state<api.ChatSession[]>([]);
	activeSessionId = $state<string | null>(null);
	messages = $state<api.ChatMessage[]>([]);
	loading = $state(false);
	sending = $state(false);
	error = $state<string | null>(null);

	// Input state
	inputText = $state('');

	get activeSession() {
		return this.sessions.find((s) => s.id === this.activeSessionId) ?? null;
	}

	get hasMessages() {
		return this.messages.length > 0;
	}

	async loadSessions() {
		this.loading = true;
		this.error = null;
		try {
			this.sessions = await api.getSessions();
			// Auto-select first session if none selected
			if (!this.activeSessionId && this.sessions.length > 0) {
				this.activeSessionId = this.sessions[0].id;
				await this.loadHistory();
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load sessions';
		} finally {
			this.loading = false;
		}
	}

	async loadHistory() {
		if (!this.activeSessionId) return;

		this.loading = true;
		this.error = null;
		try {
			this.messages = await api.getHistory(this.activeSessionId);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load history';
		} finally {
			this.loading = false;
		}
	}

	async createSession() {
		this.loading = true;
		this.error = null;
		try {
			const session = await api.createSession();
			this.sessions = [session, ...this.sessions];
			this.activeSessionId = session.id;
			this.messages = [];
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to create session';
		} finally {
			this.loading = false;
		}
	}

	async selectSession(sessionId: string) {
		this.activeSessionId = sessionId;
		await this.loadHistory();
	}

	async sendMessage(content?: string) {
		const text = content ?? this.inputText.trim();
		if (!text || !this.activeSessionId) return;

		this.sending = true;
		this.error = null;
		try {
			const response = await api.sendMessage(this.activeSessionId, text);
			this.messages = [...this.messages, response];
			this.inputText = '';
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to send message';
		} finally {
			this.sending = false;
		}
	}
}

export const chatStore = new ChatStore();
