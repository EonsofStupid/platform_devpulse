/**
 * @file routes/+page.ts
 * @description Root redirect to devpulse dashboard (client-side)
 *
 * ssr = false in +layout.ts means server load functions never run.
 * This universal load handles the redirect in SPA/Tauri mode.
 */

import type { Load } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";

export const load: Load = async () => {
	redirect(302, resolve("/devpulse"));
};
