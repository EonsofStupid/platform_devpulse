/**
 * Devtools public barrel — the devtools tree read from the route folders
 * (plan 0008), the facts a devtools folder declares (`_devtool`), and the
 * uniform shell chrome every per-service devtool wraps around.
 *
 * Convention: tab bodies compose **shipped ColdLight primitives**
 * directly (`Stat`, `EmptyState`, `Callout`, `Alert`, `Tabs`,
 * `Tooltip`, `Card preset="glass"`, `SparkLine`, `RadialGauge`,
 * `Meter`, `StatusDot`, `Kbd`, `KeyValue`, `Code`). The few adapters
 * exported below exist only to (a) compose ServiceDevtoolShell chrome,
 * (b) bind shipped primitives to the rune helpers in `#lib/sys/runes/index.js`,
 * (c) map `CommandError.kind` to Badge variants. **No bespoke divs.**
 *
 * See `_shared/README.md` for the full golden-pattern playbook.
 */

export { default as CommandErrorAlert } from "./_shared/CommandErrorAlert.svelte";
export { default as DevtoolBentoGrid } from "./_shared/DevtoolBentoGrid.svelte";
export { default as DevtoolBentoTile } from "./_shared/DevtoolBentoTile.svelte";
export type { LogTargetPreset } from "./_shared/DevtoolLogsTab.svelte";
export { default as DevtoolLogsTab } from "./_shared/DevtoolLogsTab.svelte";
export { default as DevtoolRefreshButton } from "./_shared/DevtoolRefreshButton.svelte";
export { default as PlannedDevtool } from "./_shared/PlannedDevtool.svelte";
export { default as RepoDownloadButton } from "./_shared/RepoDownloadButton.svelte";
export {
	formatBytes,
	type PrimaryResolution,
	type RepoFile,
	resolvePrimaryFile,
	totalBundleSizeBytes,
} from "./_shared/resolve-primary-file.js";
export { default as ScopedLogPanel } from "./_shared/ScopedLogPanel.svelte";
export { default as ServiceDevtoolShell } from "./_shared/ServiceDevtoolShell.svelte";
export { default as SwapPrimaryBrainButton } from "./_shared/SwapPrimaryBrainButton.svelte";
export {
	accentToBackdropPalette,
	type BrandAccent,
	DEFAULT_SERVICE_ACCENT,
	type ServiceBackdrop,
	serviceAccentStyle,
} from "./_shared/serviceAccents.js";
export type {
	CapturePayload,
	ExtraTab,
	HealthBadge,
	HealthState,
} from "./_shared/types.js";
export { default as ServiceStatus } from "./_shared/ui/service-status/ServiceStatus.svelte";
export {
	type DevtoolBucket,
	type DevtoolPlace,
	type DevtoolTier,
	devtoolForRuntime,
	devtoolNav,
	devtoolPages,
	devtoolPlace,
	devtoolTiers,
} from "./devtool-manifest.js";
export type { DevtoolNav, DevtoolStatus, DevtoolTone } from "./devtool-nav.js";
