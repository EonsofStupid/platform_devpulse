import { redirect } from "@sveltejs/kit";

/**
 * @route /model-loader
 *
 * Canonical landing for the model-loader flow. The root used to host a
 * `+page.svelte`, then got absorbed into SetupWizardOverlay, leaving a
 * hole at `/model-loader` that every caller (BootOverlay, in-app nav,
 * sub-pages linking back to the landing) 404'd against.
 *
 * The real landing is the Models step — it's where every flow starts
 * and ends. Redirect on the server side so the browser never sees the
 * 404 and no callsite needs to know the sub-path.
 */
export function load(): never {
	throw redirect(302, "/model-loader/models");
}
