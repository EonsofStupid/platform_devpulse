/** @file Failed turns retain their stream copy until explicitly dismissed. */
import { beforeEach, expect, it, vi } from "vitest";
import type { AgentEvent } from "$lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	prompt: vi.fn(),
	listener: undefined as
		| undefined
		| ((event: { payload: { sessionId: string; event: AgentEvent } }) => void),
}));
vi.mock("$lib/domains/app/projects/index.js", () => ({ projectsState: { activeProjectId: "p" } }));
vi.mock("$lib/sys/logger.js", () => ({ logError: vi.fn() }));
vi.mock("$lib/sys/generated/bindings.js", () => ({
	commands: { agentPrompt: mocks.prompt },
	events: {
		agentStreamed: {
			listen: async (listener: typeof mocks.listener) => {
				mocks.listener = listener;
			},
		},
	},
}));

import { agentsState } from "./agents.state.svelte.js";

beforeEach(() => {
	mocks.prompt.mockReset().mockResolvedValue({ status: "ok", data: null });
	agentsState.retained = [];
	agentsState.error = null;
});

function emit(sessionId: string, event: AgentEvent) {
	if (!mocks.listener) throw new Error("Stream listener was not installed");
	mocks.listener({ payload: { sessionId, event } });
}

it("retains the complete failed stream through later turns and dismisses only the chosen copy", async () => {
	const first = agentsState.prompt("s", "question");
	await vi.waitFor(() => expect(mocks.prompt).toHaveBeenCalledOnce());
	emit("s", { kind: "text", text: "First " });
	emit("s", { kind: "text", text: "answer" });
	emit("s", { kind: "failed", message: "History write failed; recovery copy available" });
	await first;
	expect(agentsState.turn).toBeNull();
	expect(agentsState.retained[0]?.text).toBe("First answer");
	const firstId = agentsState.retained[0]?.id;
	const next = agentsState.prompt("other", "next question");
	await vi.waitFor(() => expect(mocks.prompt).toHaveBeenCalledTimes(2));
	emit("other", { kind: "text", text: "Second answer" });
	emit("other", { kind: "failed", message: "Endpoint disconnected" });
	await next;
	expect(agentsState.retained.map((a) => a.sessionId)).toEqual(["s", "other"]);
	if (firstId === undefined) throw new Error("Missing retained answer");
	agentsState.dismissRetained(firstId);
	expect(agentsState.retained.map((a) => a.text)).toEqual(["Second answer"]);
});

it("a successful completion creates no failure copy and foreign events cannot finish it", async () => {
	const prompt = agentsState.prompt("s", "question");
	await vi.waitFor(() => expect(mocks.prompt).toHaveBeenCalledOnce());
	emit("other", { kind: "failed", message: "Other session failed" });
	expect(agentsState.turn?.sessionId).toBe("s");
	emit("s", { kind: "text", text: "Saved answer" });
	emit("s", { kind: "turnEnded", stop: "end_turn" });
	await prompt;
	expect(agentsState.retained).toEqual([]);
	expect(agentsState.error).toBeNull();
});
