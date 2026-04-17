/**
 * @file ArkType contracts — chat domain util (zero in-domain imports)
 * @module @devpulse/domains/chat/util/chat.contract
 */

import { type } from "arktype";

export const MessageContract = type({
	id: "string",
	sessionId: "string",
	role: "'user' | 'assistant' | 'system'",
	content: "string",
	createdAt: "number",
	"tokenCount?": "number | null",
	"modelUsed?": "string | null",
	"latencyMs?": "number | null",
});

export const SessionContract = type({
	id: "string",
	title: "string | null",
	projectId: "string",
	isActive: "boolean",
	createdAt: "number",
	updatedAt: "number",
	endedAt: "number | null",
	messageCount: "number",
});

export const ExportFormatContract = type("'json' | 'markdown'");

export type Message = typeof MessageContract.infer;
export type Session = typeof SessionContract.infer;
export type ExportFormat = typeof ExportFormatContract.infer;
