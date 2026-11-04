/** @file Retained runtime snapshots, shared by chat and the forthcoming board. */
import type { LiveSnapshot } from "$lib/sys/generated/bindings.js";
import * as service from "./agenthub.service.js";

export class AgentHubStore {
	current = $state<LiveSnapshot | null>(null);
	ready = $state(false);
	error = $state<string | null>(null);
	private listening: Promise<void> | null = null;
	private loading: Promise<void> | null = null;
	private pending = false;
	private wantedEpoch: string | null = null;
	private listeners = new Set<(snapshot: LiveSnapshot) => void>();

	/** Register before connecting, including in a newly opened window. */
	observe(listener: (snapshot: LiveSnapshot) => void): () => void {
		this.listeners.add(listener);
		if (this.ready && this.current) listener(this.current);
		return () => this.listeners.delete(listener);
	}

	async connect(): Promise<void> {
		this.listening ??= service
			.onChanged((change) => {
				if (this.current?.epoch === change.epoch && this.current.revision >= change.revision)
					return;
				this.wantedEpoch = change.epoch;
				void this.refresh();
			})
			.then(() => undefined)
			.catch((error: unknown) => {
				this.listening = null;
				throw error;
			});
		try {
			await this.listening;
			await this.refresh();
		} catch (error) {
			this.ready = false;
			this.error = error instanceof Error ? error.message : String(error);
		}
	}

	/** At most one IPC read in flight; invalidations during it schedule one more. */
	refresh(): Promise<void> {
		this.pending = true;
		if (this.loading) return this.loading;
		this.loading = this.load().finally(() => {
			this.loading = null;
		});
		return this.loading;
	}

	private async load(): Promise<void> {
		while (this.pending) {
			this.pending = false;
			try {
				const announcedEpoch = this.wantedEpoch;
				const snapshot = await service.snapshot();
				if (this.wantedEpoch !== announcedEpoch && snapshot.epoch !== this.wantedEpoch) continue;
				if (this.current?.epoch === snapshot.epoch && snapshot.revision < this.current.revision)
					continue;
				this.current = snapshot;
				this.wantedEpoch = snapshot.epoch;
				this.ready = true;
				this.error = null;
				for (const listener of this.listeners) listener(snapshot);
			} catch (error) {
				this.ready = false;
				this.error = error instanceof Error ? error.message : String(error);
				this.pending = false;
			}
		}
	}

	/** The places of a room at work now. */
	places(sessionId: string | null) {
		if (!this.ready || !sessionId) return [];
		return (
			this.current?.conversations.filter(
				(turn) => turn.sessionId === sessionId && turn.place !== null && turn.activity !== "idle",
			) ?? []
		);
	}

	conversation(sessionId: string | null) {
		if (!this.ready || !sessionId) return null;
		return (
			this.current?.conversations.find(
				(turn) => turn.sessionId === sessionId && turn.place === null,
			) ?? null
		);
	}
}

export const agenthubState = new AgentHubStore();
