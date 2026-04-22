/**
 * @file Brain Service — Tauri IPC wrappers for SurrealDB (the knowledge graph).
 * @module @devpulse/domains/sys/rro/data-access
 *
 * The Brain backs the RRO gather phase. Its wire commands live under
 * `graph_*` in the Tauri layer. This file names them in domain terms:
 * "Brain" is the public vocabulary per signals.registry.yaml.
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { withRetry } from "$lib/sys/retry.js";
import type { GraphHealthAll, GraphNamespace, GraphNamespaceStats } from "../util/rro.types.js";
import { trace } from "./rro.trace.js";

/** Check all 3 namespaces + HTTP server in one shot. */
export async function getBrainHealth(): Promise<GraphHealthAll> {
	return trace("brain", "getBrainHealth", () =>
		withRetry(
			async () => {
				const r = await commands.graphHealthAll();
				if (r.status === "error") throw new Error(r.error);
				return r.data;
			},
			{ label: "rro.brain.health" },
		),
	);
}

/** Per-namespace stats — table list + record counts. */
export async function getBrainStats(ns: GraphNamespace): Promise<GraphNamespaceStats> {
	return trace("brain", `getBrainStats(${ns})`, () =>
		withRetry(
			async () => {
				const r = await commands.graphStats(ns);
				if (r.status === "error") throw new Error(r.error);
				return r.data;
			},
			{ label: `rro.brain.stats.${ns}` },
		),
	);
}
