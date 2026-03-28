/**
 * usePopover — ColdLight popover primitive hook.
 *
 * Non-modal overlay triggered by a button. Dismiss on Escape or click outside.
 * Parts: trigger, content, arrow, close.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { createIds } from "../_internal/utils/uid.js";
import { useDismissLayer } from "../_shared/dismiss-layer/index.js";
import { useEscapeLayer } from "../_shared/escape-layer/index.js";
import { usePresence } from "../_shared/presence/index.js";
import { popoverAnatomy } from "./popover.anatomy.js";
import type { UsePopoverProps, UsePopoverReturn } from "./popover.types.js";

export function usePopover(props: UsePopoverProps = {}): UsePopoverReturn {
	const ids = createIds("popover", ["trigger", "content"] as const);
	const closeOnEscape = props.closeOnEscape ?? true;
	const closeOnOutsideClick = props.closeOnOutsideClick ?? true;

	let isOpen = $state(props.open ?? false);
	let contentEl: HTMLElement | null = null;

	function setOpen(value: boolean): void {
		if (value === isOpen) return;
		isOpen = value;
		props.onOpenChange?.(value);
	}

	const trigger = $derived({
		...popoverAnatomy.attrs.trigger,
		type: "button" as const,
		"aria-expanded": isOpen,
		"aria-haspopup": "dialog" as const,
		"aria-controls": ids.content,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclick: () => setOpen(!isOpen),
	});

	const content = $derived({
		...popoverAnatomy.attrs.content,
		id: ids.content,
		role: "dialog" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
	});

	const arrow = $derived({
		...popoverAnatomy.attrs.arrow,
		"aria-hidden": "true" as const,
	});

	const close = $derived({
		...popoverAnatomy.attrs.close,
		type: "button" as const,
		onclick: () => setOpen(false),
	});

	function attachContent(node: HTMLElement): { destroy(): void } {
		contentEl = node;

		if (closeOnEscape) {
			useEscapeLayer({
				enabled: () => isOpen,
				onEscape: () => setOpen(false),
			});
		}

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
		});

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
		get arrow() {
			return arrow;
		},
		get close() {
			return close;
		},
		attachContent,
	};
}
