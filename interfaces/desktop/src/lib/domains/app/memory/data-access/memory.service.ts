/**
 * @file Memory service — the only place the memory domain talks to Rust. A
 * failure becomes a thrown `Error` carrying Rust's message (plan 0001 B6.2).
 * @module @devpulse/domains/app/memory/data-access/memory.service
 */

import { commands, type MemoryNote } from "$lib/sys/generated/bindings.js";

/** Your own notes (`projectId` null) or one project's, newest first. */
export async function notes(projectId: string | null): Promise<MemoryNote[]> {
	const result = await commands.memoryNotes(projectId);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

/** Write a note. */
export async function save(
	projectId: string | null,
	label: string,
	body: string,
): Promise<MemoryNote> {
	const result = await commands.memorySave(projectId, label, body);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

/** Delete a note. */
export async function remove(projectId: string | null, label: string): Promise<boolean> {
	const result = await commands.memoryRemove(projectId, label);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}
