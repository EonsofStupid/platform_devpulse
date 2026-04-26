/**
 * Platform shared devtool primitives — the uniform chrome every
 * per-service devtool wraps around.
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

export { default as CommandErrorAlert } from "./CommandErrorAlert.svelte";
export { default as DevtoolBentoGrid } from "./DevtoolBentoGrid.svelte";
export { default as DevtoolBentoTile } from "./DevtoolBentoTile.svelte";
export type { LogTargetPreset } from "./DevtoolLogsTab.svelte";
export { default as DevtoolLogsTab } from "./DevtoolLogsTab.svelte";
export { default as DevtoolRefreshButton } from "./DevtoolRefreshButton.svelte";
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
