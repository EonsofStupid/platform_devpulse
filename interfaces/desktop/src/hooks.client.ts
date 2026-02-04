import type { HandleClientError } from "@sveltejs/kit";

export const handleError: HandleClientError = ({ error, event, status, message }) => {
	const err = error as Error;
	console.error(`[DevPulse] Unhandled error at ${event.url.pathname}:`, err);

	return {
		message: message ?? "Something went wrong",
		code: status?.toString() ?? "UNKNOWN",
	};
};
