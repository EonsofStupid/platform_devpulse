/**
 * useDropZone — ColdLight drop target primitive hook.
 *
 * Manages the full DragEvent lifecycle on a drop target:
 * idle → active (drag enters document) → over (drag over this zone) → idle.
 *
 * Correctly handles the dragenter/dragleave child-element re-entry problem
 * with an enter counter so nested children don't flicker the over state.
 *
 * Validates accepted types against the `accept` list and `acceptFn` predicate.
 * Sets data-state="rejected" when an incompatible item is dragged over.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useDropZone } from '#coldlight/coldlight';
 *   const zone = useDropZone({
 *     accept: ['text/plain'],
 *     onDrop: (e) => console.log(e.dataTransfer?.getData('text/plain')),
 *     'aria-label': 'Drop files here',
 *   });
 * </script>
 * <div {...zone.root}>
 *   {zone.isOver ? 'Release to drop' : 'Drag items here'}
 *   <div {...zone.indicator} />
 * </div>
 * ```
 */

import { dropZoneAnatomy } from "./drop-zone.anatomy.js";
import type { DropZoneState, UseDropZoneProps, UseDropZoneReturn } from "./drop-zone.types.js";

export function useDropZone(props: UseDropZoneProps = {}): UseDropZoneReturn {
	let enterCount = 0;
	let state = $state<DropZoneState>("idle");

	function isAccepted(e: DragEvent): boolean {
		if (props.disabled) return false;
		if (props.acceptFn && !props.acceptFn(e)) return false;
		if (props.accept && props.accept.length > 0 && e.dataTransfer) {
			const types = Array.from(e.dataTransfer.types);
			return props.accept.some((t) => types.includes(t));
		}
		return true;
	}

	function handleDragEnter(e: DragEvent): void {
		e.preventDefault();
		enterCount++;
		if (enterCount === 1) {
			state = isAccepted(e) ? "over" : "rejected";
			props.onDragEnter?.(e);
		}
	}

	function handleDragOver(e: DragEvent): void {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = props.dropEffect ?? "copy";
		}
		// Keep state in sync if somehow enterCount was missed
		if (state === "idle") {
			state = isAccepted(e) ? "over" : "rejected";
		}
	}

	function handleDragLeave(e: DragEvent): void {
		enterCount--;
		if (enterCount === 0) {
			state = "idle";
			props.onDragLeave?.(e);
		}
	}

	function handleDrop(e: DragEvent): void {
		e.preventDefault();
		enterCount = 0;
		const wasAccepted = state !== "rejected";
		state = "idle";
		if (wasAccepted) {
			props.onDrop?.(e);
		}
	}

	const isOver = $derived(state === "over");

	const root = $derived({
		...dropZoneAnatomy.attrs.root,
		role: "region" as const,
		tabindex: props.disabled ? undefined : 0,
		"aria-label": props["aria-label"],
		"data-state": state,
		ondragenter: handleDragEnter,
		ondragover: handleDragOver,
		ondragleave: handleDragLeave,
		ondrop: handleDrop,
	});

	const indicator = $derived({ ...dropZoneAnatomy.attrs.indicator });

	return {
		get state() {
			return state;
		},
		get isOver() {
			return isOver;
		},
		get root() {
			return root;
		},
		get indicator() {
			return indicator;
		},
	};
}
