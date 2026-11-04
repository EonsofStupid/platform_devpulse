/**
 * @file Setup Wizard Module — Public API
 * @module @devpulse/domains/app/models/feature/setup-wizard
 *
 * Domain logic for the model setup wizard.
 * The app shell and any thin route adapters compose these exports.
 * Import ONLY from this file — never deep into the module.
 */

// Shared components (used by route pages and overlay)
export { default as CurrentSetupPopup } from "./components/CurrentSetupPopup.svelte";
export { default as HuggingFaceSearch } from "./components/HuggingFaceSearch.svelte";
export { default as VramBar } from "./components/VramBar.svelte";
export { default as WizardHelpTip } from "./components/WizardHelpTip.svelte";
export { default as WizardInfoPopup } from "./components/WizardInfoPopup.svelte";

// Boot-time bridge (wired by routes/+layout.svelte)
export { bootstrapDownloadBridge } from "./download-bootstrap.js";
export { default as LocalModelSetup } from "./LocalModelSetup.svelte";
export { default as SetupWizard } from "./SetupWizard.svelte";
export { default as SetupWizardOverlay } from "./SetupWizardOverlay.svelte";
export { default as ModelLoaderStep } from "./steps/ModelLoaderStep.svelte";
export { default as ModelsStep } from "./steps/ModelsStep.svelte";
export { default as SearchBrowseStep } from "./steps/SearchBrowseStep.svelte";

// Service
export {
	assignAndLoad,
	autoAssignAllSlots,
	bulkDownloadAndAssign,
	cancelActiveDownload,
	checkOnboardingComplete,
	downloadAndAssign,
	downloadAndAssignFile,
	evaluateContinueGate,
	fetchRecommendations,
	listAllPresets,
	loadWizardCopy,
	markOnboardingComplete,
	selectPreset,
	setUpRecommended,
	startHardwareScan,
	testInference,
} from "./wizard.service.js";

// State
export { type WizardView, wizardState } from "./wizard.state.svelte.js";

// Types
export type {
	ActivateCopy,
	AllocationMode,
	BrowseCopy,
	CompletionCopy,
	ContinueGate,
	CustomizeCopy,
	DownloadsCopy,
	DownloadTracker,
	GreetingCopy,
	HardwareCopy,
	HfTokenCopy,
	ImportMode,
	LoadingCopy,
	LoadingStageKind,
	LoadingTracker,
	ModelBrowserFilter,
	ModelRec,
	ModelsCopy,
	PhaseInfo,
	ProfileCopy,
	RoleCardsCopy,
	RoleFrame,
	ScanningCopy,
	SlotLabel,
	SlotRole,
	TierDisplay,
	TierRole,
	WizardCopy,
	WizardPhase,
} from "./wizard.types.js";
export {
	ALLOCATION_MODES,
	allocationLabel,
	friendlyName,
	getSlotLabel,
	PHASE_INFO,
	PROGRESS_PHASES,
	ROLE_COLORS,
	ROLE_FRAMES,
	SLOT_LABELS,
	TIER_TOKENS,
	tierToAllocation,
	WIZARD_PHASES,
} from "./wizard.types.js";
