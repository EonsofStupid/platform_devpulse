/**
 * @file sys/logger.ts
 * @module @devpulse/sys/logger
 * @description Frontend logger — captures EVERYTHING to the Rust tracing pipeline.
 *
 * All frontend log calls appear in the same session JSONL as backend logs,
 * tagged with target: "frontend" and the source module name.
 *
 * Before IPC is ready, logs are buffered in memory AND written to console.
 * Once IPC connects, the buffer is flushed to Rust and all subsequent
 * logs go directly to the Rust tracing pipeline → session log file.
 *
 * Global error handlers capture ALL unhandled errors, promise rejections,
 * and console.error calls — not just explicit logError() calls.
 */

import { invoke } from "@tauri-apps/api/core";
import { setFatal } from "./fatal-error.svelte.js";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

interface BufferedLog {
	level: LogLevel;
	target: string;
	message: string;
	timestamp: string;
	runId: string | null;
}

/** Pre-IPC buffer — flushed once Tauri IPC is available. */
const buffer: BufferedLog[] = [];
let ipcReady = false;
let globalHandlersInstalled = false;

/**
 * Shape of entries pushed by the minimal inline script in `app.html`.
 * Field names are single letters to keep the inline script tiny; this is
 * the same shape Sentry/Bugsnag-style pre-SDK shims emit.
 */
interface EarlyErrorEntry {
	/** "error" = window error event, "rejection" = unhandled promise rejection. */
	t: "error" | "rejection";
	/** message (error events) */
	m?: string;
	/** filename (error events) */
	f?: string;
	/** lineno (error events) */
	l?: number;
	/** colno (error events) */
	c?: number;
	/** stack (both) */
	s?: string;
}

declare global {
	interface Window {
		__DEVPULSE_EARLY_ERRORS__?: EarlyErrorEntry[];
	}
}

/**
 * Drain `window.__DEVPULSE_EARLY_ERRORS__` — errors captured by the inline
 * script in `app.html` BEFORE any module loaded — into the IPC buffer so
 * they flush to Rust the moment `markIpcReady()` fires.
 *
 * Must run before `markIpcReady()` to guarantee ordering.
 */
function drainEarlyErrors(): void {
	const early = window.__DEVPULSE_EARLY_ERRORS__;
	if (!early || early.length === 0) return;

	const timestamp = new Date().toISOString();
	for (const entry of early) {
		const target = entry.t === "error" ? "frontend:early:error" : "frontend:early:rejection";
		const parts: string[] = [];
		if (entry.m) parts.push(entry.m);
		if (entry.f) parts.push(`at ${entry.f}:${entry.l ?? 0}:${entry.c ?? 0}`);
		if (entry.s) parts.push(entry.s);
		const message = parts.length > 0 ? parts.join("\n") : JSON.stringify(entry);
		buffer.push({
			level: "error",
			target,
			message: `[early] ${message}`,
			timestamp,
			runId: null,
		});
	}

	early.length = 0;
}

/**
 * Active run ID from withAction() — correlates frontend logs with backend spans.
 * Set by action-bus.svelte.ts, read by log() to inject into every IPC log call.
 */
let activeRunId: string | null = null;

/** Set the active run ID (called by withAction start). Returns previous value for nesting. */
export function setActiveRunId(runId: string | null): string | null {
	const prev = activeRunId;
	activeRunId = runId;
	return prev;
}

/** Get the active run ID (for IPC commands that want to forward it). */
export function getActiveRunId(): string | null {
	return activeRunId;
}

/**
 * Mark IPC as ready and flush all buffered logs to Rust.
 * Called by platformState after waitForTauri() resolves.
 */
export function markIpcReady(): void {
	if (ipcReady) return;

	// Drain any pre-module errors captured by the inline script in app.html
	// BEFORE flushing, so they appear ahead of module-origin logs.
	drainEarlyErrors();

	ipcReady = true;

	// Flush buffer
	for (const entry of buffer) {
		invoke("log", {
			level: entry.level,
			target: entry.target,
			message: `[buffered ${entry.timestamp}] ${entry.message}`,
			runId: entry.runId,
		}).catch((e) => console.warn("[logger] IPC log failed:", e));
	}
	buffer.length = 0;
}

/**
 * Install global error handlers to capture ALL frontend errors.
 * Call once at app startup (root layout onMount).
 *
 * Captures:
 * - window.onerror (uncaught exceptions)
 * - window.onunhandledrejection (unhandled promise rejections)
 * - console.error (any console.error call, including Svelte render errors)
 * - console.warn (any console.warn call)
 */
export function installGlobalHandlers(): void {
	if (globalHandlersInstalled) return;
	globalHandlersInstalled = true;

	// Capture uncaught exceptions
	window.addEventListener("error", (event) => {
		const msg = event.error
			? `${event.message} at ${event.filename}:${event.lineno}:${event.colno}\n${event.error.stack || ""}`
			: event.message;
		log("error", "frontend:uncaught", msg);
		setFatal({
			message: event.message || "uncaught error",
			stack: event.error?.stack ?? null,
			origin: "uncaught",
			capturedAt: Date.now(),
		});
	});

	// Capture unhandled promise rejections
	window.addEventListener("unhandledrejection", (event) => {
		const reason =
			event.reason instanceof Error
				? `${event.reason.message}\n${event.reason.stack || ""}`
				: String(event.reason);
		log("error", "frontend:unhandled_rejection", reason);
		setFatal({
			message: event.reason instanceof Error ? event.reason.message : String(event.reason),
			stack: event.reason instanceof Error ? (event.reason.stack ?? null) : null,
			origin: "unhandled_rejection",
			capturedAt: Date.now(),
		});
	});

	// Intercept console.error — captures Svelte render errors, library errors, etc.
	const originalError = console.error;
	console.error = (...args: unknown[]) => {
		originalError.apply(console, args);
		const msg = args
			.map((a) => (a instanceof Error ? `${a.message}\n${a.stack}` : String(a)))
			.join(" ");
		log("error", "frontend:console", msg);
	};

	// Intercept console.warn
	const originalWarn = console.warn;
	console.warn = (...args: unknown[]) => {
		originalWarn.apply(console, args);
		const msg = args.map((a) => String(a)).join(" ");
		log("warn", "frontend:console", msg);
	};

	// Intercept console.log / info / debug so EVERY third-party library
	// emission lands in the session JSONL. Without this, libraries like
	// Svelte runtime, tauri-apps/plugin-*, @tanstack/svelte-query, etc. log
	// to the browser console only — invisible to post-mortem debugging.
	// Dev is the audience; release still captures these via the Rust
	// tracing pipeline at info/debug level.
	// biome-ignore lint/suspicious/noConsole: intentional logging facade — this IS the console wrapper
	const originalLog = console.log;
	console.log = (...args: unknown[]) => {
		originalLog.apply(console, args);
		const msg = args.map((a) => String(a)).join(" ");
		log("info", "frontend:console", msg);
	};

	const originalInfo = console.info;
	console.info = (...args: unknown[]) => {
		originalInfo.apply(console, args);
		const msg = args.map((a) => String(a)).join(" ");
		log("info", "frontend:console", msg);
	};

	// biome-ignore lint/suspicious/noConsole: intentional logging facade
	const originalDebug = console.debug;
	console.debug = (...args: unknown[]) => {
		originalDebug.apply(console, args);
		const msg = args.map((a) => String(a)).join(" ");
		log("debug", "frontend:console", msg);
	};

	// Wrap EVERY Tauri IPC call at the internals layer — bindings.ts is
	// specta-generated and imports `invoke` from @tauri-apps/api/core,
	// which delegates to `window.__TAURI_INTERNALS__.invoke`. Patching
	// that function captures every IPC roundtrip (cmd, args, duration,
	// result or error) regardless of which binding made the call.
	//
	// `__TAURI_INTERNALS__.invoke` is exposed non-writable in current
	// Tauri versions, so plain `internals.invoke = …` throws `TypeError:
	// Cannot assign to read only property`. We redefine via
	// `Object.defineProperty` with `configurable: true`, which Tauri
	// permits today. If a future Tauri version also locks
	// `configurable: false`, the try/catch below keeps boot alive with
	// IPC logging disabled instead of crashing the whole app.
	//
	// The `cmd === "log"` early-return is mandatory: `log()` itself
	// calls `invoke("log", …)` once IPC is ready. Without this guard
	// the wrap would log the log call, which would call log, which
	// would call invoke("log"), which would hit the wrap again —
	// infinite recursion blowing the stack on the first `markIpcReady()`
	// buffer flush.
	//
	// No-op if Tauri internals aren't available yet (e.g. SSR context
	// or before webview bridge established). `globalHandlersInstalled`
	// at the top of this function already gates re-entry, so the
	// `__devpulse_wrapped__` check is defense-in-depth for the singular
	// case where a stale flag outlives a module reload.
	// biome-ignore lint/suspicious/noExplicitAny: Tauri internals typed loosely
	const internals = (window as any).__TAURI_INTERNALS__;
	if (internals && typeof internals.invoke === "function" && !internals.__devpulse_wrapped__) {
		const originalInvoke = internals.invoke.bind(internals);
		// biome-ignore lint/suspicious/noExplicitAny: generic IPC signature
		const wrappedInvoke = (cmd: string, args?: unknown, options?: unknown): Promise<any> => {
			// Skip the log command to break the log → invoke("log") → wrap → log recursion.
			if (cmd === "log") {
				return originalInvoke(cmd, args, options);
			}
			const start = performance.now();
			let argsSerialized = "<unserializable>";
			try {
				argsSerialized = JSON.stringify(args ?? null);
				if (argsSerialized.length > 2000) {
					argsSerialized = `${argsSerialized.slice(0, 2000)}…[truncated ${argsSerialized.length} chars]`;
				}
			} catch {
				/* keep fallback */
			}
			log("debug", "frontend:ipc", `→ ${cmd} args=${argsSerialized}`);
			return originalInvoke(cmd, args, options)
				.then((result: unknown) => {
					const ms = Math.round(performance.now() - start);
					let resultPreview = "<unserializable>";
					try {
						const s = JSON.stringify(result ?? null);
						resultPreview = s.length > 500 ? `${s.slice(0, 500)}…` : s;
					} catch {
						/* keep fallback */
					}
					log("debug", "frontend:ipc", `← ${cmd} (${ms}ms) result=${resultPreview}`);
					return result;
				})
				.catch((err: unknown) => {
					const ms = Math.round(performance.now() - start);
					const msg = err instanceof Error ? err.message : String(err);
					log("error", "frontend:ipc", `✗ ${cmd} (${ms}ms) error=${msg}`);
					throw err;
				});
		};
		try {
			Object.defineProperty(internals, "invoke", {
				value: wrappedInvoke,
				writable: true,
				configurable: true,
			});
			Object.defineProperty(internals, "__devpulse_wrapped__", {
				value: true,
				writable: false,
				configurable: true,
			});
		} catch (err) {
			// Tauri future-version hardening: if the descriptor locks
			// configurable too, boot continues without IPC logging rather
			// than dying on the first user action.
			log("warn", "frontend:ipc", `IPC logging disabled — cannot wrap invoke: ${String(err)}`);
		}
	}
}

/**
 * Send a log message to the Rust backend via IPC.
 * Before IPC is ready, buffers in memory AND writes to console.
 * After IPC is ready, sends directly to Rust tracing.
 */
export function log(level: LogLevel, target: string, message: string): void {
	const timestamp = new Date().toISOString();

	// Action channel: structured JSON only — no console spam (HUD + action.jsonl).
	if (target === "action") {
		if (ipcReady) {
			invoke("log", { level, target, message, runId: null }).catch(() => {});
		} else {
			buffer.push({ level, target, message, timestamp, runId: null });
		}
		return;
	}

	// Always write to console so devtools captures it
	const consoleFn =
		level === "error"
			? "error"
			: level === "warn"
				? "warn"
				: level === "debug" || level === "trace"
					? "debug"
					: "log";
	// Use original console to avoid infinite loop from intercepted console.error/warn
	if (target !== "frontend:console") {
		// biome-ignore lint/suspicious/noConsole: intentional logging facade — this IS the console wrapper
		Function.prototype.apply.call(console[consoleFn as keyof Console], console, [
			`[${target}] ${message}`,
		]);
	}

	const rid = activeRunId;
	if (ipcReady) {
		invoke("log", { level, target, message, runId: rid }).catch(() => {
			// Silent — if IPC fails, console already has it
		});
	} else {
		buffer.push({ level, target, message, timestamp, runId: rid });
	}
}

export const logInfo = (target: string, msg: string): void => log("info", target, msg);
export const logWarn = (target: string, msg: string): void => log("warn", target, msg);
export const logError = (target: string, msg: string): void => log("error", target, msg);
export const logDebug = (target: string, msg: string): void => log("debug", target, msg);
