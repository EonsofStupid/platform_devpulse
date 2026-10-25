<!--
  @file src/lib/sys/debug/vpb/components/Header.svelte
  @layer lib
  @description Draggable Header with Tabs for standard VPB Shell.
  @since 1.0.0
-->
<script lang="ts">
    import { Tabs } from "$lib/design/primitives"; // Using Primitive directly
    import type { TabItem } from "$lib/design/primitives/Tabs.svelte";
    import { vpb } from "../state/vpb.svelte";

    // Standard Tabs Definition
    const TABS: TabItem[] = [
        { id: "inspector", label: "Inspect" },
        { id: "builder", label: "Build" },
    ];

    let activeTab = $state(vpb.domain);

    // Sync local tab state with global vpb state
    function handleTabChange(id: string) {
        vpb.setDomain(id as any);
    }

    // Auto-sync when global state changes (e.g. from inspection trigger)
    $effect(() => {
        activeTab = vpb.domain;
    });
</script>

<div class="vpb-header" data-dragging={vpb.isDragging}>
    <div class="vpb-drag-handle" onmousedown={(e) => vpb.startDrag(e)}>
        <span class="vpb-logo">⚡</span>
        <span class="vpb-title">DevPulse</span>
    </div>

    <div class="vpb-tabs-container">
        <!-- Render Tabs Primitive -->
        <Tabs
            tabs={TABS}
            bind:activeTab
            onchange={handleTabChange}
            class="vpb-tabs-root"
        >
            {#snippet children({ activeTab })}
                <!-- No content in header, just the switcher -->
            {/snippet}
        </Tabs>
    </div>

    <div class="vpb-controls">
        <!-- Window Controls (Min/Close) go here -->
    </div>
</div>

<style>
    .vpb-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 48px;
        padding: 0 var(--dp-space-3);
        border-bottom: 1px solid var(--dp-vpb-panel-border);
        background: var(--dp-vpb-surface-base);
        user-select: none;
    }

    .vpb-drag-handle {
        display: flex;
        align-items: center;
        gap: var(--dp-space-2);
        cursor: grab;
        color: var(--dp-vpb-text-secondary);
        font-family: var(--dp-font-mono);
        font-size: var(--dp-text-xs);
        font-weight: 700;
        opacity: 0.8;
    }

    .vpb-drag-handle:active {
        cursor: grabbing;
    }

    .vpb-tabs-container {
        flex: 1;
        display: flex;
        justify-content: center;
    }

    :global(.vpb-tabs-root .dp-tabs-list) {
        border-bottom: none !important; /* Override default tab border for header integration */
        padding-bottom: 0 !important;
    }
</style>
