<!--
  @file src/lib/sys/debug/vpb/dnd/DropZone.svelte
  @name DropZone.svelte
  @module @devpulse/sys/debug/vpb/dnd/DropZone
  @layer lib

  @description
  Drop target using Pragmatic DnD. `canDrop` keeps a slot from taking what it
  refuses, so a refused drag never lights the zone.

  @props
  - id: string - the zone's own id
  - canDrop: (draggedId) => boolean - whether this zone takes that drag
  - onDrop: (draggedId) => void - what a drop does
  - children: Snippet - the zone's content

  @dependencies
  - @atlaskit/pragmatic-drag-and-drop
  - state/dnd.svelte.ts

  @consumers
  - components/builder/Builder.svelte

  @since 1.0.0
-->
<script lang="ts">
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Snippet } from "svelte";
import { dnd } from "../../../state/dnd.svelte.js";

interface Props {
	id: string;
	canDrop?: (draggedId: string) => boolean;
	onDrop?: (draggedId: string) => void;
	children: Snippet;
}

let { id, canDrop, onDrop, children }: Props = $props();
let el = $state<HTMLElement | undefined>();
let isOver = $state(false);

$effect(() => {
	if (!el) return;

	return dropTargetForElements({
		element: el,
		getData: () => ({ id }),
		getDropEffect: () => dnd.dropEffect,
		canDrop: ({ source }) => {
			const draggedId = source.data.id;
			return typeof draggedId === "string" && (canDrop?.(draggedId) ?? true);
		},
		onDragEnter: () => {
			isOver = true;
		},
		onDragLeave: () => {
			isOver = false;
		},
		onDrop: ({ source }) => {
			isOver = false;
			const draggedId = source.data.id;
			if (typeof draggedId === "string") onDrop?.(draggedId);
		},
	});
});
</script>

<div bind:this={el} class="vpb-dropzone" class:vpb-dropzone--over={isOver}>
	{@render children()}
</div>

<style>
	.vpb-dropzone {
		border: var(--border-width-thin) solid transparent;
		border-radius: var(--radius-sm);
		transition: all var(--vpb-transition-fast);
	}

	.vpb-dropzone--over {
		background: var(--vpb-cyber-fill);
		border-color: var(--vpb-cyber-start);
		box-shadow: var(--vpb-panel-glow);
	}
</style>
