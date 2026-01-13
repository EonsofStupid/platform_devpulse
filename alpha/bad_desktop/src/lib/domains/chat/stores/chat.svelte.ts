/**
 * Chat Store - Svelte 5 runes state management
 * Includes mode-based theming (Steam-like color shifts)
 */
import { sendMessage, getHistory } from '../services';
import type {
	ChatResult,
	Message,
	ChatMode,
	AssistantMode,
	PanelType,
	ConnectionStatus,
	ModeTheme
} from '../types';

// Re-export types for convenience
export type { ChatMode, AssistantMode, PanelType, ConnectionStatus, ModeTheme };

/** Theme config per assistant mode */
export const MODE_THEMES: Record<AssistantMode, ModeTheme> = {
	chat: { hue: 280, accentHue: 300, label: 'Chat', icon: '💬' },
	dev: { hue: 195, accentHue: 180, label: 'Dev', icon: '🔧' },
	image: { hue: 30, accentHue: 45, label: 'Image', icon: '🎨' },
	thinkspace: { hue: 220, accentHue: 250, label: 'Think', icon: '💭' },
	planning: { hue: 160, accentHue: 145, label: 'Plan', icon: '📋' },
	promptrecipe: { hue: 340, accentHue: 355, label: 'Recipe', icon: '🧪' }
};

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

	// Connection status (tethered state)
	connectionStatus = $state<ConnectionStatus>('disconnected');

	// Feature flags
	features = $state({
		streaming: true,
		voiceInput: false,
		voiceOutput: false,
		driftGuard: false
	});

	/** Current theme based on assistant mode */
	get theme(): ModeTheme {
		return MODE_THEMES[this.assistantMode];
	}

	/** CSS custom properties for current mode theme */
	get themeVars(): string {
		const t = this.theme;
		return `--chat-hue: ${t.hue}; --chat-accent-hue: ${t.accentHue};`;
	}

	/** Whether backend is connected */
	get isConnected(): boolean {
		return this.connectionStatus === 'connected';
	}

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
			// Mark as connected on successful response
			this.connectionStatus = 'connected';
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			// Remove user message on error
			this.messages = this.messages.filter((m) => m.id !== userMessage.id);
			// Mark connection error
			this.connectionStatus = 'error';
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
		this.connectionStatus = 'connecting';
		try {
			const history = await getHistory(100);
			if (history.length > 0) {
				this.messages = history;
				console.log(`[chat] Loaded ${history.length} messages from history`);
			}
			this.connectionStatus = 'connected';
		} catch (e) {
			console.error('[chat] Failed to load history:', e);
			this.connectionStatus = 'disconnected';
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

	// === Connection Management ===

	/**
	 * Set connection status (tethered state)
	 */
	setConnectionStatus(status: ConnectionStatus): void {
		this.connectionStatus = status;
	}

	/**
	 * Mark as connected after successful operation
	 */
	markConnected(): void {
		this.connectionStatus = 'connected';
	}

	/**
	 * Mark as disconnected on error
	 */
	markDisconnected(): void {
		this.connectionStatus = 'disconnected';
	}
}

export const chatStore = new ChatStore();
