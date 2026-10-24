/**
 * @file Log levels → tones
 * @kind log
 * @layer behavior
 */

import type { LogLevel, LogTone } from "./log.types.js";

const TONE: Record<LogLevel, LogTone> = {
	error: "error",
	warn: "warning",
	info: "info",
	debug: "muted",
	trace: "muted",
};

/** The tone a level is drawn with. */
export function logLevelTone(level: LogLevel): LogTone {
	return TONE[level];
}
