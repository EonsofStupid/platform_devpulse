/**
 * @file sys/logger.ts
 * @module @devpulse/sys/logger
 * @description Frontend logger — bridges to Rust tracing via Tauri IPC.
 *
 * All frontend log calls appear in the same session JSONL as backend logs,
 * tagged with target: "frontend" and the source module name.
 */

import { invoke } from "@tauri-apps/api/core";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

/**
 * Send a log message to the Rust backend via IPC.
 * Falls back to console if IPC is unavailable (e.g., during SSR or before Tauri mounts).
 */
export function log(level: LogLevel, target: string, message: string): void {
	invoke("log", { level, target, message }).catch(() => {
		const consoleFn = level === "trace" ? "debug" : level;
		console[consoleFn](`[${target}] ${message}`);
	});
}

export const logInfo = (target: string, msg: string): void =>
	log("info", target, msg);
export const logWarn = (target: string, msg: string): void =>
	log("warn", target, msg);
export const logError = (target: string, msg: string): void =>
	log("error", target, msg);
export const logDebug = (target: string, msg: string): void =>
	log("debug", target, msg);
