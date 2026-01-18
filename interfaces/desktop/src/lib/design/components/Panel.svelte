<!--
  Panel.svelte - Composable Panel Component
  Implements both Glass and Matte Inset recipes
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Panel recipe: 'glass' (flush dual-tint) or 'matte' (sunken content) */
        variant?: "glass" | "matte";
        /** Size variant: 'sm', 'md', 'lg' */
        size?: "sm" | "md" | "lg";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "glass",
        size = "md",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="dp-panel dp-panel--{variant} {size !== 'md'
        ? `dp-panel--${size}`
        : ''} {className}"
    role="region"
>
    <div class="dp-panel__content">
        {@render children()}
    </div>
</div>

<style>
    /* Component-scoped styles that enhance the base CSS */
    .dp-panel {
        /* Ensure grid works properly */
        min-width: 0;
        min-height: 0;
    }

    :global(.dp-panel__content) {
        /* Content fills the grid cell */
        display: flex;
        flex-direction: column;
    }
</style>
