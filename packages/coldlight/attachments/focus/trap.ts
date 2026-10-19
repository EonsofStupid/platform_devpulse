/**
 * @file attachments/focus/trap.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category focus
 *
 * Traps Tab focus within a container element.
 * Svelte 5 attachment — replaces legacy `use:focusTrap` action.
 *
 * When active, Tab and Shift+Tab cycle through focusable children
 * without escaping the container. Essential for modal dialogs,
 * sheets, and any overlay that captures focus.
 *
 * @example
 * ```svelte
 * <div {@attach focusTrap(() => isOpen)}>
 *   <button>First</button>
 *   <button>Last</button>
 * </div>
 * ```
 *
 * @consumers Dialog, Sheet, AlertDialog, Popover
 */

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap attachment.
 *
 * @param node - The container element to trap focus within
 * @param active - Reactive getter that returns whether the trap is active
 */
export function focusTrap(node: HTMLElement, active: () => boolean): () => void {
	function getFocusable(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
			(el) => !el.hasAttribute("disabled") && el.tabIndex >= 0,
		);
	}

	function handler(event: KeyboardEvent) {
		if (!active() || event.key !== "Tab") return;

		const focusable = getFocusable();
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	node.addEventListener("keydown", handler);

	return () => {
		node.removeEventListener("keydown", handler);
	};
}
