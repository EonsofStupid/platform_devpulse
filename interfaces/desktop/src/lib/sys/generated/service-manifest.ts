/**
 * @file service-manifest.ts
 * @module @devpulse/sys/generated/service-manifest
 *
 * MIRRORS `BOOT_STEP_MANIFEST` in
 * `systems/devpulse-engine/src/platform/services/manifest.rs`.
 *
 * This file is the TypeScript-side SSOT for UI classification of boot-pipeline
 * step_ids. A unit test in the Rust manifest module reads this file and
 * enforces that every `BOOT_STEP_MANIFEST` entry appears here as a step_id
 * key with the matching `group` — if they drift, `cargo test` fails.
 *
 * Regen workflow:
 *   1. Edit `BOOT_STEP_MANIFEST` in manifest.rs.
 *   2. Mirror the change into `BOOT_STEP_MANIFEST` below (same step_id, same group).
 *   3. Run `cargo test -p devpulse-engine --lib platform::services::manifest::tests`
 *      — the cross-file sync test will pass if they align, fail otherwise.
 */

/**
 * UI grouping kinds. MUST match `ServiceGroup::as_ts_literal` in the Rust manifest.
 */
export type SubsystemGroupKind = "stores" | "graph" | "ai" | "system";

/** A single boot step emitted by `InitEvent::{running|ok|error|skipped}` from Rust. */
export interface BootStepMeta {
	readonly step_id: string;
	readonly group: SubsystemGroupKind;
	readonly feature_gate: string | null;
	readonly service_role: string | null;
	readonly data_scope: string | null;
}

/**
 * Every `InitEvent::step` string the boot pipeline may emit.
 *
 * Cross-checked against the Rust `BOOT_STEP_MANIFEST` by
 * `platform::services::manifest::tests::ts_manifest_matches_rust_manifest`.
 */
export const BOOT_STEP_MANIFEST: readonly BootStepMeta[] = Object.freeze([
	{ step_id: "preflight",              group: "system", feature_gate: null,        service_role: null,           data_scope: null      },
	{ step_id: "System relational",      group: "stores", feature_gate: null,        service_role: "Relational",   data_scope: "System"  },
	{ step_id: "System analytics",       group: "stores", feature_gate: null,        service_role: "Analytics",    data_scope: "System"  },
	{ step_id: "System cache",           group: "stores", feature_gate: null,        service_role: "Cache",        data_scope: "System"  },
	{ step_id: "User relational",        group: "stores", feature_gate: null,        service_role: "Relational",   data_scope: "User"    },
	{ step_id: "User analytics",         group: "stores", feature_gate: null,        service_role: "Analytics",    data_scope: "User"    },
	{ step_id: "Graph store",            group: "graph",  feature_gate: null,        service_role: "Graph",        data_scope: "System"  },
	{ step_id: "User graph namespace",   group: "graph",  feature_gate: null,        service_role: "Graph",        data_scope: "User"    },
	{ step_id: "Global graph namespace", group: "graph",  feature_gate: null,        service_role: "Graph",        data_scope: "Global"  },
	{ step_id: "SurrealDB sidecar",      group: "graph",  feature_gate: null,        service_role: "SurrealdbSidecar", data_scope: "System" },
	{ step_id: "SurrealDB HTTP",         group: "graph",  feature_gate: null,        service_role: null,           data_scope: null      },
	{ step_id: "Model Loader",           group: "ai",     feature_gate: "inference", service_role: "ModelLoader",  data_scope: "System"  },
	{ step_id: "Vector store",           group: "ai",     feature_gate: "rro",       service_role: "Vector",       data_scope: "System"  },
	// No "Grammar service" step — grammar / constrained decoding is Clyffy's
	// (wire-served); the desktop's grammar commands are connection-gated.
]) as readonly BootStepMeta[];

/** Map from step_id → group for O(1) classification. Frozen at module load. */
export const CLASSIFY_BY_STEP: Readonly<Record<string, SubsystemGroupKind>> = Object.freeze(
	Object.fromEntries(BOOT_STEP_MANIFEST.map((s) => [s.step_id, s.group])),
);

/**
 * Classify a step_id into its UI group.
 *
 * Unknown step_ids (e.g. new Rust emissions not yet mirrored here) fall back
 * to "system" so the UI never blanks — but the sync test catches the drift
 * so production builds have zero unknowns.
 */
export function classifyStep(stepId: string): SubsystemGroupKind {
	return CLASSIFY_BY_STEP[stepId] ?? "system";
}
