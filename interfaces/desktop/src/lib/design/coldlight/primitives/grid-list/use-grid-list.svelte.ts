/**
 * useGridList — ColdLight grid list primitive hook.
 *
 * Selectable list rendered as a grid. Arrow key navigation with roving tabindex.
 * Parts: root (grid), item (row, parameterized).
 */

import { uid } from "../../_internal/utils/uid.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { gridListAnatomy } from "./grid-list.anatomy.js";
import type { UseGridListProps, UseGridListReturn } from "./grid-list.types.js";

export function useGridList(props: UseGridListProps = {}): UseGridListReturn {
	const id = uid("grid-list");
	const multiple = props.multiple ?? false;
	const globalDisabled = $derived(props.disabled ?? false);

	function getItems(): HTMLElement[] {
		const container = document.getElementById(id);
		if (!container) return [];
		return Array.from(container.querySelectorAll<HTMLElement>('[role="row"]:not([data-disabled])'));
	}

	function handleKeydown(e: KeyboardEvent): void {
		const items = getItems();
		if (items.length === 0) return;
		const currentIndex = items.indexOf(document.activeElement as HTMLElement);

		if (e.key === kbd.ARROW_DOWN) {
			e.preventDefault();
			const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
			items[next]?.focus();
		} else if (e.key === kbd.ARROW_UP) {
			e.preventDefault();
			const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
			items[prev]?.focus();
		} else if (e.key === kbd.HOME) {
			e.preventDefault();
			items[0]?.focus();
		} else if (e.key === kbd.END) {
			e.preventDefault();
			items[items.length - 1]?.focus();
		} else if (e.key === kbd.SPACE) {
			e.preventDefault();
			const key = (document.activeElement as HTMLElement)?.getAttribute("data-key");
			if (key) toggleSelection(key);
		}
	}

	function toggleSelection(key: string): void {
		if (globalDisabled) return;
		const keys = new Set(props.selectedKeys ?? []);
		if (keys.has(key)) keys.delete(key);
		else { if (!multiple) keys.clear(); keys.add(key); }
		props.onSelectionChange?.(keys);
	}

	const root = $derived({
		...gridListAnatomy.attrs.root,
		id,
		role: "grid" as const,
		"aria-label": props["aria-label"],
		"aria-multiselectable": multiple || undefined,
		"aria-disabled": disabledAttr(globalDisabled),
		onkeydown: handleKeydown,
	});

	return {
		get root() { return root; },

		getItem(key: string, options?: { disabled?: boolean }) {
			const selected = props.selectedKeys?.has(key) ?? false;
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...gridListAnatomy.attrs.item,
				role: "row" as const,
				tabindex: 0 as const,
				"aria-selected": selected,
				"aria-disabled": isDisabled || undefined,
				"data-key": key,
				"data-selected": selected ? ("" as const) : undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => { if (!isDisabled) toggleSelection(key); },
			};
		},
	};
}
