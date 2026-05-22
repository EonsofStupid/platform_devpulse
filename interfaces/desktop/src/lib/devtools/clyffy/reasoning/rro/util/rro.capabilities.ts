/**
 * @file RRO Capability Manifest
 * @module @devpulse/domains/sys/rro/util
 *
 * Single source of truth for what the RRO devtool exposes. Each capability:
 *  - has a stable ID (used for tab switching, telemetry, feature flags)
 *  - declares its backend dependency (so panels can auto-hide when unavailable)
 *  - carries layman copy (label + one-liner) shown in UI
 *  - opts into verbose tracing under debug mode
 *
 * Adding a new capability = add one entry here + one Panel.svelte.
 * Everything else (tabs, logging, feature-gate) derives from this table.
 */

import type { RroTabId } from "./rro.types.js";

/** Which backend service a capability depends on. */
export type CapabilityBackend = "vector" | "graph" | "model_loader" | "reasoning";

export interface Capability {
	/** Stable ID — matches RroTabId. */
	id: RroTabId;
	/** Tab label — layman copy, no jargon. */
	label: string;
	/** One-line subtitle shown in the tab bar / header. */
	tagline: string;
	/** Which backend service must be healthy for this capability to function. */
	backend: CapabilityBackend;
	/** Whether this capability exposes verbose traces when debug flag is on. */
	debug: boolean;
	/** Icon key — resolved in the component to a lucide icon. */
	icon: "search" | "settings" | "database" | "shapes" | "activity";
}

export const RRO_CAPABILITIES: readonly Capability[] = [
	{
		id: "state",
		label: "State",
		tagline: "Live rumination lifecycle — gather, purge, fork.",
		backend: "reasoning",
		debug: true,
		icon: "activity",
	},
	{
		id: "search",
		label: "Try It",
		tagline: "Run a query against a knowledge store.",
		backend: "vector",
		debug: true,
		icon: "search",
	},
	{
		id: "tuning",
		label: "Tuning",
		tagline: "Presets and fine-grained retrieval knobs.",
		backend: "vector",
		debug: true,
		icon: "settings",
	},
	{
		id: "collections",
		label: "Knowledge Stores",
		tagline: "Create, inspect, and prune stored knowledge.",
		backend: "vector",
		debug: false,
		icon: "database",
	},
	{
		id: "encoder",
		label: "Encoder",
		tagline: "The text-to-vector model that powers search.",
		backend: "model_loader",
		debug: false,
		icon: "shapes",
	},
	{
		// `brain` is a trace-category, not a UI tab — it groups the
		// SurrealDB knowledge-graph IPC calls under a single log
		// target (`rro.brain.*`). Surface label/tagline kept for
		// completeness in case a future tab adopts it.
		id: "brain",
		label: "Brain",
		tagline: "Knowledge graph — SurrealDB across 3 namespaces.",
		backend: "graph",
		debug: true,
		icon: "database",
	},
] as const;

/** Get a capability by its ID. */
export function getCapability(id: RroTabId): Capability {
	const cap = RRO_CAPABILITIES.find((c) => c.id === id);
	if (!cap) throw new Error(`Unknown capability: ${id}`);
	return cap;
}
