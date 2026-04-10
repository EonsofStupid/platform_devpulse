/**
 * @file Setup Wizard Module — Public API
 * @module @devpulse/domains/app/models/features/setup-wizard
 *
 * Domain logic for the model setup wizard.
 * Routes at (model-loader)/model-loader/ compose these exports.
 * Routes import ONLY from this file — never deep into the module.
 */

// Shared components (used by route pages)
export { default as CurrentSetupPopup } from "./components/CurrentSetupPopup.svelte";
export { default as HuggingFaceSearch } from "./components/HuggingFaceSearch.svelte";
export { default as PresetCard } from "./components/PresetCard.svelte";
export { default as SlotCard } from "./components/SlotCard.svelte";
export { default as SlotSwapPopup } from "./components/SlotSwapPopup.svelte";
export { default as VramBar } from "./components/VramBar.svelte";
export { default as WizardHelpTip } from "./components/WizardHelpTip.svelte";
export { default as WizardInfoPopup } from "./components/WizardInfoPopup.svelte";

// State
export { wizardState } from "./wizard.runes.svelte.js";

// Service
export {
	bulkDownloadAndAssign,
	cancelActiveDownload,
	checkDevProfile,
	checkOnboardingComplete,
	createDevProfile,
	detectHardwareChange,
	downloadAndAssign,
	evaluateContinueGate,
	fetchRecommendations,
	listAllPresets,
	markOnboardingComplete,
	selectPreset,
	startHardwareScan,
	subsequentLaunchCheck,
	testInference,
	validateModelPaths,
} from "./wizard.service.js";

// Types
export type {
	ActivateCopy,
	AllocationMode,
	BrowseCopy,
	CompletionCopy,
	ContinueGate,
	CustomizeCopy,
	DownloadTracker,
	EscalationConfig,
	EscalationPriority,
	EscalationSource,
	GreetingCopy,
	HardwareCopy,
	ImportMode,
	ModelBrowserFilter,
	ModelRec,
	ModelsCopy,
	PhaseInfo,
	ProfileCopy,
	ScanningCopy,
	SlotLabel,
	SlotRole,
	TierDisplay,
	TierRole,
	VoiceConfig,
	VoiceDeliveryMode,
	WizardCopy,
	WizardPhase,
} from "./wizard.types.js";
export {
	ALLOCATION_MODES,
	allocationLabel,
	DEFAULT_ESCALATION,
	friendlyName,
	getSlotLabel,
	PHASE_INFO,
	PROGRESS_PHASES,
	ROLE_COLORS,
	SLOT_LABELS,
	TIER_TOKENS,
	tierToAllocation,
	WIZARD_PHASES,
} from "./wizard.types.js";
