/** Conversation ownership at the frontend IPC boundary, including late responses. */
import { beforeEach, expect, it, vi } from "vitest";
import type { ChatMessage, TextTarget } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	project: { activeProjectId: "p" as string | null },
	loadRecent: vi.fn(),
	endpointTarget: vi.fn(),
	startEndpoint: vi.fn(),
	promptEndpoint: vi.fn(),
	cancelEndpoint: vi.fn(),
	listSessions: vi.fn(),
	sendMessage: vi.fn(),
	storeAssistantTurn: vi.fn(),
	generateText: vi.fn(),
	onInferenceToken: vi.fn(),
}));
vi.mock("#lib/domains/app/projects/index.js", () => ({ projectsState: mocks.project }));
vi.mock("#lib/domains/app/providers/index.js", () => ({ providersState: { current: null } }));
vi.mock("#lib/domains/app/models/index.js", () => ({
	generateText: mocks.generateText,
	isInferenceReady: () => true,
	modelsState: { statuses: { "chat.brain": {} } },
	onInferenceToken: mocks.onInferenceToken,
}));
vi.mock("#lib/sys/logger.js", () => ({ logError: vi.fn(), logInfo: vi.fn() }));
vi.mock("#lib/sys/runes/global.svelte.js", () => ({ globalState: {} }));
vi.mock("./agents.state.svelte.js", () => ({ agentsState: { thread: () => null } }));
vi.mock("./chat.service.js", () => mocks);

import { chatState } from "./chat.state.svelte.js";
import { sessionsState } from "./sessions.state.svelte.js";

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}
const target: TextTarget = {
	connectionId: "remote",
	revision: 3,
	label: "Workshop",
	model: "chosen",
};
function message(sessionId: string, role = "user"): ChatMessage {
	return {
		id: `${sessionId}-${role}`,
		sessionId,
		role,
		content: "answer",
		createdAt: 1,
		tokenCount: null,
		modelUsed: null,
		latencyMs: null,
	};
}
async function select(id: string | null) {
	chatState.setActiveSession(id);
	await chatState.loadActive();
}
beforeEach(async () => {
	vi.resetAllMocks();
	mocks.project.activeProjectId = "p";
	mocks.loadRecent.mockResolvedValue([]);
	mocks.endpointTarget.mockResolvedValue(null);
	mocks.listSessions.mockResolvedValue([]);
	mocks.onInferenceToken.mockReturnValue(vi.fn());
	sessionsState.items = [];
	await select(null);
});
it("persists an ordinary response to the selected session and never invents token usage from deltas", async () => {
	await select("selected");
	mocks.sendMessage.mockResolvedValue(message("selected"));
	mocks.generateText.mockImplementation(async () => {
		mocks.onInferenceToken.mock.calls[0]?.[0]("answer");
		return "answer";
	});
	mocks.storeAssistantTurn.mockResolvedValue(message("selected", "assistant"));
	await chatState.generateResponse("hello");
	expect(mocks.sendMessage).toHaveBeenCalledWith("p", "selected", "hello");
	expect(mocks.storeAssistantTurn).toHaveBeenCalledWith(
		"selected",
		"p",
		"answer",
		null,
		"chat.brain",
		expect.any(Number),
	);
	expect(chatState.messages).toHaveLength(2);
});
it("a pending new chat cannot adopt or fill a different selected conversation", async () => {
	const user = deferred<ChatMessage>();
	mocks.sendMessage.mockReturnValue(user.promise);
	mocks.generateText.mockResolvedValue("answer");
	mocks.storeAssistantTurn.mockResolvedValue(message("created", "assistant"));
	const sending = chatState.generateResponse("new message");
	expect(mocks.sendMessage).toHaveBeenCalledWith("p", null, "new message");
	await select("other");
	user.resolve(message("created"));
	await sending;
	expect(chatState.activeSessionId).toBe("other");
	expect(chatState.messages).toEqual([]);
	expect(mocks.storeAssistantTurn.mock.calls[0]?.slice(0, 2)).toEqual(["created", "p"]);
});
it("endpoint deltas, cancellation and completion stay with their own request", async () => {
	mocks.endpointTarget.mockResolvedValue(target);
	await select("endpoint");
	const answer = deferred<ChatMessage>();
	mocks.promptEndpoint.mockReturnValue(answer.promise);
	const sending = chatState.generateResponse("question");
	const call = mocks.promptEndpoint.mock.calls[0];
	expect(call?.slice(0, 2)).toEqual(["p", "endpoint"]);
	expect(call?.[3]).toBe("question");
	call?.[4]("partial");
	expect(chatState.streamingContent).toBe("partial");
	await chatState.stopEndpoint();
	expect(mocks.cancelEndpoint).toHaveBeenCalledWith("p", "endpoint", call?.[2]);
	mocks.endpointTarget.mockResolvedValue(null);
	await select("other");
	call?.[4]("late");
	expect(chatState.streamingContent).toBe("");
	answer.reject(new Error("Cancelled previous response"));
	await sending;
	expect(chatState.messages).toEqual([]);
	expect(chatState.error).toBeNull();
	expect(mocks.generateText).not.toHaveBeenCalled();
	expect(mocks.storeAssistantTurn).not.toHaveBeenCalled();
});
it("failed endpoint requests reload persisted turns and show the actual failure", async () => {
	mocks.endpointTarget.mockResolvedValue(target);
	await select("endpoint");
	mocks.promptEndpoint.mockRejectedValue(new Error("Server unavailable"));
	mocks.loadRecent.mockResolvedValue([message("endpoint")]);
	await chatState.generateResponse("question");
	expect(chatState.messages).toEqual([message("endpoint")]);
	expect(chatState.error).toBe("Server unavailable");
	expect(chatState.isGenerating).toBe(false);
	mocks.promptEndpoint.mock.calls[0]?.[4]("queued after completion");
	expect(chatState.streamingContent).toBe("");
});
it("an unresolved routing identity cannot fall through to local inference", async () => {
	mocks.endpointTarget.mockRejectedValue(new Error("Cannot read binding"));
	await select("endpoint");
	await chatState.generateResponse("keep private");
	expect(chatState.routingReady).toBe(false);
	expect(mocks.sendMessage).not.toHaveBeenCalled();
	expect(mocks.generateText).not.toHaveBeenCalled();
	expect(mocks.promptEndpoint).not.toHaveBeenCalled();
});
it("project changes discard late endpoint failures and output", async () => {
	mocks.endpointTarget.mockResolvedValue(target);
	await select("endpoint");
	const answer = deferred<ChatMessage>();
	mocks.promptEndpoint.mockReturnValue(answer.promise);
	const sending = chatState.generateResponse("question");
	mocks.project.activeProjectId = "q";
	mocks.endpointTarget.mockResolvedValue(null);
	await select("new-project");
	mocks.promptEndpoint.mock.calls[0]?.[4]("late");
	answer.reject(new Error("Previous project"));
	await sending;
	expect(chatState.error).toBeNull();
	expect(chatState.streamingContent).toBe("");
	expect(chatState.messages).toEqual([]);
});
