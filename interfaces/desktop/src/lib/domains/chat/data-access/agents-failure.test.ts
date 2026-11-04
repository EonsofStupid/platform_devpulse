/** @file Snapshot-driven chat keeps failed output and targets actions by session. */
import { beforeEach, expect, it, vi } from "vitest";
import type { LiveConversation, LiveSnapshot } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	prompt: vi.fn(),
	answer: vi.fn(),
	cancel: vi.fn(),
	current: null as LiveSnapshot | null,
}));
vi.mock("#lib/domains/app/projects/index.js", () => ({ projectsState: { activeProjectId: "p" } }));
vi.mock("#lib/sys/logger.js", async (importOriginal) => ({
	...(await importOriginal<typeof import("#lib/sys/logger.js")>()),
	logError: vi.fn(),
}));
vi.mock("#lib/sys/generated/bindings.js", () => ({
	commands: {
		agentPrompt: mocks.prompt,
		agentAnswer: mocks.answer,
		agentCancel: mocks.cancel,
		agenthubLive: async () => ({ status: "ok", data: mocks.current }),
	},
	events: { agentHubChanged: { listen: async () => () => {} } },
}));

import { agenthubState } from "#lib/domains/agenthub/index.js";
import { agentsState } from "./agents.state.svelte.js";

function turn(sessionId: string, error: string | null = null): LiveConversation {
	return {
		sessionId,
		projectId: "p",
		place: null,
		providerId: "codex",
		turnId: `turn-${sessionId}`,
		activity: error ? "idle" : "working",
		text: `${sessionId} answer`,
		tools: [],
		permissions: [],
		error,
		stop: null,
	};
}
async function publish(conversations: LiveConversation[]) {
	mocks.current = { epoch: "runtime", revision: (mocks.current?.revision ?? 0) + 1, conversations };
	await agenthubState.refresh();
}
beforeEach(async () => {
	vi.clearAllMocks();
	mocks.prompt.mockResolvedValue({ status: "ok", data: null });
	mocks.answer.mockResolvedValue({ status: "ok", data: true });
	mocks.cancel.mockResolvedValue({ status: "ok", data: null });
	mocks.current = { epoch: "runtime", revision: 0, conversations: [] };
	agenthubState.current = null;
	agentsState.retained = [];
	agentsState.error = null;
	await agentsState.initialize();
});

it("retains failed output across later turns and dismissal survives repeated snapshots", async () => {
	await publish([turn("first", "History write failed; recovery copy available")]);
	expect(agentsState.running("first")).toBeNull();
	expect(agentsState.retained[0]?.text).toBe("first answer");
	const id = agentsState.retained[0]?.id;
	await agentsState.prompt("other", "question");
	await publish([turn("first", "History write failed"), turn("other", "Disconnected")]);
	expect(agentsState.retained.map((answer) => answer.sessionId)).toEqual(["first", "other"]);
	if (!id) throw new Error("Missing failure copy");
	agentsState.dismissRetained(id);
	await agenthubState.refresh();
	expect(agentsState.retained.map((answer) => answer.text)).toEqual(["other answer"]);
});

it("a successful turn creates no copy and another session's failure cannot finish it", async () => {
	await publish([turn("active"), turn("foreign", "Other session failed")]);
	expect(agentsState.running("active")?.text).toBe("active answer");
	expect(agentsState.running("foreign")).toBeNull();
	const saved = turn("active");
	saved.activity = "idle";
	saved.text = "";
	saved.stop = "end_turn";
	await publish([saved]);
	expect(agentsState.retained.some((answer) => answer.sessionId === "active")).toBe(false);
	expect(agentsState.error).toBeNull();
});

it("answers and cancellation target the selected session without inventing permission resolution", async () => {
	const waiting = turn("waiting");
	waiting.activity = "waitingForYou";
	waiting.permissions = [{ request: "permission", title: "Run tests", choices: [] }];
	await publish([turn("parallel"), waiting]);
	await agentsState.answer("waiting", "permission", null);
	expect(mocks.answer).toHaveBeenCalledWith("waiting", "permission", null);
	expect(agentsState.running("waiting")?.permission?.request).toBe("permission");
	await agentsState.cancel("parallel");
	expect(mocks.cancel).toHaveBeenCalledWith("parallel");
	waiting.permissions = [];
	waiting.activity = "working";
	await publish([waiting]);
	await agentsState.answer("waiting", "permission", "yes");
	expect(mocks.answer).toHaveBeenCalledOnce();
});
