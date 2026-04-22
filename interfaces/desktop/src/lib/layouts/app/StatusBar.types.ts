/**
 * @file StatusBar.types.ts
 * @module @devpulse/layouts/app/StatusBar
 *
 * Subsystem grouping constants for StatusBar and Dashboard health displays.
 * Shared by StatusBar.svelte and routes/(app)/devpulse/+page.svelte.
 */

import type { SubsystemHealth } from "$lib/sys/generated/health.types.js";
import type { SubsystemInfo } from "$lib/sys/runes/platformState.svelte.js";

/**
 * Subsystem names that belong to each health group.
 *
 * Keys MUST match the literal strings emitted by
 * `systems/devpulse-engine/src/platform/boot/*` via
 * `InitEvent::running/ok/error/skipped` — i.e. the same values the
 * Rust backend puts on the `platform:subsystem-status` Tauri event.
 * These are the authoritative `engine` names also registered in
 * `systems/devpulse-engine/ip/kernel_terms.toml`.
 */
export const STORE_NAMES = new Set([
	"System relational",
	"User relational",
	"System analytics",
	"System cache",
]);

export const GRAPH_NAMES = new Set([
	"Graph store",
	"SurrealDB HTTP",
	"User graph namespace",
	"Global graph namespace",
]);

export const AI_NAMES = new Set(["Model Loader", "Vector store"]);

/** Discriminator used by consumers to pick icons, colors, and narration heuristics. */
export type SubsystemGroupKind = "stores" | "graph" | "ai" | "system";

/** A labeled group of subsystems for display. */
export interface HealthGroup {
	label: string;
	kind: SubsystemGroupKind;
	subs: SubsystemHealth[];
}

/** A labeled group of boot-time subsystem info for StatusBar. */
export interface SubsystemGroup {
	label: string;
	kind: SubsystemGroupKind;
	subs: SubsystemInfo[];
}

/** Classify a subsystem name into a group key. */
export function classifySubsystem(name: string): SubsystemGroupKind {
	if (STORE_NAMES.has(name)) return "stores";
	if (GRAPH_NAMES.has(name)) return "graph";
	if (AI_NAMES.has(name)) return "ai";
	return "system";
}

/** Group SubsystemInfo[] (boot-time) into labeled groups. */
export function groupSubsystems(subs: SubsystemInfo[]): SubsystemGroup[] {
	const stores: SubsystemInfo[] = [];
	const graph: SubsystemInfo[] = [];
	const ai: SubsystemInfo[] = [];
	const system: SubsystemInfo[] = [];

	subs.forEach((s) => {
		const key = classifySubsystem(s.name);
		if (key === "stores") stores.push(s);
		else if (key === "graph") graph.push(s);
		else if (key === "ai") ai.push(s);
		else system.push(s);
	});

	const groups: SubsystemGroup[] = [];
	if (stores.length > 0) groups.push({ label: "Stores", kind: "stores", subs: stores });
	if (graph.length > 0) groups.push({ label: "Graph", kind: "graph", subs: graph });
	if (ai.length > 0) groups.push({ label: "AI", kind: "ai", subs: ai });
	if (system.length > 0) groups.push({ label: "Sys", kind: "system", subs: system });
	return groups;
}

/** Group SubsystemHealth[] (post-boot health) into labeled groups. */
export function groupHealthSubsystems(subs: SubsystemHealth[]): HealthGroup[] {
	const stores: SubsystemHealth[] = [];
	const graph: SubsystemHealth[] = [];
	const ai: SubsystemHealth[] = [];
	const system: SubsystemHealth[] = [];

	subs.forEach((s) => {
		const key = classifySubsystem(s.name);
		if (key === "stores") stores.push(s);
		else if (key === "graph") graph.push(s);
		else if (key === "ai") ai.push(s);
		else system.push(s);
	});

	const groups: HealthGroup[] = [];
	if (stores.length > 0) groups.push({ label: "Data Stores", kind: "stores", subs: stores });
	if (graph.length > 0) groups.push({ label: "Graph", kind: "graph", subs: graph });
	if (ai.length > 0) groups.push({ label: "AI", kind: "ai", subs: ai });
	if (system.length > 0) groups.push({ label: "System", kind: "system", subs: system });
	return groups;
}
