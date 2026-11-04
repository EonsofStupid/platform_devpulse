/** @file Multiple windows reconstruct live state without replaying token events. */
import { beforeEach, expect, it, vi } from "vitest";
import type { AgentHubChanged, LiveSnapshot } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	snapshot: vi.fn(),
	listeners: [] as ((change: AgentHubChanged) => void)[],
}));
vi.mock("./agenthub.service.js", () => ({
	snapshot: mocks.snapshot,
	onChanged: async (listener: (change: AgentHubChanged) => void) => {
		mocks.listeners.push(listener);
		return () => {};
	},
}));

import { AgentHubStore } from "./agenthub.state.svelte.js";

function snapshot(revision = 1, epoch = "runtime-a"): LiveSnapshot {
	return {
		epoch,
		revision,
		conversations: [
			{
				sessionId: "a",
				projectId: "p",
				place: null,
				providerId: "codex",
				turnId: "turn-a",
				activity: "working",
				text: "Already streaming",
				tools: [],
				permissions: [],
				error: null,
				stop: null,
			},
			{
				sessionId: "b",
				projectId: "p",
				place: null,
				providerId: "codex",
				turnId: "turn-b",
				activity: "waitingForYou",
				text: "",
				tools: [],
				permissions: [
					{
						request: "permission",
						title: "Run tests",
						choices: [{ id: "yes", label: "Allow", allows: true }],
					},
				],
				error: null,
				stop: null,
			},
		],
	};
}
function changed(revision: number, epoch = "runtime-a") {
	for (const listener of mocks.listeners) listener({ revision, epoch });
}
function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
beforeEach(() => {
	mocks.snapshot.mockReset();
	mocks.listeners = [];
});

it("a second window reconstructs both threads and permission removal reaches both", async () => {
	let current = snapshot();
	mocks.snapshot.mockImplementation(async () => structuredClone(current));
	const first = new AgentHubStore();
	const second = new AgentHubStore();
	await first.connect();
	await second.connect();
	expect(second.conversation("a")?.text).toBe("Already streaming");
	expect(second.conversation("b")?.permissions[0]?.request).toBe("permission");
	current = snapshot(2);
	current.conversations[1].permissions = [];
	current.conversations[1].activity = "working";
	changed(2);
	await vi.waitFor(() => expect(second.current?.revision).toBe(2));
	expect(first.conversation("b")?.permissions).toEqual([]);
	expect(second.conversation("b")?.activity).toBe("working");
});

it("invalidations during a snapshot are coalesced and fetch the newer terminal state", async () => {
	const old = deferred<LiveSnapshot>();
	const terminal = snapshot(4);
	terminal.conversations[0].activity = "idle";
	terminal.conversations[0].error = "Persistence failed";
	mocks.snapshot.mockReturnValueOnce(old.promise).mockResolvedValue(terminal);
	const window = new AgentHubStore();
	const connected = window.connect();
	await vi.waitFor(() => expect(mocks.snapshot).toHaveBeenCalledOnce());
	changed(2);
	changed(3);
	changed(4);
	old.resolve(snapshot(1));
	await connected;
	expect(mocks.snapshot).toHaveBeenCalledTimes(2);
	expect(window.conversation("a")?.error).toBe("Persistence failed");
	changed(2);
	expect(mocks.snapshot).toHaveBeenCalledTimes(2);
});

it("an epoch change rejects an old in-flight response and replaces old observations", async () => {
	const old = deferred<LiveSnapshot>();
	mocks.snapshot
		.mockReturnValueOnce(old.promise)
		.mockResolvedValue({ epoch: "runtime-b", revision: 0, conversations: [] });
	const window = new AgentHubStore();
	const connected = window.connect();
	await vi.waitFor(() => expect(mocks.snapshot).toHaveBeenCalledOnce());
	changed(0, "runtime-b");
	old.resolve(snapshot(900));
	await connected;
	expect(window.current?.epoch).toBe("runtime-b");
	expect(window.conversation("a")).toBeNull();
});

it("a failed read invalidates live truth and a later connection can recover", async () => {
	mocks.snapshot.mockResolvedValueOnce(snapshot()).mockRejectedValueOnce(new Error("Disconnected"));
	const window = new AgentHubStore();
	await window.connect();
	await window.refresh();
	expect(window.ready).toBe(false);
	expect(window.conversation("a")).toBeNull();
	mocks.snapshot.mockResolvedValue(snapshot(0, "runtime-b"));
	await window.connect();
	expect(window.ready).toBe(true);
	expect(window.current?.epoch).toBe("runtime-b");
});
