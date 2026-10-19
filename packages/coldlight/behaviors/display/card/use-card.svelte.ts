/**
 * useCard — ColdLight card primitive hook.
 *
 * Surfaces container grouping related content (header, body, footer, media).
 * Optionally interactive — gains tabindex, keyboard activation, and press state.
 *
 * WAI-ARIA: Standalone cards use role="article". Interactive cards become
 * role="button" with keyboard activation (Enter/Space).
 *
 * @example
 * ```svelte
 * <script>
 *   import { useCard } from '#coldlight/coldlight';
 *   const card = useCard({ variant: 'elevated', interactive: true });
 * </script>
 * <div {...card.root}>
 *   <div {...card.header}>Title</div>
 *   <div {...card.body}>Content</div>
 *   <div {...card.footer}>Actions</div>
 * </div>
 * ```
 */

import { cardAnatomy } from "./card.anatomy.js";
import type { UseCardProps, UseCardReturn } from "./card.types.js";

export function useCard(props: UseCardProps = {}): UseCardReturn {
	const variant = props.variant ?? "elevated";
	const padding = props.padding ?? "md";
	const interactive = props.interactive ?? false;

	// ── Keyboard handler for interactive cards ───────────────────
	function handleKeyDown(e: KeyboardEvent): void {
		if (!interactive) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			props.onActivate?.(e);
		}
	}

	function handleClick(e: MouseEvent): void {
		if (!interactive) return;
		props.onActivate?.(e);
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...cardAnatomy.attrs.root,
		role: interactive ? ("button" as const) : ("article" as const),
		tabindex: interactive ? 0 : undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"data-variant": variant,
		"data-padding": padding,
		"data-interactive": interactive ? ("true" as const) : undefined,
		...(interactive
			? {
					onkeydown: handleKeyDown,
					onclick: handleClick,
				}
			: {}),
	});

	const header = $derived({ ...cardAnatomy.attrs.header });
	const body = $derived({ ...cardAnatomy.attrs.body });
	const footer = $derived({ ...cardAnatomy.attrs.footer });
	const media = $derived({ ...cardAnatomy.attrs.media });

	// ── Public API ───────────────────────────────────────────────
	return {
		get root() {
			return root;
		},
		get header() {
			return header;
		},
		get body() {
			return body;
		},
		get footer() {
			return footer;
		},
		get media() {
			return media;
		},
	};
}
