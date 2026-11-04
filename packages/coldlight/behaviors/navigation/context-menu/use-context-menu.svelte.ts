/**
 * useContextMenu — the menu behavior, opened by right-click at the pointer.
 *
 * The contextmenu event opens it at its coordinates (the keyboard's context-menu
 * key and Shift+F10 raise the same event). Arrow keys, Enter/Space, Escape and the
 * outside press are useMenu's. On close, focus goes back where it was.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import { useMenu } from "../menu/use-menu.svelte.js";
import { contextMenuAnatomy } from "./context-menu.anatomy.js";
import type { UseContextMenuProps, UseContextMenuReturn } from "./context-menu.types.js";

export function useContextMenu(props: UseContextMenuProps = {}): UseContextMenuReturn {
	let position = $state({ x: 0, y: 0 });
	let previousFocus: HTMLElement | null = null;
	let contentEl: HTMLElement | null = null;

	const menu = useMenu({
		triggerless: true,
		get open() {
			return props.open;
		},
		onOpenChange: (next) => {
			props.onOpenChange?.(next);
			if (next) return;
			// An outside press leaves focus where the press put it.
			const active = document.activeElement;
			if (active === document.body || (active && contentEl?.contains(active))) {
				previousFocus?.focus();
			}
		},
		onSelect: (value) => props.onSelect?.(value),
		get "aria-label"() {
			return props["aria-label"];
		},
	});

	function openAt(x: number, y: number): void {
		const active = document.activeElement;
		previousFocus = active instanceof HTMLElement ? active : null;
		position = { x, y };
		menu.setOpen(true);
	}

	const trigger = $derived({
		...contextMenuAnatomy.attrs.trigger,
		"data-state": menu.open ? ("open" as const) : ("closed" as const),
		oncontextmenu: (event: MouseEvent) => {
			event.preventDefault();
			openAt(event.clientX, event.clientY);
		},
	});

	function attachContent(node: HTMLElement): { destroy(): void } {
		contentEl = node;
		const attached = menu.attachContent(node);
		// Stay inside the viewport.
		const box = node.getBoundingClientRect();
		position = {
			x: Math.max(0, Math.min(position.x, window.innerWidth - box.width)),
			y: Math.max(0, Math.min(position.y, window.innerHeight - box.height)),
		};
		return {
			destroy() {
				contentEl = null;
				attached.destroy();
			},
		};
	}

	return {
		menu,
		get position() {
			return position;
		},
		get trigger() {
			return trigger;
		},
		openAt,
		attachContent,
	};
}
