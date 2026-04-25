/**
 * @file sys/bindings/chat/index.ts
 * @description Chat IPC facade — sessions, history, exports, reactions.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const pickSaveFile = commands.pickSaveFile;
export const sendMessage = commands.sendMessage;
export const storeAssistantTurn = commands.storeAssistantTurn;
export const loadRecent = commands.loadRecent;
export const listSessions = commands.listSessions;
export const deleteSession = commands.deleteSession;
export const clearAllChatHistory = commands.clearAllChatHistory;
export const exportSession = commands.exportSession;
export const exportAllSessions = commands.exportAllSessions;
export const postReaction = commands.postReaction;

export type { ChatMessage } from "$lib/sys/bindings/_shared";
export type {
	ChatSession,
	ExportFormat,
	ExportSummary,
} from "$lib/sys/generated/bindings.js";
