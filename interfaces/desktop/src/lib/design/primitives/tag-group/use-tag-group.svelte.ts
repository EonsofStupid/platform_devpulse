/**
 * useTagGroup — ColdLight tag group primitive hook.
 *
 * Group of removable tags with arrow key navigation and Delete/Backspace to remove.
 * Parts: root (grid), tag (row, parameterized), label, description, remove (parameterized).
 */

import { dataAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { tagGroupAnatomy } from "./tag-group.anatomy.js";
import type { UseTagGroupProps, UseTagGroupReturn } from "./tag-group.types.js";

export function useTagGroup(props: UseTagGroupProps = {}): UseTagGroupReturn {
	const id = uid("tag-group");
	const globalDisabled = $derived(props.disabled ?? false);

	function getTags(): HTMLElement[] {
		const container = document.getElementById(id);
		if (!container) return [];
		return Array.from(
			container.querySelectorAll<HTMLElement>('[data-slot="tag"]:not([data-disabled])'),
		);
	}

	function handleTagKeydown(e: KeyboardEvent, value: string): void {
		if (globalDisabled) return;
		const tags = getTags();
		const currentIndex = tags.indexOf(e.currentTarget as HTMLElement);

		if (e.key === kbd.ARROW_RIGHT) {
			e.preventDefault();
			const next = currentIndex < tags.length - 1 ? currentIndex + 1 : 0;
			tags[next]?.focus();
		} else if (e.key === kbd.ARROW_LEFT) {
			e.preventDefault();
			const prev = currentIndex > 0 ? currentIndex - 1 : tags.length - 1;
			tags[prev]?.focus();
		} else if (e.key === kbd.DELETE || e.key === kbd.BACKSPACE) {
			e.preventDefault();
			props.onRemove?.(value);
			// Focus next or previous tag after removal
			const nextTag = tags[currentIndex + 1] ?? tags[currentIndex - 1];
			requestAnimationFrame(() => nextTag?.focus());
		}
	}

	const root = $derived({
		...tagGroupAnatomy.attrs.root,
		id,
		role: "grid" as const,
		"aria-label": props["aria-label"],
		"data-disabled": dataAttr(globalDisabled),
	});

	const label = $derived({ ...tagGroupAnatomy.attrs.label });
	const description = $derived({ ...tagGroupAnatomy.attrs.description });

	return {
		get root() {
			return root;
		},
		get label() {
			return label;
		},
		get description() {
			return description;
		},

		getTag(value: string, options?: { disabled?: boolean }) {
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...tagGroupAnatomy.attrs.tag,
				role: "row" as const,
				tabindex: 0 as const,
				"data-value": value,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onkeydown: (e: KeyboardEvent) => handleTagKeydown(e, value),
			};
		},

		getRemove(value: string, options?: { disabled?: boolean }) {
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...tagGroupAnatomy.attrs.remove,
				type: "button" as const,
				tabindex: -1 as const,
				"aria-label": `Remove ${value}` as const,
				"aria-disabled": isDisabled || undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => {
					if (!isDisabled) props.onRemove?.(value);
				},
			};
		},
	};
}
