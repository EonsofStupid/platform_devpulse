/**
 * @file notes-toggle.types.ts
 * @module @devpulse/domains/chat/ui/notes-toggle
 */
import type { AgentChatCopy } from "$lib/sys/generated/bindings.js";

export interface NotesToggleProps {
	copy: AgentChatCopy;
	/** This conversation gets your notes. */
	notes: boolean;
	/** A turn is running, or a change is being saved. */
	disabled: boolean;
	/** A change was refused, in the engine's words. */
	problem: string | null;
	onChange: (notes: boolean) => void;
	/** Open the page that chooses which notes go. */
	/** Opens the page that chooses them; absent where the screen says that once. */
	onChoose?: () => void;
}
