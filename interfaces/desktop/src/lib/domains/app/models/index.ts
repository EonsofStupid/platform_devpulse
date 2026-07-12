/**
 * @module @devpulse/domains/app/models
 *
 * Public API for the model loader domain. The backend is the engine's
 * `platform/model_loader` (management) with the Tauri
 * command surface at `$lib/sys/bindings/models/`. This module is the
 * **state + UI bridge** between those bindings and consumer surfaces:
 * the dashboard, the slot orchestrator devtool, the chat strip, the
 * voice lab, and the onboarding wizard.
 *
 * Layer contract (Nx library-types per `project_nx_library_types`):
 *
 *   util/         — pure types + format/slot/role helpers
 *   data-access/  — singleton runes (modelsState, hardwareState, narrationState)
 *   ui/           — dumb presentational components (VramBar, ClyffyNarration, ModelEventCard)
 *   feature/      — orchestrating components (SetupWizardOverlay, SwapOverlay)
 *
 * Routes and other domains MUST import from THIS file. Don't reach
 * into sub-folders directly — that bypasses the contract and re-breaks
 * cleanups when the internals reshape.
 */

// ── Bindings re-exports for convenience ──────────────────
// `cancelDownload` was the one symbol that survived the May 1 sweep
// in `bindings/models/` directly; re-exported here so consumers
// reaching for `$lib/domains/app/models/data-access/download.service.js`
// (legacy path) can be redirected by replacing only the import,
// without splitting the call site between two files.
export { cancelDownload, downloadModel } from "$lib/sys/bindings/models/index.js";
// ── Boot-time event bridge ───────────────────────────────
// Singleton bridge wired by `+layout.svelte` at app boot. Lives in
// `data-access/` because it boots data-access runes; nothing UI-side.
export { bootstrapDownloadBridge } from "./data-access/download-bootstrap.js";
export { hardwareState } from "./data-access/hardware.state.svelte.js";
// ── Inference (streaming text generation) ────────────────
export { generateText, onInferenceToken } from "./data-access/inference.service.js";
// ── State runes ──────────────────────────────────────────
export { modelsState } from "./data-access/models.state.svelte.js";
export { narrationState } from "./data-access/narration.state.svelte.js";

// ── In-flight install/swap overlay ───────────────────────
export { default as SwapOverlay } from "./feature/components/SwapOverlay.svelte";
// ── Reusable Model Downloader overlay ────────────────────
// One singleton; mount `ModelDownloaderOverlay` once at the app root
// and call `modelDownloaderState.open({ slotId?, projectId?,
// defaultQuery? })` from any feature surface to open the dialog.
export {
	type BundleFileEntry,
	type DownloaderBundle,
	type DownloaderPhase,
	type DownloaderSelection,
	type DownloaderTarget,
	ModelDownloaderOverlay,
	modelDownloaderState,
	type SuggestedSlotTag,
	suggestSlots,
	type TagConfidence,
	topSuggestion,
} from "./feature/downloader/index.js";
// ── Onboarding wizard ────────────────────────────────────
// `bootstrapDownloadBridge` moved to `./data-access/download-bootstrap.js`
// (re-exported above). The setup-wizard surface itself is being
// absorbed into the SlotsDevtool — these exports remain only until
// the next pass deletes the wizard files; consumers should migrate
// to the slots devtool / data-access runes.
export {
	SetupWizardOverlay,
	type WizardView,
	wizardState,
} from "./feature/setup-wizard/index.js";
// ── UI components ────────────────────────────────────────
export { default as ClyffyNarration } from "./ui/ClyffyNarration.svelte";
export { default as ContextGauge } from "./ui/ContextGauge.svelte";
export { default as GpuUtilGauge } from "./ui/GpuUtilGauge.svelte";
export { default as ModelEventCard } from "./ui/ModelEventCard.svelte";
export { default as VramBar } from "./ui/VramBar.svelte";
export { default as VramGauge } from "./ui/VramGauge.svelte";
// ── Helpers + role metadata ──────────────────────────────
export { formatBytes, formatLoadError, formatMb } from "./util/format.js";
export {
	ROLE_COLORS,
	ROLE_FRAMES,
	type RoleFrame,
	type RoleId,
	roleForSlot,
} from "./util/roles.js";
export { getSlotLabel, isInferenceReady, type SlotLabel } from "./util/slots.js";
// ── Types ────────────────────────────────────────────────
export type {
	HardwareInfo,
	LoadError,
	ModelInfo,
	ModelLoadStatus,
	ModelsStatusSnapshot,
	SlotInfo,
	SlotNarration,
	VramBudgetInfo,
} from "./util/types.js";
