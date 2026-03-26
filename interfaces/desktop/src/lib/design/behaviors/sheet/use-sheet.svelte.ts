/**
 * useSheet — ColdLight sheet/drawer primitive hook.
 *
 * Modal panel that slides in from an edge. Same ARIA as dialog (role=dialog, aria-modal).
 * Focus trapped, scroll locked, dismiss on escape/outside click.
 * data-side indicates which edge ("top", "right", "bottom", "left").
 * Parts: trigger, overlay, content, title, description, close.
 */

import { tick } from "svelte";
import { useDismissLayer } from "../_shared/dismiss-layer/index.js";
import { usePresence } from "../_shared/presence/index.js";
import { useScrollLock } from "../_shared/scroll-lock/index.js";
import { createIds } from "../_internal/utils/uid.js";
import { sheetAnatomy } from "./sheet.anatomy.js";
import type { UseSheetProps, UseSheetReturn } from "./sheet.types.js";

export function useSheet(props: UseSheetProps = {}): UseSheetReturn {
	const ids = createIds("sheet", ["content", "title", "description"] as const);
	const side = props.side ?? "right";
	const closeOnEscape = props.closeOnEscape ?? true;
	const closeOnOutsideClick = props.closeOnOutsideClick ?? true;

	let isOpen = $state(props.open ?? false);
	let contentEl: HTMLDivElement | null = null;
	let overlayEl: HTMLElement | null = null;
	let triggerEl: HTMLElement | null = null;

	function setOpen(value: boolean): void {
		if (value === isOpen) return;
		if (value) {
			isOpen = true;
			props.onOpenChange?.(true);
		} else {
			isOpen = false;
			props.onOpenChange?.(false);
		}
	}

	const trigger = $derived({
		...sheetAnatomy.attrs.trigger,
		type: "button" as const,
		"aria-haspopup": "dialog" as const,
		"aria-expanded": isOpen,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclick: () => setOpen(!isOpen),
	});

	const overlay = $derived({
		...sheetAnatomy.attrs.overlay,
		"aria-hidden": "true" as const,
		popover: "manual" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
	});

	const content = $derived({
		...sheetAnatomy.attrs.content,
		id: ids.content,
		role: "dialog" as const,
		"aria-modal": "true" as const,
		"aria-labelledby": ids.title,
		"aria-describedby": ids.description,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		"data-side": side,
		onclose: () => setOpen(false),
		oncancel: (e: Event) => {
			e.preventDefault();
			if (closeOnEscape) setOpen(false);
		},
	});

	const title = $derived({ ...sheetAnatomy.attrs.title, id: ids.title });
	const description = $derived({ ...sheetAnatomy.attrs.description, id: ids.description });
	const close = $derived({
		...sheetAnatomy.attrs.close,
		type: "button" as const,
		onclick: () => setOpen(false),
	});

	function attachContent(node: HTMLDivElement): { destroy(): void } {
		contentEl = node;
		useScrollLock(() => isOpen);
		if (closeOnOutsideClick) {
			useDismissLayer({
				enabled: () => isOpen,
				node: () => contentEl,
				onDismiss: () => setOpen(false),
			});
		}
		usePresence({
			open: () => isOpen,
			node: () => contentEl,
			onExitComplete: () => {
				triggerEl?.focus();
			},
		});
		return {
			destroy() {
				contentEl = null;
			},
		};
	}

	function attachOverlay(node: HTMLElement): { destroy(): void } {
		overlayEl = node;
		return {
			destroy() {
				overlayEl = null;
			},
		};
	}

	function attachTrigger(node: HTMLElement): { destroy(): void } {
		triggerEl = node;
		return {
			destroy() {
				triggerEl = null;
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
		get overlay() {
			return overlay;
		},
		get content() {
			return content;
		},
		get title() {
			return title;
		},
		get description() {
			return description;
		},
		get close() {
			return close;
		},
		attachContent,
		attachOverlay,
		attachTrigger,
	};
}
