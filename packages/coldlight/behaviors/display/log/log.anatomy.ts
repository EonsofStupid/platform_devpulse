import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Log anatomy — lines that arrive in order, newest last.
 *
 * WAI-ARIA: role="log" — a live region where new information is added in
 * meaningful order, only at the end; polite announcements, aria-atomic false;
 * an accessible name is required.
 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role
 *
 * Keyboard: the region scrolls, so it takes focus (tabindex 0) to be
 * scrollable by keyboard — WCAG 2.1.1, axe `scrollable-region-focusable`.
 */
export const logAnatomy = createAnatomy("log", {
	root: {
		description:
			"The log's scrolling region: role='log' (polite, additions only at the end), named by aria-label or aria-labelledby (one is required), tabindex 0 so the keyboard can scroll it. data-following is present while it keeps to the newest line.",
		element: "div",
		required: true,
		aria: {
			role: "log",
			conditional: ["aria-label", "aria-labelledby"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-following"],
		keyboard: { focusable: true },
	},
	list: {
		description: "The ordered list of lines inside the region, oldest first.",
		element: "ol",
		required: true,
		accepts: ["structural"],
	},
	line: {
		description:
			"One entry of the log. Its parts are optional; text is the only one every line has.",
		element: "li",
		required: true,
		repeatable: true,
		accepts: ["text"],
	},
	time: {
		description: "When the entry happened, as its source wrote it.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
	level: {
		description:
			"The entry's level (error, warn, info, debug, trace), drawn with its tone: data-tone is error, warning, info or muted.",
		element: "span",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-tone"],
	},
	source: {
		description: "What wrote the entry: a target, a module, an action.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
	text: {
		description: "The entry's message.",
		element: "span",
		required: true,
		accepts: ["text"],
	},
});
