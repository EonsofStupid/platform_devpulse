<!--
  VPBPanel.svelte
  Main VPB panel container - uses recipes from lib/design/vpb-*.css
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import VPBToolbar from "./VPBToolbar.svelte";
    import VPBTabs from "./VPBTabs.svelte";
    import VPBIcon from "./VPBIcon.svelte";

    // Drag state for floating mode
    let isDragging = $state(false);
    let dragOffset = $state({ x: 0, y: 0 });

    function onDragStart(e: MouseEvent) {
        if (vpb.mode !== "floating") return;
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

    // Computed styles for floating position
    const floatStyles = $derived(
        vpb.mode === "floating"
            ? `left: ${vpb.position.x}px; top: ${vpb.position.y}px;`
            : "",
    );
</script>

<svelte:window onmousemove={onDragMove} onmouseup={onDragEnd} />

{#if vpb.mode === "minimized"}
    <VPBIcon />
{:else}
    <div
        class="vpb-panel vpb-panel--{vpb.mode}"
        style={floatStyles}
        role="region"
        aria-label="Visual Page Builder"
    >
        {#if vpb.mode === "floating"}
            <div
                class="vpb-panel__drag-handle"
                onmousedown={onDragStart}
                role="presentation"
            >
                <span class="vpb-panel__drag-dots">⋮⋮</span>
            </div>
        {/if}

        <header class="vpb-panel__header">
            <VPBTabs />
        </header>

        <div class="vpb-panel__toolbar">
            <VPBToolbar />
        </div>

        <div class="vpb-panel__content">
            {#if vpb.scanActive && !vpb.scanPaused}
                <p class="vpb-status vpb-status--active">
                    Scanning active - hover over elements
                </p>
            {:else if vpb.scanPaused}
                <p class="vpb-status vpb-status--paused">
                    Scan paused - click play to resume
                </p>
            {:else}
                <p class="vpb-status">Press play to start scanning</p>
            {/if}
        </div>
    </div>
{/if}
