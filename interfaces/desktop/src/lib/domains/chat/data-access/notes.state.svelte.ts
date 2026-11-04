/**
 * @file Whether the conversation on screen gets your notes. A late answer for a
 * conversation you have left never replaces the one on screen.
 * @module @devpulse/domains/chat/data-access/notes.state
 */

import * as chatService from "./chat.service.js";

const message = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

export class NotesState {
	/** `null` until the conversation's choice has been read. */
	notes = $state<boolean | null>(null);
	busy = $state(false);
	problem = $state<string | null>(null);

	private sessionId: string | null = null;
	private generation = 0;

	/** Read the choice for this conversation. */
	async load(sessionId: string | null): Promise<void> {
		const generation = ++this.generation;
		this.sessionId = sessionId;
		this.notes = null;
		this.problem = null;
		if (sessionId === null) return;
		try {
			const notes = await chatService.conversationNotes(sessionId);
			if (generation === this.generation) this.notes = notes;
		} catch (error) {
			if (generation === this.generation) this.problem = message(error);
		}
	}

	/** Change the choice. What is shown changes only once it is saved. */
	async set(notes: boolean): Promise<void> {
		const sessionId = this.sessionId;
		if (sessionId === null) return;
		const generation = this.generation;
		this.busy = true;
		this.problem = null;
		try {
			await chatService.setConversationNotes(sessionId, notes);
			if (generation === this.generation) this.notes = notes;
		} catch (error) {
			if (generation === this.generation) this.problem = message(error);
		} finally {
			this.busy = false;
		}
	}
}

export const notesState = new NotesState();
