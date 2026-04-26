/**
 * Platform shared devtool primitives — the uniform chrome every
 * per-service devtool wraps around.
 *
 * See the Module Charter (`scripts/docs/sprints/SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md`)
 * § 7 — every devtool implements Status / Config / Logs / Actions
 * via `ServiceDevtoolShell`. Extra service-specific tabs sit after
 * the four standard ones.
 */

export { default as DevtoolDescription } from "./DevtoolDescription.svelte";
export { default as DevtoolEmptyState } from "./DevtoolEmptyState.svelte";
export { default as DevtoolErrorPanel } from "./DevtoolErrorPanel.svelte";
export type { LogTargetPreset } from "./DevtoolLogsTab.svelte";
export { default as DevtoolLogsTab } from "./DevtoolLogsTab.svelte";
export { default as DevtoolRefreshButton } from "./DevtoolRefreshButton.svelte";
export { default as DevtoolStatBox } from "./DevtoolStatBox.svelte";
export { default as RepoDownloadButton } from "./RepoDownloadButton.svelte";
export {
	formatBytes,
	type PrimaryResolution,
	type RepoFile,
	resolvePrimaryFile,
	totalBundleSizeBytes,
} from "./resolve-primary-file.js";
export { default as ScopedLogPanel } from "./ScopedLogPanel.svelte";
export { default as ServiceDevtoolShell } from "./ServiceDevtoolShell.svelte";
export { default as SwapPrimaryBrainButton } from "./SwapPrimaryBrainButton.svelte";
export {
	accentToBackdropPalette,
	type BrandAccent,
	DEFAULT_SERVICE_ACCENT,
	DEFAULT_SERVICE_BACKDROP,
	SERVICE_ACCENTS,
	SERVICE_BACKDROPS,
	type ServiceBackdrop,
	serviceAccent,
	serviceAccentStyle,
	serviceBackdrop,
} from "./serviceAccents.js";
export type { CapturePayload, ExtraTab, HealthBadge, HealthState, ServiceAxis } from "./types.js";
