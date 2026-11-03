/**
 * @file Memory service — the only place the memory domain talks to Rust. A
 * failure becomes a thrown `Error` carrying Rust's message (plan 0001 B6.2).
 * @module @devpulse/domains/app/memory/data-access/memory.service
 */

import {
	commands,
	type MemoryNote,
	type MemorySave,
	type MemorySending,
} from "$lib/sys/generated/bindings.js";

/** Your own notes (`projectId` null) or one project's, newest first. */
export async function notes(projectId: string | null): Promise<MemoryNote[]> {
	const result = await commands.memoryNotes(projectId);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

/** Write a note, if it is still at `expectedVersion` (null for a new one). */
export async function save(
	projectId: string | null,
	label: string,
	body: string,
	expectedVersion: number | null,
	include: boolean,
): Promise<MemorySave> {
	const result = await commands.memorySave(projectId, label, body, expectedVersion, include);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

/** Say whether the note at `version` goes with every session. */
export async function setIncluded(
	projectId: string | null,
	label: string,
	version: number,
	include: boolean,
): Promise<MemorySave> {
	const result = await commands.memorySetIncluded(projectId, label, version, include);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

/** What goes with a session in a project, exactly as an agent receives it. */
export async function sending(projectId: string): Promise<MemorySending> {
	const result = await commands.memorySending(projectId);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

/** Delete a note. */
export async function remove(projectId: string | null, label: string): Promise<boolean> {
	const result = await commands.memoryRemove(projectId, label);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}
