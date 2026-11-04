/**
 * @file sys/bindings/sys/action-log/index.ts
 * @description JSONL action-log tail + folder reveal.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const tailActionLog = commands.tailActionLog;
export const openActionLogsFolder = commands.openActionLogsFolder;

export type { ActionLogTail } from "#lib/sys/generated/bindings.js";
