<!--
  @file src/lib/sys/debug/vpb/dnd/DraggableFrame.svelte
  @name DraggableFrame.svelte
  @module @devpulse/sys/debug/vpb/dnd/DraggableFrame
  @layer lib

  @description
  Draggable wrapper using Pragmatic DnD. It carries a drag id from
  `state/dnd.svelte.ts`: a palette kind copies, a tree block moves.

  @props
  - id: string - the drag id (`paletteDragId`, `blockDragId`)
  - children: Snippet - what is dragged

  @dependencies
  - @atlaskit/pragmatic-drag-and-drop
  - state/dnd.svelte.ts

  @consumers
  - components/builder/Builder.svelte

  @since 1.0.0
-->
<script lang="ts">
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Snippet } from "svelte";
import { dnd, parseDragId } from "../../../state/dnd.svelte.js";

interface Props {
	id: string;
	children: Snippet;
}

let { id, children }: Props = $props();
let el = $state<HTMLElement | undefined>();
let isDragging = $state(false);

$effect(() => {
	if (!el) return;

	return draggable({
		element: el,
		getInitialData: () => ({ id }),
		onDragStart: () => {
			isDragging = true;
			dnd.setDragging(id);
			dnd.setDropEffect(parseDragId(id)?.type === "palette" ? "copy" : "move");
		},
		onDrop: () => {
			isDragging = false;
			dnd.reset();
		},
	});
});
</script>

<div
	bind:this={el}
	class="vpb-draggable"
	class:vpb-draggable--dragging={isDragging}
>
	{@render children()}
</div>

<style>
	.vpb-draggable {
		cursor: grab;
		transition:
			opacity var(--vpb-transition-fast),
			transform var(--vpb-transition-fast);
	}

	.vpb-draggable:active {
		cursor: grabbing;
	}

	.vpb-draggable--dragging {
		opacity: var(--opacity-50);
		transform: scale(0.98);
	}
</style>
