/**
 * @file setup-wizard barrel.
 * @module @devpulse/domains/app/models/feature/setup-wizard
 *
 * Public surface for the onboarding wizard. Consumers (BootOverlay,
 * dashboard re-open) import `wizardState` to drive navigation and
 * `SetupWizardOverlay` to render the actual flow.
 */

export { bootstrapDownloadBridge } from "./download-bootstrap.js";
export { default as SetupWizardOverlay } from "./SetupWizardOverlay.svelte";
export { type WizardView, wizardState } from "./wizard.state.svelte.js";
