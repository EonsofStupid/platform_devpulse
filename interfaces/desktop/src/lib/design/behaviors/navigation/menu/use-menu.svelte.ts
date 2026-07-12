/**
 * useMenu — ColdLight menu primitive hook.
 *
 * Menu button pattern: trigger opens a menu popup with roving tabindex.
 * Arrow keys navigate, Enter/Space activates, Escape closes.
 * Parts: trigger, content (menu), item (menuitem, parameterized), separator, group, label.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 */

import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { useDismissLayer } from "../../_shared/dismiss-layer/index.js";
import { useEscapeLayer } from "../../_shared/escape-layer/index.js";
import { usePresence } from "../../_shared/presence/index.js";
import { createRovingHandler } from "../../_shared/roving-focus/index.js";
import { useTypeahead } from "../../_shared/typeahead/index.js";
import { menuAnatomy } from "./menu.anatomy.js";
import type { UseMenuProps, UseMenuReturn } from "./menu.types.js";

export function useMenu(props: UseMenuProps = {}): UseMenuReturn {
	const id = uid("menu");
	const contentId = `${id}-content`;

	let isOpen = $state(props.open ?? false);
	let contentEl: HTMLElement | null = null;

	function setOpen(v: boolean): void {
		if (v === isOpen) return;
		isOpen = v;
		props.onOpenChange?.(v);
		if (v) {
			// Focus first item on open
			requestAnimationFrame(() => {
				const first = contentEl?.querySelector<HTMLElement>(
					'[role="menuitem"]:not([data-disabled])',
				);
				first?.focus();
			});
		}
	}

	function getItems(): HTMLElement[] {
		if (!contentEl) return [];
		return Array.from(
			contentEl.querySelectorAll<HTMLElement>('[role="menuitem"]:not([data-disabled])'),
		);
	}

	// Shared composite-widget keyboard (vertical: Down/Up/Home/End) +
	// APG-recommended typeahead — type characters to jump to an item.
	const handleRovingKeydown = createRovingHandler({
		containerSelector: '[role="menu"]',
		itemSelector: '[role="menuitem"]:not([data-disabled])',
		orientation: "vertical",
	});

	const typeahead = useTypeahead({
		getItems,
		onMatch: (item) => item.focus(),
	});

	function handleContentKeydown(e: KeyboardEvent): void {
		handleRovingKeydown(e);
		// Item-level Enter/Space activation preventDefaults before this
		// bubbles here — don't buffer activation keys as typed characters.
		if (!e.defaultPrevented) typeahead.handleKeydown(e);
	}

	const trigger = $derived({
		...menuAnatomy.attrs.trigger,
		type: "button" as const,
		"aria-expanded": isOpen,
		"aria-haspopup": "menu" as const,
		"aria-controls": contentId,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclick: () => setOpen(!isOpen),
		onkeydown: (e: KeyboardEvent) => {
			if (e.key === kbd.ARROW_DOWN) {
				e.preventDefault();
				setOpen(true);
			}
		},
	});

	const content = $derived({
		...menuAnatomy.attrs.content,
		id: contentId,
		role: "menu" as const,
		"aria-label": props["aria-label"],
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onkeydown: handleContentKeydown,
	});

	const separator = $derived({
		...menuAnatomy.attrs.separator,
		role: "separator" as const,
	});

	function attachContent(node: HTMLElement): { destroy(): void } {
		contentEl = node;
		useEscapeLayer({ enabled: () => isOpen, onEscape: () => setOpen(false) });
		useDismissLayer({
			enabled: () => isOpen,
			node: () => contentEl,
			onDismiss: () => setOpen(false),
		});
		usePresence({ open: () => isOpen, node: () => contentEl });
		return {
			destroy() {
				contentEl = null;
			},
		};
	}

	return {
		get open() {
			return isOpen;
		},
		setOpen,
		get trigger() {
			return trigger;
		},
		get content() {
			return content;
		},
		get separator() {
			return separator;
		},

		getItem(value: string, options?: { disabled?: boolean }) {
			const isDisabled = options?.disabled ?? false;
			return {
				...menuAnatomy.attrs.item,
				role: "menuitem" as const,
				tabindex: -1 as const,
				"data-value": value,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				"aria-disabled": isDisabled || undefined,
				onclick: () => {
					if (!isDisabled) {
						props.onSelect?.(value);
						setOpen(false);
					}
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isDisabled) return;
					if (e.key === kbd.ENTER || e.key === kbd.SPACE) {
						e.preventDefault();
						props.onSelect?.(value);
						setOpen(false);
					}
				},
			};
		},

		getGroup(label: string) {
			return {
				...menuAnatomy.attrs.group,
				role: "group" as const,
				"aria-label": label,
			};
		},

		attachContent,
	};
}
