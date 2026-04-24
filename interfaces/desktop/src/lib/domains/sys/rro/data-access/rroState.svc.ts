/**
 * @file RRO State Service — Tauri IPC wrappers for the RRO state machine.
 * @module @devpulse/domains/sys/rro/data-access
 *
 * Thin wrappers around the 6 specta-generated `commands.*Rro*` calls.
 * Every function throws on error — callers decide handling.
 *
 * # Live updates
 *
 * `subscribeRroState` wraps Tauri's `listen()` on `platform:rro-state-changed`.
 * The engine handle broadcasts the full snapshot on every transition, so
 * subscribers replace their entire view rather than diff.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { commands } from "$lib/sys/generated/bindings.js";
import { withRetry } from "$lib/sys/retry.js";
import type { RroDepth, RroStateSnapshot } from "../util/rro.types.js";
import { trace } from "./rro.trace.js";

const EVENT_NAME = "platform:rro-state-changed";

/** Fetch the current snapshot. Idempotent — retried on transient error. */
export async function getRroState(): Promise<RroStateSnapshot> {
	return trace("tuning", "getRroState", () =>
		withRetry(
			async () => {
				const r = await commands.getRroState();
				if (r.status === "error") throw new Error(r.error);
				return r.data;
			},
			{ label: "rro.state.get" },
		),
	);
}

/** Set deliberation depth. Does not transition state. Returns new snapshot. */
export async function setRroDepth(depth: RroDepth): Promise<RroStateSnapshot> {
	return trace("tuning", `setRroDepth(${depth})`, async () => {
		const r = await commands.setRroDepth(depth);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}

/** Trigger a gather with an opaque provenance source. */
export async function triggerGather(source: string): Promise<RroStateSnapshot> {
	return trace("tuning", `triggerGather(${source})`, async () => {
		const r = await commands.triggerRroGather(source);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}

/** Trigger a purge with a layman reason. */
export async function triggerPurge(reason: string): Promise<RroStateSnapshot> {
	return trace("tuning", `triggerPurge(${reason})`, async () => {
		const r = await commands.triggerRroPurge(reason);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}

/** Trigger a fork with a label. */
export async function triggerFork(label: string): Promise<RroStateSnapshot> {
	return trace("tuning", `triggerFork(${label})`, async () => {
		const r = await commands.triggerRroFork(label);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}

/** Set proximity (clamped server-side to [0,1]). */
export async function setProximity(value: number): Promise<RroStateSnapshot> {
	return trace("tuning", `setProximity(${value.toFixed(2)})`, async () => {
		const r = await commands.setRroProximity(value);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}

/**
 * Subscribe to live RRO state transitions. Returns an unlisten function.
 *
 * The handler fires once per transition with the full new snapshot.
 * The engine's broadcast channel is bounded — receivers that fall behind
 * lose intermediate events, but always get a consistent latest-known state.
 */
export async function subscribeRroState(
	handler: (snapshot: RroStateSnapshot) => void,
): Promise<UnlistenFn> {
	return listen<RroStateSnapshot>(EVENT_NAME, (event) => {
		handler(event.payload);
	});
}
