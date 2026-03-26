/**
 * Focus trap — Tab key cycles within a container.
 *
 * Used by: dialog, sheet, alert-dialog, modal.
 *
 * When active:
 * - Tab from last focusable → first focusable
 * - Shift+Tab from first focusable → last focusable
 * - Focus cannot leave the container via keyboard
 * - On mount, focus moves to first focusable (or autofocus element)
 * - On unmount, focus restores to the previously focused element
 */

import type { FocusTrapConfig } from "./types.js";

const FOCUSABLE_SELECTOR = [
	"a[href]",
	"area[href]",
	"input:not([disabled]):not([type='hidden'])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"button:not([disabled])",
	"iframe",
	"object",
	"embed",
	"[tabindex]:not([tabindex='-1'])",
	"[contenteditable]",
	"audio[controls]",
	"video[controls]",
	"summary",
	"details > summary:first-of-type",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
		(el) => !el.hasAttribute("disabled") && el.tabIndex >= 0 && isVisible(el),
	);
}

function isVisible(el: HTMLElement): boolean {
	return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0;
}

export function useFocusTrap(config: FocusTrapConfig): void {
	$effect(() => {
		if (!config.enabled()) return;

		const container = config.node();
		if (!container) return;

		const previouslyFocused = document.activeElement as HTMLElement | null;

		requestAnimationFrame(() => {
			const initialTarget = config.initialFocus?.();
			if (initialTarget) {
				initialTarget.focus();
			} else {
				const autofocus = container.querySelector<HTMLElement>("[autofocus]");
				if (autofocus) {
					autofocus.focus();
				} else {
					const focusable = getFocusableElements(container);
					if (focusable.length > 0) {
						focusable[0].focus();
					} else {
						container.setAttribute("tabindex", "-1");
						container.focus();
					}
				}
			}
		});

		function onKeydown(e: KeyboardEvent): void {
			if (e.key !== "Tab") return;

			// biome-ignore lint/style/noNonNullAssertion: container is guaranteed set by $effect before keydown fires
			const focusable = getFocusableElements(container!);
			if (focusable.length === 0) {
				e.preventDefault();
				return;
			}

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const active = document.activeElement;

			if (e.shiftKey) {
				if (active === first || active === container) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (active === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}

		container.addEventListener("keydown", onKeydown);

		return () => {
			container.removeEventListener("keydown", onKeydown);
			if (config.restoreFocus !== false && previouslyFocused && previouslyFocused.isConnected) {
				previouslyFocused.focus();
			}
		};
	});
}
