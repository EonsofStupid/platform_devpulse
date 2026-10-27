/** @file Chat actions and retained failure copies over AgentHub's runtime snapshots. */
import { agenthubState } from "$lib/domains/agenthub/index.js";
import { projectsState } from "$lib/domains/app/projects/index.js";
import type {
	AgentThread,
	LiveSnapshot,
	PermissionChoice,
	ProviderId,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";

export type { AgentThread, PermissionChoice, ProviderId };
const LOG_TARGET = "domains.chat.agents";
const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Chat's presentation of one live agent turn. */
export interface RunningTurn {
	sessionId: string;
	text: string;
	tool: string | null;
	permission: { request: string; title: string; choices: PermissionChoice[] } | null;
}

/** A selectable copy; never presented as a saved history record. */
export interface RetainedAnswer {
	id: string;
	sessionId: string;
	text: string;
	message: string;
}

class AgentsStore {
	threads = $state<Record<string, AgentThread>>({});
	error = $state<string | null>(null);
	retained = $state<RetainedAnswer[]>([]);
	private watching = false;
	private seenFailures = new Set<string>();
	private refreshGeneration = 0;

	async initialize(): Promise<void> {
		if (!this.watching) {
			this.watching = true;
			agenthubState.observe((snapshot) => this.retainFailures(snapshot));
		}
		await agenthubState.connect();
	}

	private retainFailures(snapshot: LiveSnapshot): void {
		for (const turn of snapshot.conversations) {
			if (turn.place !== null || !turn.providerId || !turn.error || !turn.text) continue;
			const id = `${snapshot.epoch}:${turn.turnId}`;
			if (this.seenFailures.has(id)) continue;
			this.seenFailures.add(id);
			this.retained.push({ id, sessionId: turn.sessionId, text: turn.text, message: turn.error });
		}
	}

	running(sessionId: string | null): RunningTurn | null {
		const turn = agenthubState.conversation(sessionId);
		if (
			!turn ||
			!turn.providerId ||
			turn.activity === "idle" ||
			turn.projectId !== projectsState.activeProjectId
		)
			return null;
		return {
			sessionId: turn.sessionId,
			text: turn.text,
			tool: turn.tools.at(-1)?.title ?? null,
			permission: turn.permissions[0] ?? null,
		};
	}

	/** Dismiss only the in-window copy; repeated snapshots cannot resurrect it. */
	dismissRetained(id: string): void {
		this.retained = this.retained.filter((answer) => answer.id !== id);
	}

	/** The thread a chat session is, if it is one. */
	thread(sessionId: string | null): AgentThread | null {
		const thread = sessionId ? this.threads[sessionId] : null;
		return thread?.projectId === projectsState.activeProjectId ? thread : null;
	}

	/** Load a project's threads. */
	async refresh(projectId: string): Promise<void> {
		const generation = ++this.refreshGeneration;
		const current = () =>
			generation === this.refreshGeneration && projectId === projectsState.activeProjectId;
		try {
			const result = await commands.agentThreads(projectId);
			if (!current()) return;
			if (result.status === "error") {
				this.error = result.error;
				return;
			}
			this.threads = Object.fromEntries(result.data.map((t) => [t.sessionId, t]));
		} catch (e) {
			if (current()) this.error = message(e);
		}
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

	/** Dispatch only; authoritative snapshots govern the running state and completion. */
	async prompt(sessionId: string, text: string): Promise<void> {
		this.error = null;
		await this.initialize();
		if (!agenthubState.ready) {
			this.error = agenthubState.error;
			return;
		}
		try {
			const result = await commands.agentPrompt(sessionId, text);
			if (result.status === "error") throw new Error(result.error);
		} catch (error) {
			this.error = message(error);
			logError(LOG_TARGET, `agentPrompt failed ? ${this.error}`);
		}
		await agenthubState.refresh();
	}

	async cancel(sessionId: string): Promise<void> {
		await commands.agentCancel(sessionId);
		await agenthubState.refresh();
	}

	async answer(sessionId: string, request: string, choice: string | null): Promise<void> {
		const turn = agenthubState.conversation(sessionId);
		if (!turn?.permissions.some((permission) => permission.request === request)) return;
		const result = await commands.agentAnswer(sessionId, request, choice);
		if (result.status === "error") this.error = result.error;
		await agenthubState.refresh();
	}
}

export const agentsState = new AgentsStore();
