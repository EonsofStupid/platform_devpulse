/**
 * @file Chat IPC boundary — ONLY `invoke` site for this domain
 * @module @devpulse/domains/chat/data-access/chat.service
 */

import { projectsState } from "$lib/domains/app/projects/index.js";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import {
	type ChatMessage,
	type ChatSession,
	commands,
	type ExportFormat,
	type ExportSummary,
} from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

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

export async function sendMessage(projectId: string, content: string): Promise<ChatMessage> {
	return withAction("chat.send", "Sending your message to the model…", async () => {
		logInfo("chat", "send_message");
		const pid = projectId || activeProjectId();
		if (!pid) throw new Error("No active project — open a project in DevPulse first.");
		const r = await commands.sendMessage(pid, content);
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
	tokenCount: number,
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
