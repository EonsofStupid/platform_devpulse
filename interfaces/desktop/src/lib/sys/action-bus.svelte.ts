/**
 * @file action-bus.svelte.ts
 * @description Single primitive for user-initiated IPC — HUD + structured action.jsonl.
 */

import type { ActionId } from "./action-ids.js";
import { log, setActiveRunId } from "./logger.js";

const RING_MAX = 200;

export type ActionPhase = "start" | "end" | "error";

export interface ActionEventStart {
	phase: "start";
	id: ActionId;
	runId: string;
	intent: string;
	t: number;
}

export interface ActionEventEnd {
	phase: "end";
	id: ActionId;
	runId: string;
	elapsedMs: number;
	t: number;
}

export interface ActionEventError {
	phase: "error";
	id: ActionId;
	runId: string;
	elapsedMs: number;
	error: string;
	t: number;
}

export type ActionEvent = ActionEventStart | ActionEventEnd | ActionEventError;

export interface ActionCurrent {
	id: ActionId;
	intent: string;
	runId: string;
	startedAt: number;
}

export interface ActionRecentEntry {
	id: ActionId;
	intent: string;
	runId: string;
	elapsedMs: number;
	ok: boolean;
}

class ActionBus {
	current = $state<ActionCurrent | null>(null);
	recent = $state<ActionRecentEntry[]>([]);
	lastError = $state<{ message: string; at: number } | null>(null);

	pushRecent(entry: ActionRecentEntry): void {
		const next = [...this.recent, entry];
		if (next.length > RING_MAX) {
			next.splice(0, next.length - RING_MAX);
		}
		this.recent = next;
	}

	setLastError(message: string): void {
		this.lastError = { message, at: Date.now() };
	}

	clearLastError(): void {
		this.lastError = null;
	}
}

export const actionBus = new ActionBus();

function emitAction(event: ActionEvent): void {
	log("info", "action", JSON.stringify(event));
}

/**
 * Wrap a user-initiated async IPC call — updates HUD, action.jsonl, and error surface.
 */
export async function withAction<T>(
	id: ActionId,
	intent: string,
	fn: () => Promise<T>,
): Promise<T> {
	const runId = crypto.randomUUID();
	const startedAt = performance.now();
	emitAction({ phase: "start", id, runId, intent, t: Date.now() });
	actionBus.current = { id, intent, runId, startedAt };

	// Set active runId so ALL log calls within this action include it
	// for correlation across session JSONL, DuckDB spans, and OTel traces.
	const previousRunId = setActiveRunId(runId);

	try {
		const result = await fn();
		const elapsedMs = Math.round(performance.now() - startedAt);
		emitAction({ phase: "end", id, runId, elapsedMs, t: Date.now() });
		actionBus.pushRecent({ id, intent, runId, elapsedMs, ok: true });
		actionBus.current = null;
		setActiveRunId(previousRunId);
		return result;
	} catch (e) {
		const elapsedMs = Math.round(performance.now() - startedAt);
		const error = e instanceof Error ? e.message : String(e);
		emitAction({ phase: "error", id, runId, elapsedMs, error, t: Date.now() });
		actionBus.pushRecent({ id, intent, runId, elapsedMs, ok: false });
		actionBus.setLastError(error);
		actionBus.current = null;
		setActiveRunId(previousRunId);
		throw e;
	}
}
