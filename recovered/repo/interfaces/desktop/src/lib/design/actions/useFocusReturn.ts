/**
 * @file actions/useFocusReturn.ts
 * @package @devpulse/coldlight
 *
 * Saves the currently focused element on mount and restores focus on destroy.
 * Use: `use:focusReturn`.
 */
export function focusReturn(_node: HTMLElement) {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	return {
		destroy() {
			previouslyFocused?.focus();
		},
	};
}
