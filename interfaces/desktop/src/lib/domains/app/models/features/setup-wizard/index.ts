/**
 * @file Setup Wizard Module — Barrel Exports
 * @module @devpulse/domains/app/models/features/setup-wizard
 *
 * Self-contained module for the 7-phase dev onboarding wizard.
 * Follows 10 Commandments: preset-first, layman names, role colors.
 */

export { default as CurrentSetupPopup } from "./components/CurrentSetupPopup.svelte";
// Shared components
export { default as PresetCard } from "./components/PresetCard.svelte";
export { default as SlotCard } from "./components/SlotCard.svelte";
export { default as SlotSwapPopup } from "./components/SlotSwapPopup.svelte";
export { default as VramBar } from "./components/VramBar.svelte";
// Main component
export { default as SetupWizard } from "./SetupWizard.svelte";
export { default as ClyfActivationStep } from "./steps/ClyfActivationStep.svelte";
export { default as CompletionStep } from "./steps/CompletionStep.svelte";
export { default as CustomizeStep } from "./steps/CustomizeStep.svelte";
export { default as HardwareDetectionStep } from "./steps/HardwareDetectionStep.svelte";
export { default as ModelsStep } from "./steps/ModelsStep.svelte";
export { default as ProjectSetupStep } from "./steps/ProjectSetupStep.svelte";
export { default as SearchBrowseStep } from "./steps/SearchBrowseStep.svelte";
// Step components
export { default as WelcomeStep } from "./steps/WelcomeStep.svelte";

// State
export { wizardState } from "./wizard.runes.svelte.js";

// Service
export {
	bulkDownloadAndAssign,
	checkDevProfile,
	checkOnboardingComplete,
	createDevProfile,
	detectHardwareChange,
	downloadAndAssign,
	evaluateContinueGate,
	fetchRecommendations,
	markOnboardingComplete,
	startHardwareScan,
	subsequentLaunchCheck,
	testInference,
	validateModelPaths,
} from "./wizard.service.js";

// Types
export type {
	AllocationMode,
	ContinueGate,
	DownloadTracker,
	EscalationConfig,
	EscalationPriority,
	EscalationSource,
	ImportMode,
	ModelBrowserFilter,
	ModelRec,
	PhaseInfo,
	SlotLabel,
	SlotRole,
	VoiceConfig,
	VoiceDeliveryMode,
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
	tierToAllocation,
	WIZARD_PHASES,
} from "./wizard.types.js";
