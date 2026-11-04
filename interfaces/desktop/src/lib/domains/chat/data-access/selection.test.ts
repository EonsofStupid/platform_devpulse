/** @file Selected chat and project retain ownership of asynchronous loads. */
import { beforeEach, expect, it, vi } from "vitest";
import type { AgentThread, ChatMessage } from "$lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	project: { activeProjectId: "project-a" as string | null },
	loadRecent: vi.fn(),
	agentThreads: vi.fn(),
}));

vi.mock("$lib/domains/app/projects/index.js", () => ({ projectsState: mocks.project }));
vi.mock("$lib/domains/app/providers/index.js", () => ({ providersState: { current: null } }));
vi.mock("$lib/domains/app/models/index.js", () => ({
	generateText: vi.fn(),
	isInferenceReady: vi.fn(),
	modelsState: { statuses: {} },
	onInferenceToken: vi.fn(),
}));
vi.mock("$lib/sys/generated/bindings.js", () => ({
	commands: { agentThreads: mocks.agentThreads },
	events: {},
}));
vi.mock("$lib/sys/logger.js", async (importOriginal) => ({
	...(await importOriginal<typeof import("$lib/sys/logger.js")>()),
	logError: vi.fn(),
	logInfo: vi.fn(),
}));
vi.mock("$lib/sys/runes/global.svelte.js", () => ({ globalState: {} }));
vi.mock("../util/format.js", () => ({ toBlockMessage: vi.fn() }));
vi.mock("./chat.service.js", () => ({
	loadRecent: mocks.loadRecent,
	endpointTarget: vi.fn().mockResolvedValue(null),
}));

import { agentsState } from "./agents.state.svelte.js";
import { chatState } from "./chat.state.svelte.js";

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}

function message(sessionId: string): ChatMessage {
	return {
		id: sessionId,
		sessionId,
		role: "user",
		content: sessionId,
		createdAt: 0,
		tokenCount: null,
		modelUsed: null,
		latencyMs: null,
	};
}

function thread(projectId: string): AgentThread {
	return {
		sessionId: projectId,
		projectId,
		providerId: "codex",
		title: projectId,
		turnCount: 0,
		updatedAt: 0,
		notes: true,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.project.activeProjectId = "project-a";
	chatState.setActiveSession(null);
	chatState.messages = [];
	chatState.error = null;
	agentsState.threads = {};
	agentsState.error = null;
});

it("a slow previous session cannot replace the newer messages", async () => {
	const a = deferred<ChatMessage[]>();
	const b = deferred<ChatMessage[]>();
	mocks.loadRecent.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
	chatState.setActiveSession("a");
	const first = chatState.loadActive();
	chatState.setActiveSession("b");
	const second = chatState.loadActive();
	b.resolve([message("b")]);
	await second;
	a.resolve([message("a")]);
	await first;
	expect(chatState.messages).toEqual([message("b")]);
	expect(chatState.loading).toBe(false);
});

it("a stale failure cannot clear the newer loading flag or set its error", async () => {
	const a = deferred<ChatMessage[]>();
	const b = deferred<ChatMessage[]>();
	mocks.loadRecent.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
	chatState.setActiveSession("a");
	const first = chatState.loadActive();
	chatState.setActiveSession("b");
	const second = chatState.loadActive();
	a.reject(new Error("old failure"));
	await first;
	expect(chatState.loading).toBe(true);
	expect(chatState.error).toBeNull();
	b.reject(new Error("current failure"));
	await second;
	expect(chatState.loading).toBe(false);
	expect(chatState.error).toBe("current failure");
});

it("only the latest refresh for the same session can apply", async () => {
	const a = deferred<ChatMessage[]>();
	const b = deferred<ChatMessage[]>();
	mocks.loadRecent.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
	chatState.setActiveSession("a");
	const first = chatState.loadActive();
	const second = chatState.loadActive();
	a.resolve([message("outdated")]);
	await first;
	expect(chatState.messages).toEqual([]);
	expect(chatState.loading).toBe(true);
	b.resolve([message("fresh")]);
	await second;
	expect(chatState.messages).toEqual([message("fresh")]);
});

it("selection and project changes invalidate responses before another load", async () => {
	const a = deferred<ChatMessage[]>();
	mocks.loadRecent.mockReturnValueOnce(a.promise);
	chatState.setActiveSession("a");
	const first = chatState.loadActive();
	chatState.setActiveSession("b");
	a.resolve([message("a")]);
	await first;
	expect(chatState.messages).toEqual([]);
	const b = deferred<ChatMessage[]>();
	mocks.loadRecent.mockReturnValueOnce(b.promise);
	const second = chatState.loadActive();
	mocks.project.activeProjectId = null;
	b.reject(new Error("previous project"));
	await second;
	expect(chatState.error).toBeNull();
	expect(chatState.loading).toBe(false);
});

it("agent refreshes cannot overwrite another project's threads", async () => {
	const a = deferred<{ status: "ok"; data: AgentThread[] }>();
	const b = deferred<{ status: "ok"; data: AgentThread[] }>();
	mocks.agentThreads.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
	const first = agentsState.refresh("project-a");
	mocks.project.activeProjectId = "project-b";
	const second = agentsState.refresh("project-b");
	b.resolve({ status: "ok", data: [thread("project-b")] });
	await second;
	a.resolve({ status: "ok", data: [thread("project-a")] });
	await first;
	expect(agentsState.thread("project-b")).toEqual(thread("project-b"));
	expect(agentsState.threads).toEqual({ "project-b": thread("project-b") });
	mocks.project.activeProjectId = null;
	expect(agentsState.thread("project-b")).toBeNull();
});

it("only the latest agent refresh for the same project can apply", async () => {
	const a = deferred<{ status: "error"; error: string }>();
	const b = deferred<{ status: "ok"; data: AgentThread[] }>();
	mocks.agentThreads.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
	const first = agentsState.refresh("project-a");
	const second = agentsState.refresh("project-a");
	b.resolve({ status: "ok", data: [thread("project-a")] });
	await second;
	a.resolve({ status: "error", error: "outdated" });
	await first;
	expect(agentsState.error).toBeNull();
	expect(agentsState.thread("project-a")).toEqual(thread("project-a"));
});

it.each(["ipc", "transport"])("ignores stale %s errors from an agent refresh", async (kind) => {
	const a = deferred<{ status: "error"; error: string }>();
	mocks.agentThreads.mockReturnValueOnce(a.promise);
	const first = agentsState.refresh("project-a");
	mocks.project.activeProjectId = "project-b";
	if (kind === "ipc") a.resolve({ status: "error", error: "old failure" });
	else a.reject(new Error("old failure"));
	await first;
	expect(agentsState.error).toBeNull();
});
