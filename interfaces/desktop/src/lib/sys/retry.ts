/**
 * @file retry.ts
 * @description Retry helper for idempotent IPC reads. Exponential backoff with a cap.
 *
 * DO NOT use for mutations (create/delete/setXxx) — double-execution risk.
 * SAFE for reads: loadHealth, getConfig, getParamMeta, getSlots, etc.
 */

import { logWarn } from "./logger.js";

export interface RetryOptions {
	/** Max total attempts (default 3 = 1 try + 2 retries). */
	maxAttempts?: number;
	/** Base delay in ms for exponential backoff (default 120). */
	baseDelayMs?: number;
	/** Multiplier per attempt (default 3 → 120, 360, 1080). */
	multiplier?: number;
	/** Context label for logs (e.g. "rro.loadHealth"). */
	label?: string;
}

/**
 * Run an async function, retrying on failure with exponential backoff.
 *
 * - ONLY wrap idempotent operations.
 * - Logs every retry attempt so transient failures are visible in action.jsonl.
 * - On final failure, rethrows the last error.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
	const maxAttempts = opts.maxAttempts ?? 3;
	const baseDelayMs = opts.baseDelayMs ?? 120;
	const multiplier = opts.multiplier ?? 3;
	const label = opts.label ?? "retry";

	let lastError: unknown;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (e) {
			lastError = e;
			if (attempt < maxAttempts) {
				const delayMs = baseDelayMs * multiplier ** (attempt - 1);
				const msg = e instanceof Error ? e.message : String(e);
				logWarn(
					label,
					`attempt ${attempt}/${maxAttempts} failed: ${msg}. Retrying in ${delayMs}ms`,
				);
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
	}
	throw lastError;
}
