/**
 * useContent — ColdLight content primitive hook.
 *
 * Generic rich text/prose container. Polymorphic — renders as div,
 * section, article, aside, or main. Provides size and alignment
 * data attributes for token-driven styling.
 *
 * WAI-ARIA: Inherits semantics from the rendered element. When using
 * landmark elements (section, aside, main), aria-label is required.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useContent } from '$lib/design/coldlight';
 *   const content = useContent({ as: 'section', size: 'base', 'aria-label': 'Main content' });
 * </script>
 * <svelte:element this={content.as} {...content.root}>
 *   <p>Body text goes here.</p>
 * </svelte:element>
 * ```
 */

import { contentAnatomy } from "./content.anatomy.js";
import type { ContentElement, UseContentProps, UseContentReturn } from "./content.types.js";

export function useContent(props: UseContentProps = {}): UseContentReturn {
	const as: ContentElement = props.as ?? "div";
	const size = props.size ?? "base";
	const align = props.align ?? "start";

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...contentAnatomy.attrs.root,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"data-size": size,
		"data-align": align,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		as,
		get root() {
			return root;
		},
	};
}
