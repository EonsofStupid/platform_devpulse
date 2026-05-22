/**
 * @file setup-wizard barrel.
 * @module @devpulse/domains/app/models/feature/setup-wizard
 *
 * Public surface for the onboarding wizard. Consumers (BootOverlay,
 * dashboard re-open) import `wizardState` to drive navigation and
 * `SetupWizardOverlay` to render the actual flow.
 */

// `bootstrapDownloadBridge` relocated to
// `$lib/domains/app/models/data-access/download-bootstrap.js`. The
// re-export here keeps `./download-bootstrap.js` from the
// SetupWizardOverlay-era barrel intact for any consumer importing
// directly from `feature/setup-wizard/index.js` until that barrel
// disappears in the verify pass.
export { bootstrapDownloadBridge } from "../../data-access/download-bootstrap.js";
export { default as SetupWizardOverlay } from "./SetupWizardOverlay.svelte";
export { type WizardView, wizardState } from "./wizard.state.svelte.js";
