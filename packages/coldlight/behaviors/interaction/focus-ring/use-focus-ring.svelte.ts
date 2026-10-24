/**
 * useFocusRing — ColdLight interaction primitive.
 *
 * Tracks whether focus was keyboard-initiated (Tab) vs mouse click.
 * Uses a module-level input modality tracker that listens for keydown/pointerdown
 * to determine the most recent input method.
 *
 * isFocusVisible = true only when focus came from keyboard navigation.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useFocusRing } from '#coldlight/coldlight';
 *   const { isFocusVisible, focusRingProps } = useFocusRing();
 * </script>
 * <button {...focusRingProps} class:focus-ring={isFocusVisible}>Save</button>
 * ```
 */

import type { UseFocusRingProps, UseFocusRingReturn } from "./focus-ring.types.js";

// ── Module-level input modality tracker ────────────────────────
// Shared across all useFocusRing instances.
let currentModality: "keyboard" | "pointer" = "pointer";
let listenerAttached = false;

function attachModalityListeners(): void {
	if (listenerAttached) return;
	if (typeof document === "undefined") return;

	document.addEventListener(
		"keydown",
		(e: KeyboardEvent) => {
			// Only track Tab as keyboard modality for focus ring purposes.
			// Other keys pressed while focused shouldn't trigger focus ring.
			if (e.key === "Tab") {
				currentModality = "keyboard";
			}
		},
		true,
	);

	document.addEventListener(
		"pointerdown",
		() => {
			currentModality = "pointer";
		},
		true,
	);

	listenerAttached = true;
}

// ── Hook ───────────────────────────────────────────────────────

export function useFocusRing(props: UseFocusRingProps = {}): UseFocusRingReturn {
	attachModalityListeners();

	let isFocused = $state(false);
	let modalityOnFocus = $state<"keyboard" | "pointer">("pointer");
	const isFocusVisible = $derived(isFocused && modalityOnFocus === "keyboard");

	function handleFocus(): void {
		isFocused = true;
		modalityOnFocus = currentModality;
	}

	function handleBlur(): void {
		isFocused = false;
	}

	const focusRingProps = $derived({
		onfocus: handleFocus,
		onblur: handleBlur,
		"data-focus-visible": isFocusVisible ? ("" as const) : undefined,
		...(props.autoFocus ? { autofocus: true } : {}),
	});

	return {
		get isFocusVisible() {
			return isFocusVisible;
		},
		get focusRingProps() {
			return focusRingProps;
		},
	};
}
