/**
 * Platform shared devtool primitives — the uniform chrome every
 * per-service devtool wraps around.
 *
 * See the Module Charter (`scripts/docs/sprints/SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md`)
 * § 7 — every devtool implements Status / Config / Logs / Actions
 * via `ServiceDevtoolShell`. Extra service-specific tabs sit after
 * the four standard ones.
 */

export { default as ServiceDevtoolShell } from "./ServiceDevtoolShell.svelte";
export type { ExtraTab, HealthBadge, HealthState, ServiceAxis } from "./types.js";
