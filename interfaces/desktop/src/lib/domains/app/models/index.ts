/**
 * @module @devpulse/domains/app/models
 *
 * Public API for the models domain. Routes and other domains MUST import from
 * this file. Never reach into `data-access/`, `feature/`, `ui/`, or `util/`
 * directly from outside this domain.
 *
 * Layout (Nx library-types, LOCKED 2026-04-14 — see docs/platform/Desktop.md §1.1.1):
 *   util/         — pure types + Zod/ArkType contracts
 *   data-access/  — rune state + Tauri services
 *   ui/           — dumb/presentational Svelte components
 *   feature/      — smart/orchestrating Svelte components + routed features
 */

export { downloadModel, importLocalModel } from "./data-access/download.service.js";
export { hardwareState } from "./data-access/hardware.state.svelte.js";
export { generateText, onInferenceToken } from "./data-access/inference.service.js";
export { modelsState } from "./data-access/models.state.svelte.js";
export { narrationState } from "./data-access/narration.state.svelte.js";
export { searchState } from "./data-access/search.state.svelte.js";
export { swapState } from "./data-access/swap.state.svelte.js";
export { default as HfModelCard } from "./feature/components/HfModelCard.svelte";
export { default as ModelDetailPanel } from "./feature/components/ModelDetailPanel.svelte";
export { default as ModelLoaderPanel } from "./feature/components/ModelLoaderPanel.svelte";
export { default as ModelPicker } from "./feature/components/ModelPicker.svelte";
export { default as ModelSearch } from "./feature/components/ModelSearch.svelte";
export { default as SlotRow } from "./feature/components/SlotRow.svelte";
export { default as SubsystemGroup } from "./feature/components/SubsystemGroup.svelte";
export { default as SwapOverlay } from "./feature/components/SwapOverlay.svelte";
export { default as VramBudgetPlanner } from "./feature/components/VramBudgetPlanner.svelte";
export { default as VramBar } from "./feature/setup-wizard/components/VramBar.svelte";
export { bootstrapDownloadBridge } from "./feature/setup-wizard/download-bootstrap.js";
export { wizardState } from "./feature/setup-wizard/wizard.state.svelte.js";
export {
	getSlotLabel,
	ROLE_COLORS,
	ROLE_FRAMES,
} from "./feature/setup-wizard/wizard.types.js";
export { default as ClyffyNarration } from "./ui/ClyffyNarration.svelte";
export { default as ContextGauge } from "./ui/ContextGauge.svelte";
export { default as ModelEventCard } from "./ui/chat/ModelEventCard.svelte";
export { default as GpuUtilGauge } from "./ui/GpuUtilGauge.svelte";
export { default as VoiceSlotStatus } from "./ui/VoiceSlotStatus.svelte";
export { default as VramGauge } from "./ui/VramGauge.svelte";
export type * from "./util/models.types.js";
export {
	calculateFit,
	contextDescription,
	fitColor,
	formatBytes,
	formatMb,
	friendlySlotLabel,
	friendlySlotPurpose,
	isInferenceReady,
	quantDescription,
	statusColor,
	statusLabel,
	vramDescription,
} from "./util/models.types.js";
