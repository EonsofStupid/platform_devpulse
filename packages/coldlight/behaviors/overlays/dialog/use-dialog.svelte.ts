/**
 * useDialog — ColdLight dialog primitive hook.
 *
 * Svelte 5 runes-native. Manages open/close state, ARIA attributes,
 * focus trapping, scroll lock, click-outside dismiss, and exit animations.
 *
 * Uses native <dialog> with showModal() for built-in focus trapping
 * and top-layer rendering.
 *
 * Parts: trigger, overlay, content, title, description, close
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * @example
 * ```svelte
 * <script>
 *   import { useDialog } from '#coldlight/coldlight';
 *   const dialog = useDialog({ onOpenChange: (v) => console.log(v) });
 * </script>
 * <button {...dialog.trigger}>Open</button>
 * {#if dialog.open}
 *   <div {...dialog.overlay} use:dialog.attachOverlay></div>
 *   <dialog {...dialog.content} use:dialog.attachContent>
 *     <h2 {...dialog.title}>Title</h2>
 *     <p {...dialog.description}>Description</p>
 *     <button {...dialog.close}>Close</button>
 *   </dialog>
 * {/if}
 * ```
 */

import { tick } from "svelte";
import { createIds } from "../../_internal/utils/uid.js";
import { useDismissLayer } from "../../_shared/dismiss-layer/index.js";
import { usePresence } from "../../_shared/presence/index.js";
import { useScrollLock } from "../../_shared/scroll-lock/index.js";
import { dialogAnatomy } from "./dialog.anatomy.js";
import type { UseDialogProps, UseDialogReturn } from "./dialog.types.js";

export function useDialog(props: UseDialogProps = {}): UseDialogReturn {
	const ids = createIds("dialog", ["content", "title", "description"] as const);
	const closeOnEscape = props.closeOnEscape ?? true;
	const closeOnOutsideClick = props.closeOnOutsideClick ?? true;
	const preventScroll = props.preventScroll ?? true;

	// ── State ────────────────────────────────────────────────────
	let isOpen = $state(props.open ?? false);
	let contentEl: HTMLDialogElement | null = null;
	let overlayEl: HTMLElement | null = null;
	let triggerEl: HTMLElement | null = null;

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

	// ── Slot attributes (all $derived for reactivity) ────────────
	const trigger = $derived({
		...dialogAnatomy.attrs.trigger,
		type: "button" as const,
		"aria-haspopup": "dialog" as const,
		"aria-expanded": isOpen,
		"aria-controls": ids.content,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclick: () => setOpen(!isOpen),
	});

	const content = $derived({
		...dialogAnatomy.attrs.content,
		id: ids.content,
		role: "dialog" as const,
		"aria-modal": "true" as const,
		"aria-labelledby": ids.title,
		"aria-describedby": ids.description,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclose: () => setOpen(false),
		oncancel: (e: Event) => {
			e.preventDefault();
			if (closeOnEscape) setOpen(false);
		},
	});

	const overlay = $derived({
		...dialogAnatomy.attrs.overlay,
		"aria-hidden": "true" as const,
		popover: "manual" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
	});

	const title = $derived({
		...dialogAnatomy.attrs.title,
		id: ids.title,
	});

	const description = $derived({
		...dialogAnatomy.attrs.description,
		id: ids.description,
	});

	const close = $derived({
		...dialogAnatomy.attrs.close,
		type: "button" as const,
		onclick: () => setOpen(false),
	});

	// ── Svelte actions (attach to DOM elements) ──────────────────
	function attachContent(node: HTMLDialogElement): { destroy(): void } {
		contentEl = node;

		if (isOpen) {
			tick().then(() => {
				contentEl?.showModal?.();
				overlayEl?.showPopover?.();
			});
		}

		useScrollLock(() => isOpen && preventScroll);

		useDismissLayer({
			enabled: () => isOpen && closeOnOutsideClick,
			node: () => contentEl,
			onDismiss: () => setOpen(false),
		});

		usePresence({
			open: () => isOpen,
			node: () => contentEl,
			onExitComplete: () => {
				contentEl?.close?.();
				overlayEl?.hidePopover?.();
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

	// ── Public API ───────────────────────────────────────────────
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
