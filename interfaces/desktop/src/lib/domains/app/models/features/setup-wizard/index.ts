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

// State
export { wizardState } from "./wizard.runes.svelte.js";
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
