<!--
  @file src/lib/sys/debug/vpb/dnd/DropZone.svelte
  @name DropZone.svelte
  @module @devpulse/sys/debug/vpb/dnd/DropZone
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<!--
  DropZone.svelte
  Drop target using Pragmatic DnD
-->
<script lang="ts">
    import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
    import { dnd } from "../state/dnd.svelte";
    import type { Snippet } from "svelte";

    interface Props {
        id: string;
        onDrop?: (draggedId: string) => void;
        children: Snippet;
    }

    let { id, onDrop, children }: Props = $props();
    let el = $state<HTMLElement | undefined>();
    let isOver = $state(false);

    $effect(() => {
        if (!el) return;

        return dropTargetForElements({
            element: el,
            getData: () => ({ id }),
            onDragEnter: () => {
                isOver = true;
            },
            onDragLeave: () => {
                isOver = false;
            },
            onDrop: ({ source }) => {
                isOver = false;
                const draggedId = source.data.id as string;
                onDrop?.(draggedId);
            },
        });
    });
</script>

<div bind:this={el} class="vpb-dropzone" class:vpb-dropzone--over={isOver}>
    {@render children()}
</div>

<style>
    .vpb-dropzone {
        transition: all var(--vpb-transition-fast);
    }

    .vpb-dropzone--over {
        background: oklch(from var(--vpb-cyber-start) l c h / 0.1);
        border-color: var(--vpb-cyber-start);
        box-shadow: 0 0 16px oklch(from var(--vpb-cyber-start) l c h / 0.3);
    }
</style>
