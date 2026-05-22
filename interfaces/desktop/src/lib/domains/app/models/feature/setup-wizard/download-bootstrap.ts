/**
 * @file download-bootstrap (relocation shim)
 * @module @devpulse/domains/app/models/feature/setup-wizard/download-bootstrap
 *
 * The capability lives at
 * `$lib/domains/app/models/data-access/download-bootstrap.js` — moved
 * out of the setup-wizard surface as part of the absorb pass that
 * folds the wizard into the SlotsDevtool. Boot-bridge wiring is a
 * data-access concern and was never wizard-specific; the previous
 * placement was a residue of the setup-wizard refactor that created
 * the rune in the first place.
 *
 * This file re-exports the single symbol so the original setup-wizard
 * barrel keeps re-exporting it until the verify pass deletes the
 * surface. Authoring belongs to the relocated file.
 */

export { bootstrapDownloadBridge } from "../../data-access/download-bootstrap.js";
