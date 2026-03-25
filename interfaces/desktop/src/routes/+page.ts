/**
 * @file routes/+page.ts
 * @description Root redirect to devpulse dashboard (client-side)
 *
 * ssr = false in +layout.ts means server load functions never run.
 * This universal load handles the redirect in SPA/Tauri mode.
 */

import { redirect } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

export const load: Load = async () => {
	redirect(302, "/devpulse");
};
