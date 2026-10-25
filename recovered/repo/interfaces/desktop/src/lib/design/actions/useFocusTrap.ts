/**
 * @file actions/useFocusTrap.ts
 * @package @devpulse/coldlight
 *
 * Traps Tab focus within an element. Use: `use:focusTrap` or `use:focusTrap={active}`.
 */
const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusTrap(node: HTMLElement, active = true) {
	let isActive = active;

	function getFocusable(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(el) => !el.hasAttribute("disabled") && el.tabIndex >= 0,
		);
	}

	function handler(event: KeyboardEvent) {
		if (!isActive || event.key !== "Tab") return;
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

	return {
		update(newActive: boolean) {
			isActive = newActive;
		},
		destroy() {
			node.removeEventListener("keydown", handler);
		},
	};
}
