/**
 * @file memory.state.test.ts
 * @module @devpulse/domains/app/memory/data-access
 * A late answer for a project you left must not replace the one on screen, and
 * a refused write must be visible.
 */
import { beforeEach, expect, test, vi } from "vitest";
import type { MemoryNote } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	notes: vi.fn(),
	save: vi.fn(),
	setIncluded: vi.fn(),
	sending: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("./memory.service.js", () => mocks);

import { MemoryState } from "./memory.state.svelte.js";

function note(projectId: string | null, label: string): MemoryNote {
	return {
		projectId,
		label,
		body: `${label} body`,
		charLimit: 5000,
		updatedAt: "2026-11-03T00:00:00Z",
		version: 1,
		included: false,
		changedSinceApproved: false,
	};
}

const nothingSent = { text: null, leftOut: [], used: 0, limit: 8000 };

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

beforeEach(() => {
	mocks.notes.mockReset();
	mocks.save.mockReset();
	mocks.setIncluded.mockReset();
	mocks.sending.mockReset();
	mocks.remove.mockReset();
	mocks.sending.mockResolvedValue(nothingSent);
});

test("a late answer for a project you left does not replace the one on screen", async () => {
	const state = new MemoryState();
	const alpha = deferred<MemoryNote[]>();
	mocks.notes.mockReturnValueOnce(alpha.promise);
	const leaving = state.chooseProject("alpha");

	mocks.notes.mockResolvedValueOnce([note("beta", "beta note")]);
	await state.chooseProject("beta");
	expect(state.project.map((n) => n.label)).toEqual(["beta note"]);

	alpha.resolve([note("alpha", "alpha note")]);
	await leaving;
	expect(state.projectId).toBe("beta");
	expect(state.project.map((n) => n.label)).toEqual(["beta note"]);
});

test("choosing a project shows nothing of the last one while it reads", async () => {
	const state = new MemoryState();
	mocks.notes.mockResolvedValueOnce([note("alpha", "alpha note")]);
	await state.chooseProject("alpha");

	const beta = deferred<MemoryNote[]>();
	mocks.notes.mockReturnValueOnce(beta.promise);
	const reading = state.chooseProject("beta");
	expect(state.project).toEqual([]);
	beta.resolve([]);
	await reading;
});

test("saving your own note rereads your notes and leaves the project's alone", async () => {
	const state = new MemoryState();
	mocks.notes.mockResolvedValueOnce([note("alpha", "alpha note")]);
	await state.chooseProject("alpha");

	const saved = { kind: "saved", note: note(null, "human") };
	mocks.save.mockResolvedValueOnce(saved);
	mocks.notes.mockResolvedValueOnce([note(null, "human")]);
	expect(await state.save(null, "human", "body", null, true)).toEqual(saved);
	expect(mocks.save).toHaveBeenCalledExactlyOnceWith(null, "human", "body", null, true);
	expect(state.yours.map((n) => n.label)).toEqual(["human"]);
	expect(state.project.map((n) => n.label)).toEqual(["alpha note"]);
	expect(state.busy).toBe(false);
});

test("deleting from the shown project rereads it without blanking it first", async () => {
	const state = new MemoryState();
	mocks.notes.mockResolvedValueOnce([note("alpha", "a"), note("alpha", "b")]);
	await state.chooseProject("alpha");

	mocks.remove.mockResolvedValueOnce(true);
	const after = deferred<MemoryNote[]>();
	mocks.notes.mockReturnValueOnce(after.promise);
	const removing = state.remove("alpha", "a");
	await vi.waitFor(() => expect(mocks.notes).toHaveBeenCalledTimes(2));
	expect(state.project).toHaveLength(2);

	after.resolve([note("alpha", "b")]);
	expect(await removing).toBe(true);
	expect(state.project.map((n) => n.label)).toEqual(["b"]);
});

test("a refused write says why, reports failure and clears on the next attempt", async () => {
	const state = new MemoryState();
	mocks.save.mockRejectedValueOnce(new Error("block body has 6000 characters"));
	expect(await state.save(null, "long", "x", null, true)).toBeNull();
	expect(state.problem).toBe("block body has 6000 characters");
	expect(state.busy).toBe(false);

	mocks.save.mockResolvedValueOnce({ kind: "saved", note: note(null, "long") });
	mocks.notes.mockResolvedValueOnce([note(null, "long")]);
	expect(await state.save(null, "long", "y", null, true)).not.toBeNull();
	expect(state.problem).toBeNull();
});

test("a save that came too late still rereads, so you see what the note says now", async () => {
	const state = new MemoryState();
	const newer = { ...note(null, "human"), body: "an agent's text", version: 2 };
	mocks.save.mockResolvedValueOnce({ kind: "changed", current: newer });
	mocks.notes.mockResolvedValueOnce([newer]);
	expect(await state.save(null, "human", "yours", 1, true)).toEqual({
		kind: "changed",
		current: newer,
	});
	expect(state.yours[0]?.body).toBe("an agent's text");
	expect(state.problem).toBeNull();
});

test("changing your own note updates what the shown project sends", async () => {
	const state = new MemoryState();
	mocks.notes.mockResolvedValueOnce([]);
	await state.chooseProject("alpha");
	expect(state.sending).toEqual(nothingSent);

	const sent = { text: "the notes", leftOut: [], used: 9, limit: 8000 };
	mocks.setIncluded.mockResolvedValueOnce({ kind: "saved", note: note(null, "human") });
	mocks.notes.mockResolvedValueOnce([note(null, "human")]);
	mocks.sending.mockResolvedValueOnce(sent);
	await state.setIncluded(null, "human", 1, true);
	expect(mocks.setIncluded).toHaveBeenCalledExactlyOnceWith(null, "human", 1, true);
	expect(state.sending).toEqual(sent);
});

test("leaving a project stops showing what it sends", async () => {
	const state = new MemoryState();
	mocks.notes.mockResolvedValueOnce([]);
	await state.chooseProject("alpha");
	await state.chooseProject(null);
	expect(state.sending).toBeNull();
});

test("memory that cannot be read is reported as unavailable", async () => {
	const state = new MemoryState();
	mocks.notes.mockRejectedValueOnce(new Error("Memory is not available"));
	await state.loadYours();
	expect(state.unavailable).toBe(true);

	mocks.notes.mockResolvedValueOnce([]);
	await state.loadYours();
	expect(state.unavailable).toBe(false);
});
