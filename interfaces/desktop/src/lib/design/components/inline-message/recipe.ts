/**
 * @file InlineMessage Recipe
 * @kind inline-message
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * InlineMessage: compact inline feedback text with icon and tone color.
 */

import type { InlineMessageTone } from "./types.js";

const base = [
	"inline-flex items-center gap-1.5",
	"text-xs",
].join(" ");

const toneStyles: Record<InlineMessageTone, string> = {
	info: "text-teal-300",
	success: "text-green-300",
	warning: "text-amber-300",
	error: "text-ember-300",
	help: "text-text-secondary",
};

export function inlineMessageRecipe(opts: { tone: InlineMessageTone }): string {
	return `${base} ${toneStyles[opts.tone]}`;
}
