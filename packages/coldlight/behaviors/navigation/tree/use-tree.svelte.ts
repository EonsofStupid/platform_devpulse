/**
 * useTree — ColdLight tree view primitive hook.
 *
 * Hierarchical list with expandable nodes. Arrow keys navigate visible items,
 * ArrowRight expands or moves to child, ArrowLeft collapses or moves to parent.
 * Parts: root (tree), item (treeitem, parameterized), group.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */

import { controllable } from "../../_internal/utils/controllable.svelte.js";
import { disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { treeAnatomy } from "./tree.anatomy.js";
import type { UseTreeProps, UseTreeReturn } from "./tree.types.js";

export function useTree(props: UseTreeProps = {}): UseTreeReturn {
	const generatedId = uid("tree");
	const id = $derived(props.id ?? generatedId);
	const globalDisabled = $derived(props.disabled ?? false);
	const mode = $derived(props.selectionMode ?? "none");
	const expanded = controllable({
		value: () => props.expandedKeys,
		defaultValue: () => new Set(props.defaultExpandedKeys ?? []),
		onChange: (keys) => props.onExpandedChange?.(keys),
	});
	const selected = controllable({
		value: () => props.selectedKeys,
		defaultValue: () => new Set(props.defaultSelectedKeys ?? []),
		onChange: (keys) => props.onSelectionChange?.(keys),
	});
	let focusedKey = $state<string | null>(null);
	let search = "";
	let lastTyped = 0;

	function toggleExpanded(key: string): void {
		if (globalDisabled) return;
		const keys = new Set(expanded.current);
		if (keys.has(key)) keys.delete(key);
		else keys.add(key);
		expanded.set(keys);
	}

	function select(key: string): void {
		if (globalDisabled || mode === "none") return;
		const keys = new Set(mode === "single" ? [] : selected.current);
		if (mode === "multiple" && keys.has(key)) keys.delete(key);
		else keys.add(key);
		selected.set(keys);
	}

	function allItems(): HTMLElement[] {
		const container = document.getElementById(id);
		if (!container) return [];
		return Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]')).filter(
			(item) => item.closest('[role="tree"]') === container,
		);
	}

	function visibleItems(): HTMLElement[] {
		return allItems().filter(
			(item) => !item.closest("[hidden]") && !item.hasAttribute("data-disabled"),
		);
	}

	function updateTabStops(): void {
		const items = visibleItems();
		const target =
			items.find((item) => item.dataset.key === focusedKey) ??
			items.find((item) => selected.current.has(item.dataset.key ?? "")) ??
			items[0];
		for (const item of allItems()) item.tabIndex = !globalDisabled && item === target ? 0 : -1;
	}

	// Run after Svelte applies expansion/selection changes. Also handle item
	// insertion/removal without requiring consumers to maintain a second registry.
	$effect(() => {
		expanded.current;
		selected.current;
		focusedKey;
		globalDisabled;
		const root = document.getElementById(id);
		if (!root) return;
		updateTabStops();
		const observer = new MutationObserver(updateTabStops);
		observer.observe(root, { childList: true, subtree: true });
		return () => observer.disconnect();
	});

	function focus(item: HTMLElement | undefined): void {
		if (!item) return;
		focusedKey = item.dataset.key ?? null;
		updateTabStops();
		item.focus();
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (globalDisabled || e.defaultPrevented) return;
		const items = visibleItems();
		const current = (e.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
		if (!current || !items.includes(current)) return;
		const currentIndex = items.indexOf(current);
		const key = current.dataset.key;
		if (!key) return;
		const hasChildren = current.hasAttribute("data-has-children");
		const isExpanded = current.getAttribute("aria-expanded") === "true";

		if (e.key === kbd.ARROW_DOWN) {
			e.preventDefault();
			focus(items[Math.min(currentIndex + 1, items.length - 1)]);
		} else if (e.key === kbd.ARROW_UP) {
			e.preventDefault();
			focus(items[Math.max(currentIndex - 1, 0)]);
		} else if (e.key === kbd.ARROW_RIGHT) {
			e.preventDefault();
			if (hasChildren && !isExpanded) toggleExpanded(key);
			else if (hasChildren) {
				const child = items[currentIndex + 1];
				if (child && current.contains(child)) focus(child);
			}
		} else if (e.key === kbd.ARROW_LEFT) {
			e.preventDefault();
			if (hasChildren && isExpanded) toggleExpanded(key);
			else {
				const parent = current.parentElement?.closest<HTMLElement>('[role="treeitem"]');
				if (parent && items.includes(parent)) focus(parent);
			}
		} else if (e.key === kbd.HOME || e.key === kbd.END) {
			e.preventDefault();
			focus(e.key === kbd.HOME ? items[0] : items.at(-1));
		} else if (e.key === kbd.SPACE) {
			e.preventDefault();
			select(key);
		} else if (e.key === kbd.ENTER) {
			e.preventDefault();
			select(key);
			if (hasChildren) toggleExpanded(key);
			props.onAction?.(key);
		} else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			const now = Date.now();
			search =
				now - lastTyped < 700 ? search + e.key.toLocaleLowerCase() : e.key.toLocaleLowerCase();
			lastTyped = now;
			const prefix = [...search].every((letter) => letter === search[0]) ? search[0] : search;
			const ordered = [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex + 1)];
			const match = ordered.find((item) =>
				(item.getAttribute("aria-label") ?? item.textContent ?? "")
					.trim()
					.toLocaleLowerCase()
					.startsWith(prefix),
			);
			if (match) {
				e.preventDefault();
				focus(match);
			}
		}
	}

	return {
		get root() {
			return {
				...treeAnatomy.attrs.root,
				id,
				role: "tree" as const,
				"aria-label": props["aria-label"],
				"aria-labelledby": props["aria-labelledby"],
				"aria-disabled": disabledAttr(globalDisabled),
				"aria-multiselectable": mode === "multiple" || undefined,
				onkeydown: handleKeydown,
			};
		},
		getItem(key, options) {
			const hasChildren = options?.hasChildren ?? false;
			const isExpanded = hasChildren ? expanded.current.has(key) : undefined;
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...treeAnatomy.attrs.item,
				role: "treeitem" as const,
				tabindex: !isDisabled && focusedKey === key ? 0 : -1,
				"aria-expanded": isExpanded,
				"aria-selected": mode === "none" ? undefined : selected.current.has(key),
				"aria-level": options?.level ?? 1,
				"aria-disabled": isDisabled || undefined,
				"data-key": key,
				"data-has-children": hasChildren ? ("" as const) : undefined,
				"data-expanded": isExpanded ? ("" as const) : undefined,
				"data-selected": mode !== "none" && selected.current.has(key) ? ("" as const) : undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onfocus: (event: FocusEvent) => {
					if (!isDisabled && event.target === event.currentTarget) focusedKey = key;
				},
				onclick: (event: MouseEvent) => {
					const item = event.currentTarget as HTMLElement;
					if (isDisabled || (event.target as Element).closest('[role="treeitem"]') !== item) return;
					focus(item);
					select(key);
					if (hasChildren) toggleExpanded(key);
					props.onAction?.(key);
				},
			};
		},
		getGroup() {
			return { ...treeAnatomy.attrs.group, role: "group" as const };
		},
		toggleExpanded,
	};
}
