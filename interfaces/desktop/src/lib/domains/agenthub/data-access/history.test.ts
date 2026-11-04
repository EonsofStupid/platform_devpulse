/** @file History selection and paging must never mix artifacts or requests. */
import { beforeEach, expect, it, vi } from "vitest";
import type { FoundPage, FoundSession } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({ sessions: vi.fn(), transcript: vi.fn() }));
vi.mock("./agenthub.service.js", () => mocks);

import { HistoryStore, sessionGroups } from "./history.state.svelte.js";

function session(locator: string, extra: Partial<FoundSession> = {}): FoundSession {
	return {
		providerId: "codex",
		locator,
		nativeId: locator,
		kind: "userStarted",
		parentNativeId: null,
		parentLocator: null,
		parentResolution: "notApplicable",
		title: locator,
		workspace: "workspace",
		startedAt: "",
		modifiedAt: 0,
		bytes: 1,
		...extra,
	};
}
function page(locator: string, id = locator, nextCursor: string | null = null): FoundPage {
	return {
		providerId: "codex",
		locator,
		events: [{ id, kind: "user_message", presentation: "conversation", text: id }],
		nextCursor,
		truncatedBefore: !!nextCursor,
	};
}
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}
beforeEach(() => {
	vi.resetAllMocks();
});

it("groups only within a provider and keeps unresolved children visible", () => {
	const parent = session("parent");
	const child = session("child", {
		kind: "subAgent",
		parentLocator: "parent",
		parentResolution: "resolved",
		title: "needle",
	});
	const orphan = session("orphan", { kind: "subAgent", parentResolution: "missing" });
	const foreign = session("parent", { providerId: "claude-code" });
	const groups = sessionGroups([child, parent, orphan, foreign]);
	expect(groups.map((group) => group.session)).toEqual([parent, orphan, foreign]);
	expect(groups[0].children[0].session).toEqual(child);
	expect(sessionGroups([parent, child, orphan], "needle")[0].session).toEqual(parent);
});

it("shares catalog refreshes and surfaces a failure without losing the last catalog", async () => {
	const store = new HistoryStore();
	const request = deferred<{ sessions: FoundSession[]; sources: [] }>();
	mocks.sessions.mockReturnValueOnce(request.promise);
	const first = store.refresh();
	expect(store.refresh()).toBe(first);
	request.resolve({ sessions: [session("a")], sources: [] });
	await first;
	mocks.sessions.mockRejectedValueOnce(new Error("runtime stopped"));
	await store.refresh();
	expect(store.error).toBe("runtime stopped");
	expect(store.catalog?.sessions[0].locator).toBe("a");
});

it("ignores both a stale success and a stale error after selecting another session", async () => {
	for (const fail of [false, true]) {
		const store = new HistoryStore();
		const a = deferred<FoundPage>();
		mocks.transcript.mockReturnValueOnce(a.promise).mockResolvedValueOnce(page("b"));
		const first = store.select(session("a"));
		await store.select(session("b"));
		if (fail) a.reject(new Error("old failure"));
		else a.resolve(page("a"));
		await first;
		expect(store.events[0].id).toBe("b");
		expect(store.pageError).toBeNull();
		expect(store.pageLoading).toBe(false);
	}
});

it("loads the newest page first, prepends older events once, and preserves them on failure", async () => {
	const store = new HistoryStore();
	mocks.transcript.mockResolvedValueOnce(page("a", "new", "older"));
	await store.select(session("a"));
	expect(mocks.transcript).toHaveBeenCalledWith("codex", "a", null);
	const older = deferred<FoundPage>();
	mocks.transcript.mockReturnValueOnce(older.promise);
	const pending = store.older();
	await store.older();
	expect(mocks.transcript).toHaveBeenCalledTimes(2);
	older.resolve(page("a", "old", "oldest"));
	await pending;
	expect(store.events.map((event) => event.id)).toEqual(["old", "new"]);
	mocks.transcript.mockRejectedValueOnce(new Error("file changed"));
	await store.older();
	expect(store.events).toHaveLength(2);
	expect(store.pageError).toBe("file changed");
});

it("refuses a response for a different artifact", async () => {
	const store = new HistoryStore();
	mocks.transcript.mockResolvedValueOnce(page("b"));
	await store.select(session("a"));
	expect(store.events).toEqual([]);
	expect(store.pageError).toContain("another session");
});
