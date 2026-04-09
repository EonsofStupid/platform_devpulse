/**
 * useAlertDialog — ColdLight alert dialog primitive hook.
 *
 * Modal dialog for destructive/important confirmations. role=alertdialog.
 * Focus trapped. Cancel + Action buttons. Escape closes.
 * Parts: trigger, overlay, content, title, description, cancel, action.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import { tick } from "svelte";
import { createIds } from "../_internal/utils/uid.js";
import { usePresence } from "../_shared/presence/index.js";
import { useScrollLock } from "../_shared/scroll-lock/index.js";
import { alertDialogAnatomy } from "./alert-dialog.anatomy.js";
import type { UseAlertDialogProps, UseAlertDialogReturn } from "./alert-dialog.types.js";

export function useAlertDialog(props: UseAlertDialogProps = {}): UseAlertDialogReturn {
	const ids = createIds("alert-dialog", ["content", "title", "description"] as const);

	let isOpen = $state(props.open ?? false);
	let contentEl: HTMLDialogElement | null = null;
	let overlayEl: HTMLElement | null = null;

	function setOpen(value: boolean): void {
		if (value === isOpen) return;
		if (value) {
			isOpen = true;
			props.onOpenChange?.(true);
			tick().then(() => {
				contentEl?.showModal?.();
				overlayEl?.showPopover?.();
			});
		} else {
			isOpen = false;
			props.onOpenChange?.(false);
		}
	}

	const trigger = $derived({
		...alertDialogAnatomy.attrs.trigger,
		type: "button" as const,
		"aria-haspopup": "dialog" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclick: () => setOpen(true),
	});

	const overlay = $derived({
		...alertDialogAnatomy.attrs.overlay,
		"aria-hidden": "true" as const,
		popover: "manual" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
	});

	const content = $derived({
		...alertDialogAnatomy.attrs.content,
		id: ids.content,
		role: "alertdialog" as const,
		"aria-modal": "true" as const,
		"aria-labelledby": ids.title,
		"aria-describedby": ids.description,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclose: () => setOpen(false),
		oncancel: (e: Event) => {
			e.preventDefault();
			setOpen(false);
		},
	});

	const title = $derived({ ...alertDialogAnatomy.attrs.title, id: ids.title });
	const description = $derived({ ...alertDialogAnatomy.attrs.description, id: ids.description });

	const cancel = $derived({
		...alertDialogAnatomy.attrs.cancel,
		type: "button" as const,
		onclick: () => {
			props.onCancel?.();
			setOpen(false);
		},
	});

	const action = $derived({
		...alertDialogAnatomy.attrs.action,
		type: "button" as const,
		onclick: () => {
			props.onAction?.();
			setOpen(false);
		},
	});

	function attachContent(node: HTMLDialogElement): { destroy(): void } {
		contentEl = node;
		if (isOpen)
			tick().then(() => {
				contentEl?.showModal?.();
				overlayEl?.showPopover?.();
			});
		useScrollLock(() => isOpen);
		usePresence({
			open: () => isOpen,
			node: () => contentEl,
			onExitComplete: () => {
				contentEl?.close?.();
				overlayEl?.hidePopover?.();
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
		get cancel() {
			return cancel;
		},
		get action() {
			return action;
		},
		attachContent,
		attachOverlay,
	};
}
