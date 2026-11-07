/**
 * Chat Store - Svelte 5 runes state management for chat
 */
import { sendMessage, getHistory, type ChatResult, type Message } from '$lib/api';

export type ChatMode = 'closed' | 'minimized' | 'open';
export type AssistantMode = 'chat' | 'dev' | 'image' | 'thinkspace' | 'planning' | 'promptrecipe';
export type PanelType = 'dev' | 'plan' | 'training' | 'personality' | 'gallery';

class ChatStore {
	messages = $state<Message[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	sessionId = $state<string>('default');

	// ChatOverlay state
	mode = $state<ChatMode>('minimized');
	hasUnread = $state(false);

	// Panel management
	activePanels = $state<PanelType[]>([]);
	assistantMode = $state<AssistantMode>('chat');

	// Feature flags
	features = $state({
		streaming: true,
		voiceInput: false,
		voiceOutput: false,
		driftGuard: false
	});

	/**
	 * Send a message and get a response
	 */
	async send(content: string): Promise<void> {
		if (!content.trim()) return;

		this.loading = true;
		this.error = null;

		// Add user message immediately
		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: content.trim(),
			timestamp: Date.now()
		};
		this.messages.push(userMessage);

		try {
			const result: ChatResult = await sendMessage(content);

			// Add assistant response
			const assistantMessage: Message = {
				id: crypto.randomUUID(),
				role: 'assistant',
				content: result.message,
				timestamp: Date.now(),
				tokens_used: result.tokens_used,
				is_stub: result.is_stub
			};
			this.messages.push(assistantMessage);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			// Remove user message on error
			this.messages = this.messages.filter((m) => m.id !== userMessage.id);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Clear all messages
	 */
	clear(): void {
		this.messages = [];
		this.error = null;
	}

	/**
	 * Start a new session
	 */
	newSession(): void {
		this.sessionId = crypto.randomUUID();
		this.clear();
	}

	/**
	 * Initialize chat - load history from database
	 * Call this on app startup to restore chat state
	 */
	async init(): Promise<void> {
		try {
			const history = await getHistory(100);
			if (history.length > 0) {
				this.messages = history;
				console.log(`[chat] Loaded ${history.length} messages from history`);
			}
		} catch (e) {
			console.error('[chat] Failed to load history:', e);
			// Non-fatal - continue with empty chat
		}
	}

	/**
	 * Reload history from database
	 */
	async loadHistory(): Promise<void> {
		await this.init();
	}

	// === ChatOverlay Controls ===

	/**
	 * Open the chat overlay panel
	 */
	open(): void {
		this.mode = 'open';
		this.hasUnread = false;
	}

	/**
	 * Minimize chat to FAB
	 */
	minimize(): void {
		this.mode = 'minimized';
	}

	/**
	 * Close chat completely
	 */
	close(): void {
		this.mode = 'closed';
	}

	/**
	 * Mark as having unread messages (for FAB notification)
	 */
	markUnread(): void {
		if (this.mode !== 'open') {
			this.hasUnread = true;
		}
	}

	// === Panel Management ===

	/**
	 * Open a panel
	 */
	openPanel(type: PanelType): void {
		if (!this.activePanels.includes(type)) {
			this.activePanels = [...this.activePanels, type];
		}
	}

	/**
	 * Close a panel
	 */
	closePanel(type: PanelType): void {
		this.activePanels = this.activePanels.filter((p) => p !== type);
	}

	/**
	 * Set assistant mode (auto-spawns related panels)
	 */
	setAssistantMode(mode: AssistantMode): void {
		this.assistantMode = mode;
		// Auto-spawn panels based on mode
		if (mode === 'dev') this.openPanel('dev');
		if (mode === 'planning') this.openPanel('plan');
	}

	/**
	 * Toggle a feature flag
	 */
	toggleFeature(feature: keyof typeof this.features): void {
		this.features[feature] = !this.features[feature];
	}
}

export const chatStore = new ChatStore();
