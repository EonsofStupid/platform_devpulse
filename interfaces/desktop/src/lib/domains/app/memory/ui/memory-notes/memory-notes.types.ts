/**
 * @file memory-notes.types.ts
 * @module @devpulse/domains/app/memory/ui/memory-notes
 * One place's notes, and what you can do to them.
 */
import type { MemoryCopy, MemoryNote, MemorySave } from "#lib/sys/generated/bindings.js";

export interface MemoryNotesProps {
	copy: MemoryCopy;
	notes: MemoryNote[];
	busy: boolean;
	/**
	 * Save a note, if it is still at `expectedVersion` (null for a new one), and
	 * choose whether it goes with every conversation. `null` means it was refused.
	 */
	onSave: (
		label: string,
		body: string,
		expectedVersion: number | null,
		include: boolean,
	) => Promise<MemorySave | null>;
	/** Choose whether the note at `version` goes with every conversation. */
	onInclude: (label: string, version: number, include: boolean) => Promise<MemorySave | null>;
	/** Delete a note; resolves to whether that went through. */
	onRemove: (label: string) => Promise<boolean>;
}
