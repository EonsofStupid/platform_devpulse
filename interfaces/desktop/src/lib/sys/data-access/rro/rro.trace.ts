/**
 * @file RRO Tracer
 * @module @devpulse/domains/sys/rro/data-access
 *
 * Per-capability tracing switch. Every service call is traceable, but
 * verbose tracing only fires when the capability's `debug` flag is on AND
 * the global RRO_DEBUG flag is enabled.
 *
 * Correlates with action-bus via `withAction()` — run_id flows through
 * session JSONL and DuckDB spans automatically.
 */

import {
	type Capability,
	getCapability,
} from "$lib/devtools/clyffy/reasoning/rro/util/rro.capabilities.js";
import type { RroTabId } from "$lib/devtools/clyffy/reasoning/rro/util/rro.types.js";
import { logDebug, logInfo, logWarn } from "$lib/sys/logger.js";

/** Global debug toggle. Set via devtool footer or URL flag. */
let RRO_DEBUG = false;

/** Enable/disable verbose RRO tracing at runtime. */
export function setRroDebug(on: boolean): void {
	RRO_DEBUG = on;
	logInfo("rro.trace", `debug=${on}`);
}

/** Check current debug state (read-only). */
export function isRroDebug(): boolean {
	return RRO_DEBUG;
}

/** Whether a specific capability should emit verbose traces. */
export function shouldTrace(cap: Capability | RroTabId): boolean {
	const c = typeof cap === "string" ? getCapability(cap) : cap;
	return RRO_DEBUG && c.debug;
}

/**
 * Wrap any async operation with named trace spans.
 *
 * - Always emits a `logInfo` start/end line with elapsed ms.
 * - When the capability has debug=true AND RRO_DEBUG is on, emits additional
 *   `logDebug` with payload hints (non-PII only — never log query text).
 *
 * Composes with `withAction()` — use withAction as the outer wrapper for
 * user-initiated calls, use `trace()` for inner operations.
 */
export async function trace<T>(cap: RroTabId, op: string, fn: () => Promise<T>): Promise<T> {
	const capability = getCapability(cap);
	const t0 = performance.now();
	const verbose = shouldTrace(capability);
	const target = `rro.${cap}`;

	if (verbose) {
		logDebug(target, `→ ${op} start`);
	}

	try {
		const result = await fn();
		const elapsed = Math.round(performance.now() - t0);
		logInfo(target, `${op} ok in ${elapsed}ms`);
		return result;
	} catch (e) {
		const elapsed = Math.round(performance.now() - t0);
		const msg = e instanceof Error ? e.message : String(e);
		logWarn(target, `${op} FAILED in ${elapsed}ms: ${msg}`);
		throw e;
	}
}
