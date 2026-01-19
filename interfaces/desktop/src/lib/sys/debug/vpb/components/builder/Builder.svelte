<!--
  @file src/lib/sys/debug/vpb/components/builder/Builder.svelte
  @layer lib
  @description Main Canvas for the Visual Page Builder.
  @since 1.0.0
-->
<script lang="ts">
    import { builder } from "./state";

    // Placeholder for synthesized view
</script>

<div class="vpb-builder">
    {#if builder.selectedNode}
        <div class="vpb-builder-controls">
            <h3>Editing: {builder.selectedNode.tagName}</h3>
            <!-- Property editors go here -->
        </div>
    {:else}
        <div class="vpb-builder-empty">
            <p>Select an element in Inspect mode to edit here.</p>
        </div>
    {/if}
</div>

<style>
    .vpb-builder {
        padding: var(--dp-space-4);
        color: var(--dp-vpb-text-primary);
    }

    .vpb-builder-empty {
        text-align: center;
        color: var(--dp-vpb-text-muted);
        font-family: var(--dp-font-mono);
        font-size: var(--dp-text-xs);
        margin-top: var(--dp-space-8);
    }
</style>
