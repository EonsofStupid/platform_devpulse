/**
 * @file agentsState — your threads with your agents, in the chat.
 * @module @devpulse/domains/chat/data-access/agents.state
 *
 * Rust holds each thread's live conversation (`agents` service); a turn's
 * events arrive as the `agent-streamed` event and fill `turn` while it runs.
 * Both sides of every turn are saved in the chat's turns, so the stream
 * reloads them when the turn ends. Nothing here decides anything; a refusal
 * keeps Rust's message in `error`.
 */

import type {
	AgentEvent,
	AgentThread,
	PermissionChoice,
	ProviderId,
} from "$lib/sys/generated/bindings.js";
import { commands, events } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";

export type { AgentThread, PermissionChoice, ProviderId };

const LOG_TARGET = "domains.chat.agents";

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** What the running turn has shown so far. */
export interface RunningTurn {
	sessionId: string;
	text: string;
	/** The tool the agent is using now, in its words. */
	tool: string | null;
	/** A permission it is waiting for. */
	permission: { request: string; title: string; choices: PermissionChoice[] } | null;
}

class AgentsStore {
	/** The active project's threads, by session id. */
	threads = $state<Record<string, AgentThread>>({});
	turn = $state<RunningTurn | null>(null);
	error = $state<string | null>(null);
	private listening: Promise<unknown> | null = null;
	/** Resolves a prompt when its turn ends. */
	private ending = new Map<string, () => void>();

	/** Listen to the turns' events once. */
	private listen(): Promise<unknown> {
		this.listening ??= events.agentStreamed.listen((e) =>
			this.apply(e.payload.sessionId, e.payload.event),
		);
		return this.listening;
	}

	private apply(sessionId: string, event: AgentEvent): void {
		const turn = this.turn;
		if (!turn || turn.sessionId !== sessionId) return;
		switch (event.kind) {
			case "text":
				turn.text += event.text;
				turn.tool = null;
				break;
			case "tool":
				if (event.title) turn.tool = event.title;
				if (event.status === "done" || event.status === "failed") turn.tool = null;
				break;
			case "permissionAsked":
				turn.permission = {
					request: event.request,
					title: event.title,
					choices: event.choices,
				};
				break;
			case "failed":
				this.error = event.message;
				this.finish(sessionId);
				break;
			case "turnEnded":
				this.finish(sessionId);
				break;
			default:
				break;
		}
	}

	private finish(sessionId: string): void {
		this.turn = null;
		this.ending.get(sessionId)?.();
		this.ending.delete(sessionId);
	}

	/** The thread a chat session is, if it is one. */
	thread(sessionId: string | null): AgentThread | null {
		return sessionId ? (this.threads[sessionId] ?? null) : null;
	}

	/** Load a project's threads. */
	async refresh(projectId: string): Promise<void> {
		const result = await commands.agentThreads(projectId);
		if (result.status === "error") {
			this.error = result.error;
			return;
		}
		this.threads = Object.fromEntries(result.data.map((t) => [t.sessionId, t]));
	}

	/** Start a thread with an agent; resolves to its session id. */
	async start(projectId: string, providerId: ProviderId): Promise<string | null> {
		this.error = null;
		const result = await commands.agentThreadStart(projectId, providerId);
		if (result.status === "error") {
			this.error = result.error;
			logError(LOG_TARGET, `agentThreadStart failed — ${result.error}`);
			return null;
		}
		this.threads = { ...this.threads, [result.data.sessionId]: result.data };
		return result.data.sessionId;
	}

	/** Send a prompt; resolves when the turn has ended (saved by Rust). */
	async prompt(sessionId: string, text: string): Promise<void> {
		this.error = null;
		await this.listen();
		this.turn = { sessionId, text: "", tool: null, permission: null };
		const ended = new Promise<void>((resolve) => this.ending.set(sessionId, resolve));
		try {
			const result = await commands.agentPrompt(sessionId, text);
			if (result.status === "error") throw new Error(result.error);
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `agentPrompt failed — ${this.error}`);
			this.finish(sessionId);
		}
		await ended;
	}

	/** Stop the running turn. */
	async cancel(): Promise<void> {
		const turn = this.turn;
		if (turn) await commands.agentCancel(turn.sessionId);
	}

	/** Answer the waiting permission request (`null` refuses). */
	async answer(choice: string | null): Promise<void> {
		const turn = this.turn;
		const permission = turn?.permission;
		if (!turn || !permission) return;
		turn.permission = null;
		const result = await commands.agentAnswer(turn.sessionId, permission.request, choice);
		if (result.status === "error") this.error = result.error;
	}
}

export const agentsState = new AgentsStore();
