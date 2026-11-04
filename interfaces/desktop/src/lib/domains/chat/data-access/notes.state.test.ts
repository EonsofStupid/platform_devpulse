/**
 * @file notes.state.test.ts
 * @module @devpulse/domains/chat/data-access
 * What the chat shows about notes must be what was saved, for the conversation
 * on screen.
 */
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	conversationNotes: vi.fn(),
	setConversationNotes: vi.fn(),
}));
vi.mock("./chat.service.js", () => mocks);

import { NotesState } from "./notes.state.svelte.js";

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

beforeEach(() => {
	mocks.conversationNotes.mockReset();
	mocks.setConversationNotes.mockReset();
});

test("it shows the conversation's saved choice", async () => {
	const state = new NotesState();
	mocks.conversationNotes.mockResolvedValueOnce(false);
	await state.load("a");
	expect(mocks.conversationNotes).toHaveBeenCalledExactlyOnceWith("a");
	expect(state.notes).toBe(false);
});

test("no conversation shows no choice", async () => {
	const state = new NotesState();
	mocks.conversationNotes.mockResolvedValueOnce(true);
	await state.load("a");
	await state.load(null);
	expect(state.notes).toBeNull();
});

test("a late answer for a conversation you left does not replace the one on screen", async () => {
	const state = new NotesState();
	const first = deferred<boolean>();
	mocks.conversationNotes.mockReturnValueOnce(first.promise);
	const leaving = state.load("a");

	mocks.conversationNotes.mockResolvedValueOnce(false);
	await state.load("b");
	first.resolve(true);
	await leaving;
	expect(state.notes).toBe(false);
});

test("a change shows only once it is saved", async () => {
	const state = new NotesState();
	mocks.conversationNotes.mockResolvedValueOnce(true);
	await state.load("a");

	const saved = deferred<void>();
	mocks.setConversationNotes.mockReturnValueOnce(saved.promise);
	const changing = state.set(false);
	expect(state.notes).toBe(true);
	expect(state.busy).toBe(true);
	saved.resolve();
	await changing;
	expect(mocks.setConversationNotes).toHaveBeenCalledExactlyOnceWith("a", false);
	expect(state.notes).toBe(false);
	expect(state.busy).toBe(false);
});

test("a refused change keeps what was saved and says why", async () => {
	const state = new NotesState();
	mocks.conversationNotes.mockResolvedValueOnce(true);
	await state.load("a");
	mocks.setConversationNotes.mockRejectedValueOnce(new Error("the agent is still answering"));
	await state.set(false);
	expect(state.notes).toBe(true);
	expect(state.problem).toBe("the agent is still answering");
	expect(state.busy).toBe(false);
});

test("an unreadable choice says so rather than showing yes or no", async () => {
	const state = new NotesState();
	mocks.conversationNotes.mockRejectedValueOnce(new Error("Platform is still booting"));
	await state.load("a");
	expect(state.notes).toBeNull();
	expect(state.problem).toBe("Platform is still booting");
});
