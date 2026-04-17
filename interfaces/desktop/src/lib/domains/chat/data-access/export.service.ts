/**
 * @file Export orchestration — serialization + native path via IPC
 * @module @devpulse/domains/chat/data-access/export.service
 */

import type { ExportFormat } from "$lib/sys/generated/bindings.js";
import { exportAllSessions, exportSession, pickSaveFile } from "./chat.service.js";

export async function exportCurrentSessionToDisk(
	sessionId: string,
	format: ExportFormat,
	suggestedName: string,
): Promise<void> {
	const path = await pickSaveFile(suggestedName);
	if (!path) return;
	await exportSession(sessionId, format, path);
}

export async function exportAllToDisk(format: ExportFormat, suggestedName: string): Promise<void> {
	const path = await pickSaveFile(suggestedName);
	if (!path) return;
	await exportAllSessions(format, path);
}
