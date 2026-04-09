/**
 * useText — ColdLight text primitive hook.
 *
 * Polymorphic text element. The component renders the element specified
 * by `as` (span, p, strong, em, small, div, label, abbr).
 * Data attributes drive token-based size, weight, alignment, and truncation.
 *
 * WAI-ARIA: Inherits semantics from the rendered element.
 * No additional ARIA roles are applied — the element itself carries meaning.
 * Use aria-label for <abbr> or other cases where content alone is insufficient.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useText } from '$lib/design/coldlight';
 *   const text = useText({ as: 'p', size: 'base', weight: 'regular' });
 * </script>
 * <svelte:element this={text.as} {...text.root}>
 *   Hello, world.
 * </svelte:element>
 * ```
 */

import { textAnatomy } from "./text.anatomy.js";
import type { TextElement, UseTextProps, UseTextReturn } from "./text.types.js";

export function useText(props: UseTextProps = {}): UseTextReturn {
	const as: TextElement = props.as ?? "span";
	const size = props.size ?? "base";
	const weight = props.weight ?? "regular";
	const align = props.align ?? "start";
	const truncate = props.truncate ?? "none";

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...textAnatomy.attrs.root,
		"aria-label": props["aria-label"],
		"data-size": size,
		"data-weight": weight,
		"data-align": align,
		"data-truncate": truncate,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		as,
		get root() {
			return root;
		},
	};
}
