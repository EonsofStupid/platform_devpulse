/**
 * @file StatusBar.types.ts
 * @module @devpulse/layouts/app/StatusBar
 *
 * Subsystem grouping helpers for StatusBar and Dashboard health displays.
 * Classification logic lives in `$lib/sys/generated/service-manifest.ts`,
 * which mirrors `BOOT_STEP_MANIFEST` in the Rust engine — a `cargo test`
 * enforces the two stay in sync.
 */

import type { SubsystemHealth } from "$lib/sys/generated/health.types.js";
import { classifyStep, type SubsystemGroupKind } from "$lib/sys/generated/service-manifest.js";
import type { SubsystemInfo } from "$lib/sys/runes/platformState.svelte.js";

export type { SubsystemGroupKind };

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

/**
 * Classify a subsystem by its emitted `InitEvent::step` name.
 *
 * Delegates to the generated `classifyStep` — do not re-implement inline,
 * that just forks the SSOT.
 */
export function classifySubsystem(name: string): SubsystemGroupKind {
	return classifyStep(name);
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
		const key = s.group;
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
