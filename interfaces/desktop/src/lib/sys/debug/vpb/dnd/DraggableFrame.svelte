<!--
  DraggableFrame.svelte
  Draggable wrapper using Pragmatic DnD
-->
<script lang="ts">
    import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
    import { dnd } from "../state/dnd.svelte";
    import type { Snippet } from "svelte";

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
            },
            onDrop: () => {
                isDragging = false;
                dnd.setDragging(null);
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
        opacity: 0.5;
        transform: scale(0.98);
    }
</style>
