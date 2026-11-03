/**
 * @file memory-notes.types.ts
 * @module @devpulse/domains/app/memory/ui/memory-notes
 * One place's notes, and what you can do to them.
 */
import type { MemoryCopy, MemoryNote } from "$lib/sys/generated/bindings.js";

export interface MemoryNotesProps {
	copy: MemoryCopy;
	notes: MemoryNote[];
	busy: boolean;
	/** Save a note; resolves to whether it was saved. */
	onSave: (label: string, body: string) => Promise<boolean>;
	/** Delete a note; resolves to whether that went through. */
	onRemove: (label: string) => Promise<boolean>;
}
