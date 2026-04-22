import type { ClientInit, HandleClientError } from "@sveltejs/kit";

/**
 * SvelteKit 2.x client `init` hook — runs once on app startup in the browser,
 * before the first route loads. Required export (the generated `app.js`
 * imports it); Rollup fails the build if it is missing.
 */
export const init: ClientInit = async () => {
	// Intentional no-op. Early-error capture lives in `app.html` so it runs
	// before modules load; logger wiring happens inside `+layout.svelte`.
};

export const handleError: HandleClientError = ({ error, event, status, message }) => {
	const err = error as Error;
	console.error(`[DevPulse] Unhandled error at ${event.url.pathname}:`, err);

	return {
		message: message ?? "Something went wrong",
		code: status?.toString() ?? "UNKNOWN",
	};
};
