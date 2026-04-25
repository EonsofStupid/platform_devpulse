import type { ClientInit, HandleClientError } from "@sveltejs/kit";
import { logError } from "$lib/sys/logger.js";

/**
 * SvelteKit 2.x client `init` hook — runs once on app startup in the browser,
 * before the first route loads. Required export (the generated `app.js`
 * imports it); Rollup fails the build if it is missing.
 *
 * F-4 of the Foundation Pass adds the global capture handlers here:
 * - `unhandledrejection` for promise rejections that no `.catch` consumed
 * - `error` for synchronous JS errors / runtime exceptions
 *
 * Both forward through the existing `logError` helper, which routes to
 * the backend tracing JSONL via the `log` Tauri command. After this
 * lands, no frontend exception can escape the JSONL — they all land in
 * `.userdata/logs/session-*.jsonl` with target prefixes that match the
 * source (`frontend.unhandledrejection` / `frontend.error`).
 */
export const init: ClientInit = async () => {
	if (typeof window === "undefined") return;

	window.addEventListener("unhandledrejection", (event) => {
		const reason = event.reason;
		const message =
			reason instanceof Error
				? `${reason.name}: ${reason.message}\n${reason.stack ?? "(no stack)"}`
				: String(reason);
		logError("frontend.unhandledrejection", message);
	});

	window.addEventListener("error", (event) => {
		const err = event.error as Error | undefined;
		const where =
			event.filename || event.lineno
				? ` @ ${event.filename ?? "?"}:${event.lineno ?? "?"}:${event.colno ?? "?"}`
				: "";
		const message = err
			? `${err.name}: ${err.message}${where}\n${err.stack ?? "(no stack)"}`
			: `${event.message}${where}`;
		logError("frontend.error", message);
	});
};

export const handleError: HandleClientError = ({ error, event, status, message }) => {
	const err = error as Error;
	console.error(`[DevPulse] Unhandled error at ${event.url.pathname}:`, err);

	// Forward to the backend JSONL too — `handleError` fires for SvelteKit
	// navigation/render errors that may not surface through `window.error`.
	const detail = err
		? `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ""}`
		: String(error);
	logError("frontend.svelte-kit", `${event.url.pathname}: ${detail}`);

	return {
		message: message ?? "Something went wrong",
		code: status?.toString() ?? "UNKNOWN",
	};
};
