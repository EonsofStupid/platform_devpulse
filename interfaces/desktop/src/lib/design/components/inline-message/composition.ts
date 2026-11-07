/**
 * @file InlineMessage Composition
 * @kind inline-message
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Tone handled by inline-message-root @utility + inline-message-{tone} intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type InlineMessageRecipeProps = { tone?: string };

export function inlineMessageComposition(props: InlineMessageRecipeProps = {}): string {
	const tone = `inline-message-${props.tone ?? "info"}`;
	return cn("inline-message-root", tone);
}
