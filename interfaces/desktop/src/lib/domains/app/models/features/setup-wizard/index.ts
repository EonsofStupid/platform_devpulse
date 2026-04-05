/**
 * @file Setup Wizard Module — Barrel Exports
 * @module @devpulse/domains/app/models/features/setup-wizard
 *
 * Self-contained module for the 5-phase dev onboarding wizard.
 */

// Import routing
export { slotToModelPath, slotToSubdir } from "./import-router.js";
// Seed families
export { getAllFamilyIds, getCoreFacts, pickVariation } from "./seed-families.js";
// Step components
export { default as HardwareDetectionStep } from "./steps/HardwareDetectionStep.svelte";
export { default as ImportPrompt } from "./steps/ImportPrompt.svelte";
export { default as ModelLoaderStep } from "./steps/ModelLoaderStep.svelte";
export { default as SlotAssignmentPanel } from "./steps/SlotAssignmentPanel.svelte";
export { default as WelcomeStep } from "./steps/WelcomeStep.svelte";
// State
export { wizardState } from "./wizard.runes.svelte.js";
// Service
export {
	bulkDownloadAndAssign,
	checkOnboardingComplete,
	downloadAndAssign,
	evaluateContinueGate,
	fetchRecommendations,
	markOnboardingComplete,
	startHardwareScan,
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
