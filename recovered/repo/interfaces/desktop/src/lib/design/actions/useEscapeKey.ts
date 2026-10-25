/**
 * @file actions/useEscapeKey.ts
 * @package @devpulse/coldlight
 *
 * Fires callback on Escape keypress. Use: `use:escapeKey={callback}`.
 */
export function escapeKey(node: HTMLElement, callback: () => void) {
	function handler(event: KeyboardEvent) {
		if (event.key === "Escape") callback();
	}

	node.addEventListener("keydown", handler);

	return {
		update(newCallback: () => void) {
			callback = newCallback;
		},
		destroy() {
			node.removeEventListener("keydown", handler);
		},
	};
}
