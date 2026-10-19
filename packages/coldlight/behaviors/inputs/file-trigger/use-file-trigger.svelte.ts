/**
 * useFileTrigger — ColdLight file input trigger primitive hook.
 *
 * Separates the visible trigger (button/element) from the hidden
 * <input type="file">, allowing fully custom-styled file pickers
 * while preserving native browser file selection behaviour.
 *
 * Usage pattern:
 * 1. Spread `triggerProps` on the visible button/element.
 * 2. Spread `inputProps` on a hidden `<input type="file">`.
 * 3. Pass `setInputEl` to `bind:this` on the input element.
 * 4. The trigger click/keyboard activation calls `open()` automatically.
 *
 * WAI-ARIA: The visible trigger carries role="button". The hidden input
 * is aria-hidden. Screen readers interact with the trigger, not the input.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useFileTrigger } from '#coldlight/coldlight';
 *   const ft = useFileTrigger({
 *     accept: 'image/*',
 *     multiple: true,
 *     onFilesSelected: (files) => console.log(files),
 *   });
 * </script>
 * <button {...ft.triggerProps}>Choose images</button>
 * <input {...ft.inputProps} bind:this={ft.setInputEl} />
 * ```
 */

import { fileTriggerAnatomy } from "./file-trigger.anatomy.js";
import type { UseFileTriggerProps, UseFileTriggerReturn } from "./file-trigger.types.js";

export function useFileTrigger(props: UseFileTriggerProps = {}): UseFileTriggerReturn {
	let inputEl = $state<HTMLInputElement | null>(null);

	function open(): void {
		if (!props.disabled && inputEl) {
			inputEl.click();
		}
	}

	function handleTriggerClick(): void {
		open();
	}

	function handleTriggerKeyDown(e: KeyboardEvent): void {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			open();
		}
	}

	function handleChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			props.onFilesSelected?.(target.files);
			// Reset so same file can be re-selected
			target.value = "";
		}
	}

	const triggerProps = $derived({
		...fileTriggerAnatomy.attrs.root,
		role: "button" as const,
		tabindex: props.disabled ? -1 : 0,
		"aria-disabled": props.disabled ? ("true" as const) : undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"data-disabled": props.disabled ? ("true" as const) : undefined,
		onclick: handleTriggerClick,
		onkeydown: handleTriggerKeyDown,
	});

	const inputProps = $derived({
		...fileTriggerAnatomy.attrs.input,
		type: "file" as const,
		tabindex: -1 as const,
		"aria-hidden": "true" as const,
		accept: props.accept,
		multiple: props.multiple,
		capture: props.capture,
		// webkitdirectory is non-standard but widely supported
		...(props.directory ? { webkitdirectory: true } : {}),
		onchange: handleChange,
		class: "sr-only",
	});

	return {
		open,
		get triggerProps() {
			return triggerProps;
		},
		get inputProps() {
			return inputProps;
		},
		setInputEl(el: HTMLInputElement | null) {
			inputEl = el;
		},
	};
}
