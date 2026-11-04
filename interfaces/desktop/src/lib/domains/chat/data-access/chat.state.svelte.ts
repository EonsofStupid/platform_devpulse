/**
 * @file Chat rune singleton — active session + messages + streaming inference
 * @module @devpulse/domains/chat/data-access/chat.state.svelte
 */

import {
	generateText,
	isInferenceReady,
	modelsState,
	onInferenceToken,
} from "#lib/domains/app/models/index.js";
import { projectsState } from "#lib/domains/app/projects/index.js";
import { providersState } from "#lib/domains/app/providers/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import type { ChatMessage, SavedConnection, TextTarget } from "#lib/sys/generated/bindings.js";
import { logError } from "#lib/sys/logger.js";
import { globalState } from "#lib/sys/runes/global.svelte.js";
import type { ChatMode } from "../util/chat.types.js";
import { splitContractBlock, toBlockMessage } from "../util/format.js";
import { findRole, placeKey } from "../util/room-seating.js";
import { agentsState } from "./agents.state.svelte.js";
import * as chatService from "./chat.service.js";
import { roomsState } from "./rooms.state.svelte.js";
import { sessionsState } from "./sessions.state.svelte.js";

/** The display name of an agent that answered, from Rust's providers report. */
function agentName(modelUsed: string | null): string | null {
	if (!modelUsed) return null;
	return providersState.current?.report?.providers.find((p) => p.id === modelUsed)?.name ?? null;
}

class ChatState {
	messages = $state<ChatMessage[]>([]);
	sending = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);
	activeSessionId = $state<string | null>(null);
	private loadGeneration = 0;
	private selectionGeneration = 0;
	private routedProject: string | null = null;
	endpoint = $state<TextTarget | null>(null);
	routingReady = $state(false);
	endpointRequest = $state<{ project: string; session: string; request: string } | null>(null);
	private generatingSession = $state<string | null>(null);
	private generatingProject = $state<string | null>(null);
	get generatingHere(): boolean {
		return (
			this.isGenerating &&
			this.generatingSession === this.activeSessionId &&
			this.generatingProject === this.projectId()
		);
	}
	get canStopEndpoint(): boolean {
		return (
			!!this.endpointRequest &&
			this.endpointRequest.session === this.activeSessionId &&
			this.endpointRequest.project === this.projectId()
		);
	}
	get readOnly(): boolean {
		return sessionsState.items.some(
			(session) => session.id === this.activeSessionId && session.endedAt !== null,
		);
	}

	// ── Streaming inference state ───────────────────────
	isGenerating = $state(false);
	streamingContent = $state("");

	/** Messages as the stream shows them; an agent's answers carry its name. */
	blockMessages = $derived.by(() =>
		this.messages.map((m) => {
			const block = toBlockMessage(m);
			if (m.room?.kind === "outcome") return { ...block, outcome: m.room.outcome };
			if (m.room?.kind === "turn") {
				const { prose, structured } = splitContractBlock(m.content);
				return {
					...block,
					author: this.roomPlaceLabel(m.room.turn.place),
					content: prose,
					structured: structured ?? undefined,
					structuredLabel: copyState.catalog?.chat.rooms.structured,
				};
			}
			const agent =
				m.role === "assistant"
					? this.endpoint
						? `${this.endpoint.label} / ${m.modelUsed ?? this.endpoint.model}`
						: agentName(m.modelUsed)
					: null;
			return agent ? { ...block, author: agent } : block;
		}),
	);

	/** A place of the room on screen, as you know it: its role and agent. */
	roomPlaceLabel(place: string): string {
		const thread = roomsState.thread(this.activeSessionId);
		const room = thread ? roomsState.spec(thread.roomId) : null;
		const roles = roomsState.library?.roles ?? [];
		const assignment = thread?.seating.find((a) => placeKey(a.seat, a.place) === place);
		const seat = room?.seats.find((candidate) => candidate.seat === assignment?.seat);
		if (!assignment || !seat) return place;
		const role = findRole(roles, assignment.role ?? seat.role);
		const agent = agentName(assignment.provider) ?? assignment.provider;
		return role ? `${role.name} · ${agent}` : `${place} · ${agent}`;
	}

	get mode(): ChatMode {
		return globalState.chat_mode;
	}

	setMode(mode: ChatMode): void {
		globalState.setMode(mode);
	}

	/** The project you are working in (Rust's active project). */
	projectId(): string | null {
		return projectsState.activeProjectId;
	}

	async loadActive(): Promise<void> {
		const generation = ++this.loadGeneration;
		const sessionId = this.activeSessionId;
		this.loading = true;
		this.routingReady = false;
		this.endpoint = null;
		this.error = null;
		const pid = this.projectId();
		if (pid !== this.routedProject) {
			this.messages = [];
			this.streamingContent = "";
		}
		if (!pid) {
			this.messages = [];
			this.error = "No active project — open a project from the DevPulse hub.";
			this.loading = false;
			return;
		}
		const current = () =>
			generation === this.loadGeneration &&
			pid === this.projectId() &&
			sessionId === this.activeSessionId;
		try {
			const [messages, endpoint] = await Promise.all([
				chatService.loadRecent(pid, sessionId),
				chatService.endpointTarget(pid, sessionId),
			]);
			if (current()) {
				this.messages = messages;
				this.endpoint = endpoint;
				this.routedProject = pid;
				this.routingReady = true;
			}
		} catch (e) {
			if (current()) this.error = e instanceof Error ? e.message : String(e);
		} finally {
			if (generation === this.loadGeneration) this.loading = false;
		}
	}

	/** Start only after the person chooses a saved connection and a model. */
	async startEndpoint(connection: SavedConnection, model: string): Promise<void> {
		const project = this.projectId();
		if (!project || this.sending || this.isGenerating) return;
		const generation = this.selectionGeneration;
		this.sending = true;
		this.error = null;
		try {
			const session = await chatService.startEndpoint(
				project,
				connection.id,
				connection.revision,
				model,
			);
			if (project === this.projectId() && generation === this.selectionGeneration) {
				this.setActiveSession(session);
				await this.loadActive();
			}
			await sessionsState.refresh();
		} catch (error) {
			if (project === this.projectId() && generation === this.selectionGeneration)
				this.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.sending = false;
		}
	}

	/** Route only after the engine has resolved the selected conversation. */
	async generateResponse(content: string): Promise<void> {
		const project = this.projectId();
		if (
			!project ||
			!content.trim() ||
			this.sending ||
			this.isGenerating ||
			this.loading ||
			this.readOnly
		)
			return;
		if (!this.routingReady || this.routedProject !== project) {
			await this.loadActive();
			return;
		}
		if (this.endpoint && this.activeSessionId) {
			await this.askEndpoint(project, this.activeSessionId, content.trim());
			return;
		}
		if (agentsState.thread(this.activeSessionId)) {
			if (!agentsState.running(this.activeSessionId)) await this.askAgent(content.trim());
			return;
		}
		if (roomsState.thread(this.activeSessionId)) {
			if (!roomsState.answering(this.activeSessionId)) await this.askRoom(content.trim());
			return;
		}
		const brainStatus = modelsState.statuses["chat.brain"];
		if (!brainStatus || !isInferenceReady(brainStatus)) {
			this.error = "No AI brain loaded. Open Model Control in the sidebar to load a model first.";
			return;
		}
		const generation = this.selectionGeneration;
		let session = this.activeSessionId;
		const current = () =>
			project === this.projectId() &&
			generation === this.selectionGeneration &&
			session === this.activeSessionId;
		this.error = null;
		this.sending = true;
		let unlisten: (() => void) | undefined;
		try {
			const user = await chatService.sendMessage(project, session, content.trim());
			if (current()) {
				this.activeSessionId = user.sessionId;
				session = user.sessionId;
				this.messages = [...this.messages, user];
			}
			this.sending = false;
			this.isGenerating = true;
			this.generatingSession = user.sessionId;
			this.generatingProject = project;
			this.streamingContent = "";
			unlisten = onInferenceToken((text) => {
				if (current()) this.streamingContent += text;
			});
			const started = performance.now();
			const answer = await generateText("chat.brain", content.trim(), 512, 0.7);
			const stored = await chatService.storeAssistantTurn(
				user.sessionId,
				project,
				answer,
				null,
				"chat.brain",
				Math.round(performance.now() - started),
			);
			if (current()) this.messages = [...this.messages, stored];
		} catch (error) {
			if (current()) this.error = error instanceof Error ? error.message : String(error);
			logError("chat", `generateResponse: failed: ${String(error)}`);
		} finally {
			unlisten?.();
			this.sending = false;
			this.isGenerating = false;
			this.streamingContent = "";
			await sessionsState.refresh();
		}
	}

	private async askEndpoint(project: string, session: string, content: string): Promise<void> {
		const request = crypto.randomUUID();
		const current = () => project === this.projectId() && session === this.activeSessionId;
		this.endpointRequest = { project, session, request };
		this.generatingSession = session;
		this.generatingProject = project;
		this.isGenerating = true;
		this.error = null;
		this.streamingContent = "";
		this.messages = [
			...this.messages,
			{
				id: `pending-${request}`,
				sessionId: session,
				role: "user",
				content,
				createdAt: Math.floor(Date.now() / 1000),
				tokenCount: null,
				modelUsed: null,
				latencyMs: null,
			},
		];
		let failure: string | null = null;
		try {
			await chatService.promptEndpoint(project, session, request, content, (delta) => {
				if (current() && this.endpointRequest?.request === request) this.streamingContent += delta;
			});
		} catch (error) {
			failure = error instanceof Error ? error.message : String(error);
		} finally {
			this.endpointRequest = null;
			this.isGenerating = false;
			this.streamingContent = "";
			if (current()) {
				await this.loadActive();
				if (current() && failure) this.error = failure;
			}
			await sessionsState.refresh();
		}
	}

	async stopEndpoint(): Promise<void> {
		const turn = this.endpointRequest;
		if (!turn) return;
		try {
			await chatService.cancelEndpoint(turn.project, turn.session, turn.request);
		} catch (error) {
			if (this.endpointRequest === turn && this.canStopEndpoint)
				this.error = error instanceof Error ? error.message : String(error);
		}
	}

	/**
	 * Send a message on an agent thread. Rust saves both sides of the turn;
	 * the stream shows the turn as it runs and reloads the saved turns when
	 * it ends. Dispatch waits only for acceptance; AgentHub owns live state.
	 */
	private async askAgent(content: string): Promise<void> {
		const sessionId = this.activeSessionId;
		if (!sessionId) return;
		const projectId = this.projectId();
		this.error = null;
		this.sending = true;
		this.messages = [
			...this.messages,
			{
				id: `pending-${Date.now()}`,
				sessionId,
				role: "user",
				content,
				createdAt: Math.floor(Date.now() / 1000),
				tokenCount: null,
				modelUsed: null,
				latencyMs: null,
			},
		];
		try {
			await agentsState.prompt(sessionId, content);
		} finally {
			this.sending = false;
			if (this.activeSessionId === sessionId && this.projectId() === projectId) {
				await this.loadActive();
				if (
					this.activeSessionId === sessionId &&
					this.projectId() === projectId &&
					agentsState.error
				)
					this.error = agentsState.error;
			}
		}
	}

	/** Send a question to a room. Rust saves it and every turn; the room's events reload them. */
	private async askRoom(content: string): Promise<void> {
		const sessionId = this.activeSessionId;
		if (!sessionId) return;
		this.error = null;
		this.messages = [
			...this.messages,
			{
				id: `pending-${Date.now()}`,
				sessionId,
				role: "user",
				content,
				createdAt: Math.floor(Date.now() / 1000),
				tokenCount: null,
				modelUsed: null,
				latencyMs: null,
			},
		];
		await roomsState.ask(sessionId, content);
	}

	setActiveSession(id: string | null): void {
		if (this.activeSessionId === id) return;
		++this.loadGeneration;
		++this.selectionGeneration;
		this.endpoint = null;
		this.routingReady = false;
		this.streamingContent = "";
		this.activeSessionId = id;
		this.messages = [];
		this.error = null;
		this.loading = false;
	}
}

export const chatState = new ChatState();
