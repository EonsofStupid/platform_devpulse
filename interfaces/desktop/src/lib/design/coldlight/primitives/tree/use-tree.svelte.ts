/**
 * useTree — ColdLight tree view primitive hook.
 *
 * Hierarchical list with expandable nodes. Arrow keys navigate visible items,
 * ArrowRight expands or moves to child, ArrowLeft collapses or moves to parent.
 * Parts: root (tree), item (treeitem, parameterized), group.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */

import { uid } from "../../_internal/utils/uid.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { treeAnatomy } from "./tree.anatomy.js";
import type { UseTreeProps, UseTreeReturn } from "./tree.types.js";

export function useTree(props: UseTreeProps = {}): UseTreeReturn {
	const id = uid("tree");
	const globalDisabled = $derived(props.disabled ?? false);

	function toggleExpanded(key: string): void {
		const keys = new Set(props.expandedKeys ?? []);
		if (keys.has(key)) keys.delete(key);
		else keys.add(key);
		props.onExpandedChange?.(keys);
	}

	function getVisibleItems(): HTMLElement[] {
		const container = document.getElementById(id);
		if (!container) return [];
		return Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]:not([data-disabled])'))
			.filter((el) => {
				// Only include items that are visible (not inside collapsed groups)
				let parent = el.parentElement;
				while (parent && parent.id !== id) {
					if (parent.getAttribute("role") === "group" && parent.hidden) return false;
					parent = parent.parentElement;
				}
				return true;
			});
	}

	function handleKeydown(e: KeyboardEvent): void {
		const items = getVisibleItems();
		if (items.length === 0) return;
		const currentIndex = items.indexOf(document.activeElement as HTMLElement);
		const current = items[currentIndex];

		if (e.key === kbd.ARROW_DOWN) {
			e.preventDefault();
			const next = currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
			items[next]?.focus();
		} else if (e.key === kbd.ARROW_UP) {
			e.preventDefault();
			const prev = currentIndex > 0 ? currentIndex - 1 : currentIndex;
			items[prev]?.focus();
		} else if (e.key === kbd.ARROW_RIGHT && current) {
			e.preventDefault();
			const key = current.getAttribute("data-key");
			const hasChildren = current.getAttribute("data-has-children") === "";
			const expanded = current.getAttribute("aria-expanded") === "true";
			if (hasChildren && !expanded && key) toggleExpanded(key);
			else {
				// Move to first child
				const next = currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
				items[next]?.focus();
			}
		} else if (e.key === kbd.ARROW_LEFT && current) {
			e.preventDefault();
			const key = current.getAttribute("data-key");
			const hasChildren = current.getAttribute("data-has-children") === "";
			const expanded = current.getAttribute("aria-expanded") === "true";
			if (hasChildren && expanded && key) toggleExpanded(key);
			else {
				// Move to parent — find item at lower level
				const level = parseInt(current.getAttribute("aria-level") ?? "1", 10);
				for (let i = currentIndex - 1; i >= 0; i--) {
					const parentLevel = parseInt(items[i].getAttribute("aria-level") ?? "1", 10);
					if (parentLevel < level) { items[i].focus(); break; }
				}
			}
		} else if (e.key === kbd.HOME) {
			e.preventDefault();
			items[0]?.focus();
		} else if (e.key === kbd.END) {
			e.preventDefault();
			items[items.length - 1]?.focus();
		} else if (e.key === kbd.SPACE) {
			e.preventDefault();
			const key = current?.getAttribute("data-key");
			if (key) {
				const keys = new Set(props.selectedKeys ?? []);
				if (keys.has(key)) keys.delete(key);
				else keys.add(key);
				props.onSelectionChange?.(keys);
			}
		}
	}

	const root = $derived({
		...treeAnatomy.attrs.root,
		id,
		role: "tree" as const,
		"aria-label": props["aria-label"],
		"aria-disabled": disabledAttr(globalDisabled),
		onkeydown: handleKeydown,
	});

	return {
		get root() { return root; },

		getItem(key: string, options?: { hasChildren?: boolean; level?: number; disabled?: boolean }) {
			const hasChildren = options?.hasChildren ?? false;
			const expanded = hasChildren ? (props.expandedKeys?.has(key) ?? false) : undefined;
			const selected = props.selectedKeys?.has(key) ?? false;
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			const level = options?.level ?? 1;

			return {
				...treeAnatomy.attrs.item,
				role: "treeitem" as const,
				tabindex: 0 as const,
				"aria-expanded": expanded,
				"aria-selected": selected,
				"aria-level": level,
				"aria-disabled": isDisabled || undefined,
				"data-key": key,
				"data-has-children": hasChildren ? ("" as const) : undefined,
				"data-expanded": expanded ? ("" as const) : undefined,
				"data-selected": selected ? ("" as const) : undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => {
					if (isDisabled) return;
					if (hasChildren) toggleExpanded(key);
				},
			};
		},

		getGroup() {
			return {
				...treeAnatomy.attrs.group,
				role: "group" as const,
			};
		},

		toggleExpanded,
	};
}
