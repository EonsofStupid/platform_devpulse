/**
 * @file actions/useClickOutside.ts
 * @package @devpulse/coldlight
 *
 * Detects clicks outside an element. Use: `use:clickOutside={callback}`.
 */
export function clickOutside(node: HTMLElement, callback: () => void) {
	function handler(event: MouseEvent) {
		if (!node.contains(event.target as Node)) callback();
	}

	document.addEventListener("click", handler, true);

	return {
		update(newCallback: () => void) {
			callback = newCallback;
		},
		destroy() {
			document.removeEventListener("click", handler, true);
		},
	};
}
