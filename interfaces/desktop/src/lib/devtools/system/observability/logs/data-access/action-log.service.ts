/**
 * @file action-log.service.ts — the Action log's IPC.
 * @module @devpulse/devtools/system/observability/logs
 *
 * The only place the Action log talks to Rust. Both commands return
 * `CommandError` on failure (plan 0008 R20a).
 */

import { commands } from "#lib/sys/generated/bindings.js";

/** Lines appended to today's action log since `fromOffset` (a byte offset), and where the next read starts. */
export const tailActionLog = (fromOffset: number) => commands.tailActionLog(fromOffset);

/** Open the folder that holds every day's action log in the OS file manager. */
export const openActionLogsFolder = () => commands.openActionLogsFolder();
