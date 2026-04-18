/**
 * @file Chat rune singleton — active session + messages + streaming inference
 * @module @devpulse/domains/chat/data-access/chat.state.svelte
 */

import { devpulseState } from "$lib/domains/app/devpulse/index.js";
import {
	generateText,
	isInferenceReady,
	modelsState,
	onInferenceToken,
} from "$lib/domains/app/models/index.js";
import type { ChatMessage } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
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

	// ── Streaming inference state ───────────────────────
	isGenerating = $state(false);
	streamingContent = $state("");
	generatingTokens = $state(0);

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

	/** Store user turn only (legacy path, no inference). */
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

	/**
	 * Send user message, run brain inference, store assistant response.
	 * Streams tokens into `streamingContent` for real-time UI.
	 */
	async generateResponse(content: string): Promise<void> {
		const pid = this.projectId();
		if (!pid || !content.trim() || this.sending || this.isGenerating) return;

		// Check brain is loaded
		const brainStatus = modelsState.statuses["chat.brain"];
		if (!brainStatus || !isInferenceReady(brainStatus)) {
			this.error = "No AI brain loaded. Open Model Control in the sidebar to load a model first.";
			return;
		}

		this.error = null;
		this.sending = true;

		// 1. Store user turn
		let userTurn: ChatMessage;
		try {
			userTurn = await chatService.sendMessage(pid, content.trim());
			this.messages = [...this.messages, userTurn];
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			this.sending = false;
			return;
		}

		// 2. Start streaming inference
		this.sending = false;
		this.isGenerating = true;
		this.streamingContent = "";
		this.generatingTokens = 0;

		const unlistenTokens = onInferenceToken((text) => {
			this.streamingContent += text;
			this.generatingTokens++;
		});

		const startMs = performance.now();

		try {
			logInfo("chat", `generateResponse: starting inference on chat.brain`);
			const fullText = await generateText("chat.brain", content.trim(), 512, 0.7);
			const latencyMs = Math.round(performance.now() - startMs);

			logInfo(
				"chat",
				`generateResponse: complete — ${this.generatingTokens} tokens, ${latencyMs}ms`,
			);

			// 3. Store assistant turn
			const assistantTurn = await chatService.storeAssistantTurn(
				userTurn.session_id,
				pid,
				fullText,
				this.generatingTokens,
				"chat.brain",
				latencyMs,
			);
			this.messages = [...this.messages, assistantTurn];
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError("chat", `generateResponse: failed — ${msg}`);
		} finally {
			unlistenTokens();
			this.isGenerating = false;
			this.streamingContent = "";
			this.generatingTokens = 0;
		}
	}

	setActiveSession(id: string | null): void {
		this.activeSessionId = id;
	}
}

export const chatState = new ChatState();
