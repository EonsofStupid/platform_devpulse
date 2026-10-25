<!--
  @file src/lib/sys/debug/vpb/components/VPBPanel.svelte
  @layer lib
  @description Main VPB Shell Container.
  @since 1.0.0
-->
<script lang="ts">
    import { GlassPanel } from "$lib/design/components";
    import Header from "./Header.svelte";
    import Footer from "./Footer.svelte";
    import VPBIcon from "./VPBIcon.svelte";
    import { vpb } from "../state/vpb.svelte";
    import { scan } from "./inspector/state";

    // Inspector View
    import InspectorView from "./inspector/Inspector.svelte";
    // Builder View
    import BuilderView from "./builder/Builder.svelte";

    let {} = $props();

    // Positioning logic for Floating Mode
    const panelStyle = $derived.by(() => {
        if (vpb.mode === "floating") {
            return `
                position: fixed;
                left: ${vpb.position.x}px;
                top: ${vpb.position.y}px;
                width: var(--dp-vpb-panel-width);
                z-index: var(--dp-vpb-z-panel);
            `;
        }
        return `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: var(--dp-vpb-panel-width);
            z-index: var(--dp-vpb-z-panel);
        `;
    });
</script>

{#if vpb.isOpen}
    {#if vpb.mode === "minimized"}
        <VPBIcon />
    {:else}
        <div class="vpb-root" style={panelStyle}>
            <GlassPanel
                variant="void"
                glow={vpb.scanActive ? "teal" : undefined}
                class="vpb-shell"
                data-mode={vpb.mode}
                data-dragging={vpb.isDragging}
            >
                <!-- Header (Tabs + Drag) -->
                <Header />

                <!-- Main Domain Content -->
                <div class="vpb-content">
                    {#if vpb.domain === "inspector"}
                        <div class="vpb-view-inspector">
                            {#if scan.selectedElement}
                                <!-- Show detailed inspector view when element selected -->
                                <InspectorView />
                            {:else}
                                <div class="p-4 text-center">
                                    <p class="text-sm text-secondary">
                                        Inspector Mode
                                    </p>
                                    <p class="text-xs text-muted mt-2">
                                        Hover over elements to scan. Click to
                                        inspect.
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {:else if vpb.domain === "builder"}
                        <div class="vpb-view-builder">
                            <BuilderView />
                        </div>
                    {/if}
                </div>

                <!-- Footer (Status) -->
                <Footer />
            </GlassPanel>
        </div>
    {/if}
{/if}

<style>
    .vpb-content {
        min-height: 200px;
        max-height: 60vh;
        overflow-y: auto;
        background: var(--dp-vpb-surface-base);
    }

    :global(.vpb-shell) {
        display: flex;
        flex-direction: column;
        padding: 0 !important; /* Override GlassPanel default padding */
        overflow: hidden;
        transition: box-shadow 0.2s ease;
    }

    /* Dragging State */
    :global(.vpb-shell[data-dragging="true"]) {
        opacity: 0.9;
        transform: scale(1.02);
        cursor: grabbing;
    }
</style>
