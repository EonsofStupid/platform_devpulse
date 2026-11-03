/**
 * @file Memory state — your own notes and one project's, as last read. A late
 * answer for a project you have since left never replaces the one on screen.
 * @module @devpulse/domains/app/memory/data-access/memory.state
 */

import type { MemoryNote } from "$lib/sys/generated/bindings.js";
import * as service from "./memory.service.js";

function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export class MemoryState {
	yours = $state<MemoryNote[]>([]);
	project = $state<MemoryNote[]>([]);
	projectId = $state<string | null>(null);
	/** Nothing could be read: memory did not start. */
	unavailable = $state(false);
	/** A write was refused, in the engine's words. */
	problem = $state<string | null>(null);
	busy = $state(false);

	private generation = 0;

	/** Read your own notes. */
	async loadYours(): Promise<void> {
		try {
			this.yours = await service.notes(null);
			this.unavailable = false;
		} catch {
			this.unavailable = true;
		}
	}

	/** Show one project's notes. */
	async chooseProject(projectId: string | null): Promise<void> {
		const generation = ++this.generation;
		this.projectId = projectId;
		this.project = [];
		if (projectId === null) return;
		try {
			const notes = await service.notes(projectId);
			if (generation === this.generation) this.project = notes;
		} catch (error) {
			if (generation === this.generation) this.problem = message(error);
		}
	}

	/** Save a note in its place. Says whether it was saved. */
	async save(projectId: string | null, label: string, body: string): Promise<boolean> {
		return this.change(projectId, () => service.save(projectId, label, body));
	}

	/** Delete a note from its place. Says whether that went through. */
	async remove(projectId: string | null, label: string): Promise<boolean> {
		return this.change(projectId, () => service.remove(projectId, label));
	}

	private async change(projectId: string | null, write: () => Promise<unknown>): Promise<boolean> {
		this.busy = true;
		this.problem = null;
		try {
			await write();
			await this.reread(projectId);
			return true;
		} catch (error) {
			this.problem = message(error);
			return false;
		} finally {
			this.busy = false;
		}
	}

	private async reread(projectId: string | null): Promise<void> {
		if (projectId === null) {
			await this.loadYours();
		} else if (projectId === this.projectId) {
			await this.chooseProjectKeepingList(projectId);
		}
	}

	/** Read the shown project again without blanking its list first. */
	private async chooseProjectKeepingList(projectId: string): Promise<void> {
		const generation = ++this.generation;
		const notes = await service.notes(projectId);
		if (generation === this.generation) this.project = notes;
	}
}

export const memoryState = new MemoryState();
