/**
 * @file Memory state — your own notes and one project's, as last read. A late
 * answer for a project you have since left never replaces the one on screen.
 * @module @devpulse/domains/app/memory/data-access/memory.state
 */

import type { MemoryNote, MemorySave, MemorySending } from "$lib/sys/generated/bindings.js";
import * as service from "./memory.service.js";

function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export class MemoryState {
	yours = $state<MemoryNote[]>([]);
	project = $state<MemoryNote[]>([]);
	projectId = $state<string | null>(null);
	/** What goes with a session in the shown project. */
	sending = $state<MemorySending | null>(null);
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
		this.sending = null;
		if (projectId === null) return;
		try {
			const [notes, sending] = await Promise.all([
				service.notes(projectId),
				service.sending(projectId),
			]);
			if (generation === this.generation) {
				this.project = notes;
				this.sending = sending;
			}
		} catch (error) {
			if (generation === this.generation) this.problem = message(error);
		}
	}

	/** Save a note in its place. `null` when it was refused, with `problem` saying why. */
	async save(
		projectId: string | null,
		label: string,
		body: string,
		expectedVersion: number | null,
		include: boolean,
	): Promise<MemorySave | null> {
		return this.change(projectId, () =>
			service.save(projectId, label, body, expectedVersion, include),
		);
	}

	/** Choose whether a note goes with every session. `null` as for `save`. */
	async setIncluded(
		projectId: string | null,
		label: string,
		version: number,
		include: boolean,
	): Promise<MemorySave | null> {
		return this.change(projectId, () => service.setIncluded(projectId, label, version, include));
	}

	/** Delete a note from its place. Says whether that went through. */
	async remove(projectId: string | null, label: string): Promise<boolean> {
		return (await this.change(projectId, () => service.remove(projectId, label))) !== null;
	}

	private async change<T>(projectId: string | null, write: () => Promise<T>): Promise<T | null> {
		this.busy = true;
		this.problem = null;
		try {
			const result = await write();
			await this.reread(projectId);
			return result;
		} catch (error) {
			this.problem = message(error);
			return null;
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
		await this.readSending();
	}

	/** Your own notes go with every project, so any change can alter this. */
	private async readSending(): Promise<void> {
		const projectId = this.projectId;
		if (projectId === null) return;
		const generation = this.generation;
		const sending = await service.sending(projectId);
		if (generation === this.generation) this.sending = sending;
	}

	/** Read the shown project again without blanking its list first. */
	private async chooseProjectKeepingList(projectId: string): Promise<void> {
		const generation = ++this.generation;
		const notes = await service.notes(projectId);
		if (generation === this.generation) this.project = notes;
	}
}

export const memoryState = new MemoryState();
