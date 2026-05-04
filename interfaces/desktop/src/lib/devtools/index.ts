/**
 * Devtools public barrel — registry + meta + the uniform shell chrome
 * every per-service devtool wraps around.
 *
 * Convention: tab bodies compose **shipped ColdLight primitives**
 * directly (`Stat`, `EmptyState`, `Callout`, `Alert`, `Tabs`,
 * `Tooltip`, `Card preset="glass"`, `SparkLine`, `RadialGauge`,
 * `Meter`, `StatusDot`, `Kbd`, `KeyValue`, `Code`). The few adapters
 * exported below exist only to (a) compose ServiceDevtoolShell chrome,
 * (b) bind shipped primitives to the rune helpers in `$lib/sys/runes`,
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
	DEFAULT_SERVICE_BACKDROP,
	SERVICE_ACCENTS,
	SERVICE_BACKDROPS,
	type ServiceBackdrop,
	serviceAccent,
	serviceAccentStyle,
	serviceBackdrop,
} from "./_shared/serviceAccents.js";
export type {
	CapturePayload,
	ExtraTab,
	HealthBadge,
	HealthState,
	ServiceAxis,
} from "./_shared/types.js";
export {
	type AnyBucket,
	type BucketGroup,
	type BucketIcons,
	bucketLabel,
	type ClyffyBucket,
	type DevtoolMeta,
	type DevtoolStatus,
	type DevtoolTier,
	findDevtoolMeta,
	groupByTier,
	type LucideIcon,
	type RuntimesBucket,
	type SystemBucket,
	type TierGroup,
} from "./meta.js";
export { DEVTOOL_BUCKET_ICONS, DEVTOOL_REGISTRY } from "./registry.js";
