/**
 * Platform shared devtool primitives — the uniform chrome every
 * per-service devtool wraps around.
 *
 * See the Module Charter (`scripts/docs/sprints/SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md`)
 * § 7 — every devtool implements Status / Config / Logs / Actions
 * via `ServiceDevtoolShell`. Extra service-specific tabs sit after
 * the four standard ones.
 */

export { default as RepoDownloadButton } from "./RepoDownloadButton.svelte";
export {
	formatBytes,
	type PrimaryResolution,
	type RepoFile,
	resolvePrimaryFile,
	totalBundleSizeBytes,
} from "./resolve-primary-file.js";
export { default as ServiceDevtoolShell } from "./ServiceDevtoolShell.svelte";
export { default as SwapPrimaryBrainButton } from "./SwapPrimaryBrainButton.svelte";
export {
	type BrandAccent,
	DEFAULT_SERVICE_ACCENT,
	SERVICE_ACCENTS,
	serviceAccent,
	serviceAccentStyle,
} from "./serviceAccents.js";
export type { CapturePayload, ExtraTab, HealthBadge, HealthState, ServiceAxis } from "./types.js";
