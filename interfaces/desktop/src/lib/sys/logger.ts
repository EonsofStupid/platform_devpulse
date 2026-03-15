/**
 * @file sys/logger.ts
 * @module @devpulse/sys/logger
 * @description Frontend logger — buffers before IPC, flushes to Rust tracing after.
 *
 * All frontend log calls appear in the same session JSONL as backend logs,
 * tagged with target: "frontend" and the source module name.
 *
 * Before IPC is ready, logs are buffered in memory AND written to console.
 * Once IPC connects, the buffer is flushed to Rust and all subsequent
 * logs go directly to the Rust tracing pipeline → session log file.
 */

import { invoke } from "@tauri-apps/api/core";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

interface BufferedLog {
	level: LogLevel;
	target: string;
	message: string;
	timestamp: string;
}

/** Pre-IPC buffer — flushed once Tauri IPC is available. */
const buffer: BufferedLog[] = [];
let ipcReady = false;

/**
 * Mark IPC as ready and flush all buffered logs to Rust.
 * Called by platformState after waitForTauri() resolves.
 */
export function markIpcReady(): void {
	if (ipcReady) return;
	ipcReady = true;

	// Flush buffer
	for (const entry of buffer) {
		invoke("log", {
			level: entry.level,
			target: entry.target,
			message: `[buffered ${entry.timestamp}] ${entry.message}`,
		}).catch((e) => console.warn("[logger] IPC log failed:", e));
	}
	buffer.length = 0;
}

/**
 * Send a log message to the Rust backend via IPC.
 * Before IPC is ready, buffers in memory and writes to console.
 * After IPC is ready, sends directly to Rust tracing.
 */
export function log(level: LogLevel, target: string, message: string): void {
	const timestamp = new Date().toISOString();

	// Always write to console so devtools captures it
	const consoleFn = level === "trace" ? "debug" : level;
	console[consoleFn](`[${timestamp}] [${level.toUpperCase()}] [${target}] ${message}`);

	if (ipcReady) {
		invoke("log", { level, target, message }).catch((e) => console.warn("[logger] IPC log failed:", e));
	} else {
		buffer.push({ level, target, message, timestamp });
	}
}

export const logInfo = (target: string, msg: string): void =>
	log("info", target, msg);
export const logWarn = (target: string, msg: string): void =>
	log("warn", target, msg);
export const logError = (target: string, msg: string): void =>
	log("error", target, msg);
export const logDebug = (target: string, msg: string): void =>
	log("debug", target, msg);
