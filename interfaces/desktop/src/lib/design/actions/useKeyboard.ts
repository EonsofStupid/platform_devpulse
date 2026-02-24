/**
 * @file actions/useKeyboard.ts
 * @package @devpulse/coldlight
 *
 * Declarative keyboard handler. Use: `use:keyboard={{ Enter: handler, Escape: handler }}`.
 */
type KeyMap = Record<string, (event: KeyboardEvent) => void>;

export function keyboard(node: HTMLElement, keyMap: KeyMap) {
	let map = keyMap;

	function handler(event: KeyboardEvent) {
		const fn = map[event.key];
		if (fn) fn(event);
	}

	node.addEventListener("keydown", handler);

	return {
		update(newMap: KeyMap) {
			map = newMap;
		},
		destroy() {
			node.removeEventListener("keydown", handler);
		},
	};
}
