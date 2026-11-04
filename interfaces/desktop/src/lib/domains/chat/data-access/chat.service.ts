/**
 * @file Chat IPC boundary — ONLY `invoke` site for this domain
 * @module @devpulse/domains/chat/data-access/chat.service
 */

import { Channel } from "@tauri-apps/api/core";
import { projectsState } from "#lib/domains/app/projects/index.js";
import { withAction } from "#lib/sys/action-bus.svelte.js";
import {
	type ChatMessage,
	type ChatSession,
	commands,
	type ExportFormat,
	type ExportSummary,
} from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";

function activeProjectId(): string | null {
	return projectsState.activeProjectId;
}

function ok<T>(r: { status: "ok"; data: T } | { status: "error"; error: unknown }): T {
	if (r.status === "error") {
		const msg = typeof r.error === "string" ? r.error : String(r.error);
		throw new Error(msg);
	}
	return r.data;
}

export async function loadRecent(
	projectId: string,
	sessionId: string | null,
): Promise<ChatMessage[]> {
	return withAction("chat.loadRecent", "Loading recent chat messages…", async () => {
		logInfo("chat", "load_recent");
		const pid = projectId || activeProjectId();
		if (!pid) throw new Error("No active project — open a project in DevPulse first.");
		const r = await commands.loadRecent(pid, sessionId);
		return ok(r);
	});
}

export async function sendMessage(
	projectId: string,
	sessionId: string | null,
	content: string,
): Promise<ChatMessage> {
	return withAction("chat.send", "Sending your message to the model…", async () => {
		logInfo("chat", "send_message");
		const pid = projectId || activeProjectId();
		if (!pid) throw new Error("No active project — open a project in DevPulse first.");
		const r = await commands.sendMessage(pid, sessionId, content);
		return ok(r);
	});
}

export async function listSessions(): Promise<ChatSession[]> {
	return withAction("chat.listSessions", "Listing chat sessions…", async () => {
		const r = await commands.listSessions();
		return ok(r);
	});
}

export async function deleteSession(sessionId: string): Promise<void> {
	return withAction("chat.deleteSession", "Deleting this chat session…", async () => {
		const r = await commands.deleteSession(sessionId);
		if (r.status === "error") {
			const msg = typeof r.error === "string" ? r.error : String(r.error);
			logError("chat", `delete_session: ${msg}`);
			throw new Error(msg);
		}
	});
}

export async function clearAllChatHistory(): Promise<void> {
	return withAction("chat.clearAll", "Clearing all chat history…", async () => {
		const r = await commands.clearAllChatHistory();
		if (r.status === "error") {
			const msg = typeof r.error === "string" ? r.error : String(r.error);
			logError("chat", `clear_all: ${msg}`);
			throw new Error(msg);
		}
	});
}

export async function exportSession(
	sessionId: string,
	format: ExportFormat,
	destPath: string,
): Promise<ExportSummary> {
	return withAction("chat.export", "Exporting this chat session…", async () => {
		const r = await commands.exportSession(sessionId, format, destPath);
		return ok(r);
	});
}

export async function exportAllSessions(
	format: ExportFormat,
	destPath: string,
): Promise<ExportSummary> {
	return withAction("chat.exportAll", "Exporting all chat sessions…", async () => {
		const r = await commands.exportAllSessions(format, destPath);
		return ok(r);
	});
}

export async function pickSaveFile(defaultName: string): Promise<string | null> {
	return withAction("chat.pickSaveFile", "Choosing where to save…", async () => {
		const r = await commands.pickSaveFile(defaultName);
		return ok(r);
	});
}

export async function storeAssistantTurn(
	sessionId: string,
	projectId: string,
	content: string,
	tokenCount: number | null,
	modelUsed: string,
	latencyMs: number,
): Promise<ChatMessage> {
	logInfo("chat", `store_assistant_turn: session=${sessionId} tokens=${tokenCount}`);
	const r = await commands.storeAssistantTurn(
		sessionId,
		projectId,
		content,
		tokenCount,
		modelUsed,
		latencyMs,
	);
	return ok(r);
}

/** Whether a conversation gets your notes. */
export async function conversationNotes(sessionId: string): Promise<boolean> {
	return ok(await commands.conversationNotes(sessionId));
}

/** Say whether a conversation gets your notes. */
export async function setConversationNotes(sessionId: string, notes: boolean): Promise<void> {
	ok(await commands.conversationSetNotes(sessionId, notes));
}

/** Endpoint commands use a channel belonging only to this request. */
export async function endpointTarget(projectId: string, sessionId: string | null) {
	return ok(await commands.chatEndpointTarget(projectId, sessionId));
}
export async function startEndpoint(
	projectId: string,
	connectionId: string,
	revision: number,
	model: string,
) {
	return ok(await commands.chatEndpointStart(projectId, connectionId, revision, model));
}
export async function promptEndpoint(
	projectId: string,
	sessionId: string,
	requestId: string,
	content: string,
	onDelta: (text: string) => void,
) {
	const channel = new Channel<string>();
	channel.onmessage = onDelta;
	return ok(await commands.chatEndpointPrompt(projectId, sessionId, requestId, content, channel));
}
export async function cancelEndpoint(projectId: string, sessionId: string, requestId: string) {
	return ok(await commands.chatEndpointCancel(projectId, sessionId, requestId));
}
