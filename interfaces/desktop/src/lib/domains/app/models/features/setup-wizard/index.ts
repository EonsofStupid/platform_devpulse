/**
 * @file Setup Wizard Module — Barrel Exports
 * @module @devpulse/domains/app/models/features/setup-wizard
 *
 * Self-contained module for the 5-phase dev onboarding wizard.
 */

// Import routing
export { slotToModelPath, slotToSubdir } from "./import-router.js";
// Main component
export { default as SetupWizard } from "./SetupWizard.svelte";
// Seed families
export { getAllFamilyIds, getCoreFacts, pickVariation } from "./seed-families.js";
export { default as ClyfActivationStep } from "./steps/ClyfActivationStep.svelte";
export { default as CompletionStep } from "./steps/CompletionStep.svelte";
// Step components
export { default as HardwareDetectionStep } from "./steps/HardwareDetectionStep.svelte";
export { default as ImportPrompt } from "./steps/ImportPrompt.svelte";
export { default as LatencyTuningPanel } from "./steps/LatencyTuningPanel.svelte";
export { default as ModelBrowserPopup } from "./steps/ModelBrowserPopup.svelte";
export { default as ModelLoaderStep } from "./steps/ModelLoaderStep.svelte";
export { default as ProjectSetupStep } from "./steps/ProjectSetupStep.svelte";
export { default as ResourceAllocationPanel } from "./steps/ResourceAllocationPanel.svelte";
export { default as SlotAssignmentPanel } from "./steps/SlotAssignmentPanel.svelte";
export { default as SttConfigPanel } from "./steps/SttConfigPanel.svelte";
export { default as TtsConfigPanel } from "./steps/TtsConfigPanel.svelte";
export { default as VoicePipelineStep } from "./steps/VoicePipelineStep.svelte";
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
	ContinueGate,
	HardwareProfile,
	ImportMode,
	ModelBrowserFilter,
	ModelRec,
	PhaseInfo,
	ResourceRule,
	ResourceTier,
	VoiceConfig,
	VoiceDeliveryMode,
	WizardPhase,
} from "./wizard.types.js";
export { PHASE_INFO, tierToProfile, WIZARD_PHASES } from "./wizard.types.js";
