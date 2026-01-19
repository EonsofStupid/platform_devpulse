<!--
  @file src/lib/sys/debug/vpb/components/VPBPanel.svelte
  @name VPBPanel.svelte
  @module @devpulse/sys/debug/vpb/components/VPBPanel
  @layer lib

  @description
  Main VPB Panel shell using Bits UI Primitives.
  Wraps content in Tabs (Inspect / VPB).
  
  @features
  - Protruding Tabs (via vpb-grid.css)
  - Draggable Header
  - Reactive Tab Switching (Selection -> Inspect)
  - Inline Status Footer

  @dependencies
  - bits-ui (Tabs)
  - vpb-grid.css
  - components/VPBTabs, VPBToolbar, VPBInspector, VPBIcon
  - state/vpb, state/scan
-->
<script lang="ts">
    import { Tabs } from "bits-ui";
    import { vpb } from "../state/vpb.svelte";
    import { scan } from "../state/scan.svelte";
    import VPBToolbar from "./VPBToolbar.svelte";
    import VPBTabs from "./VPBTabs.svelte";
    import VPBIcon from "./VPBIcon.svelte";
    import VPBInspector from "./VPBInspector.svelte";

    // Tab State
    let activeTab = $state("inspect");

    // Auto-switch to inspector when element selected
    $effect(() => {
        if (scan.selectedElement) {
            activeTab = "inspect";
            if (vpb.mode === "minimized") {
                vpb.dock(); // Auto-restore to docked if minimized
            }
        }
    });

    // Drag Logic
    let isDragging = $state(false);
    let dragOffset = $state({ x: 0, y: 0 });

    function onDragStart(e: MouseEvent) {
        // If docked, dragging automatically floats it at current visual position
        if (vpb.mode === "docked") {
            const rect = (e.target as HTMLElement)
                .closest(".vpb-shell")!
                .getBoundingClientRect();
            vpb.setPosition(rect.left, rect.top);
            vpb.float();
        }

        isDragging = true;
        dragOffset = {
            x: e.clientX - vpb.position.x,
            y: e.clientY - vpb.position.y,
        };
    }

    function onDragMove(e: MouseEvent) {
        if (!isDragging) return;
        vpb.setPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    }

    function onDragEnd() {
        isDragging = false;
    }

    // Only apply inline styles when floating. Docked state relies on CSS Grid/Positioning.
    const floatStyles = $derived(
        vpb.mode === "floating"
            ? `left: ${vpb.position.x}px; top: ${vpb.position.y}px; transform: none; margin: 0; right: auto; bottom: auto;`
            : "",
    );
</script>

<svelte:window onmousemove={onDragMove} onmouseup={onDragEnd} />

{#if vpb.mode === "minimized"}
    <VPBIcon />
{:else}
    <!-- Bind value to activeTab for programmatic switching -->
    <Tabs.Root bind:value={activeTab} class="vpb-root">
        <!-- SHELL: The Grid Container -->
        <div
            class="vpb-shell"
            data-mode={vpb.mode}
            style={floatStyles}
            role="region"
            aria-label="Visual Page Builder"
        >
            <!-- ROW 1: TABS (Draggable) -->
            <div
                class="vpb-shell__tabs"
                onmousedown={onDragStart}
                role="presentation"
                aria-label="Drag panel"
            >
                <VPBTabs />
            </div>

            <!-- ROW 2: BODY (Glass Content) -->
            <div class="vpb-shell__body">
                <!-- TOOLBAR -->
                <div class="vpb-panel__toolbar">
                    <VPBToolbar />
                </div>

                <!-- CONTENT AREAS -->
                <div class="vpb-panel__content">
                    <Tabs.Content value="vpb">
                        <div
                            style="padding: 12px; color: var(--dp-vpb-text-secondary); text-align: center;"
                        >
                            <span
                                style="font-size: 24px; display: block; margin-bottom: 8px;"
                                >🏗️</span
                            >
                            <h3>Visual Builder</h3>
                            <p style="font-size: 12px; opacity: 0.7;">
                                No-code compiler interface (Coming Soon)
                            </p>
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="inspect">
                        <div
                            style="padding: 12px; color: var(--dp-vpb-text-muted); font-size: 12px;"
                        >
                            <p>Click elements to inspect.</p>
                            <p>Inspector opens as a separate window.</p>
                        </div>
                    </Tabs.Content>
                </div>

                <!-- FOOTER -->
                <div class="vpb-panel__footer">
                    {#if scan.selectedElement && scan.elementInfo}
                        <p class="vpb-status vpb-status--active">
                            Selected: <span
                                style="font-family: monospace; color: var(--dp-vpb-cyber-gradient);"
                                >&lt;{scan.elementInfo.tagName}&gt;</span
                            >
                        </p>
                    {:else if vpb.scanActive && !vpb.scanPaused}
                        <p class="vpb-status vpb-status--active">
                            Targeting elements...
                        </p>
                    {:else if vpb.scanPaused}
                        <p class="vpb-status vpb-status--paused">Scan paused</p>
                    {:else}
                        <p class="vpb-status">Ready</p>
                    {/if}
                    <span
                        style="font-size: 10px; color: var(--dp-vpb-text-muted);"
                        >v1.0</span
                    >
                </div>
            </div>
        </div>
    </Tabs.Root>
{/if}
