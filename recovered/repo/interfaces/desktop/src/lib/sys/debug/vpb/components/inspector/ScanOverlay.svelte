<!--
  @file src/lib/sys/debug/vpb/components/inspector/ScanOverlay.svelte
  @layer lib
  @description Shadow DOM overlay for element scanning with Data-State architecture.
  @since 1.0.0
-->
<script lang="ts">
    import { vpb } from "../../state/vpb.svelte";
    import { scan } from "./state";
    import ScanTooltip from "./ScanTooltip.svelte";

    let overlayEl = $state<HTMLElement | null>(null);
    let highlightRect = $state<DOMRect | null>(null);

    function handleMouseMove(e: MouseEvent) {
        if (!vpb.scanActive || vpb.scanActive === false) return; // Strict boolean check needed?

        // Temporarily disable pointer events to detect underlying element
        if (overlayEl) overlayEl.style.pointerEvents = "none";

        const target = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement;

        if (overlayEl) overlayEl.style.pointerEvents = "auto";

        const isVpbInterface =
            target?.closest(".vpb-shell") ||
            target?.closest("[data-radix-popper-content-wrapper]") ||
            target?.closest(".vpb-tooltip");

        if (target && !isVpbInterface) {
            scan.setHovered(target);
            highlightRect = target.getBoundingClientRect();
        } else {
            scan.setHovered(null);
            highlightRect = null;
        }
    }

    function handleClick(e: MouseEvent) {
        if (!vpb.scanActive) return;

        if (overlayEl) overlayEl.style.pointerEvents = "none";
        const target = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement;
        if (overlayEl) overlayEl.style.pointerEvents = "auto";

        const isVpbInterface =
            target?.closest(".vpb-shell") || target?.closest(".vpb-tooltip");

        if (target && !isVpbInterface) {
            e.preventDefault();
            e.stopPropagation();

            // Capture click position for Inspector
            scan.clickPosition = { x: e.clientX, y: e.clientY };

            // Select the element in state (Inspector will react)
            scan.selectElement(target);

            // Auto-open Inspector Tab in Shell
            vpb.setDomain("inspector");
            if (vpb.mode === "minimized") vpb.mode = "docked";
        }
    }
</script>

<svelte:window
    onkeydown={(e) => {
        if (e.key === "Escape" && vpb.scanActive) {
            // vpb.stopScan(); // Add stopScan to vpb state if needed, or toggle
            vpb.scanActive = false;
        }
    }}
/>

{#if vpb.scanActive}
    <!-- Overlay Container: purely functional, no visual styles unless debugging -->
    <div
        class="vpb-overlay"
        data-state="active"
        bind:this={overlayEl}
        onmousemove={handleMouseMove}
        onclick={handleClick}
        role="presentation"
        aria-hidden="true"
    >
        <!-- Highlight Box (Gradient Border + Tint) -->
        {#if highlightRect && scan.hoveredElement}
            <div
                class="vpb-highlight"
                data-state="pulse"
                style="
                    left: {highlightRect.left}px;
                    top: {highlightRect.top}px;
                    width: {highlightRect.width}px;
                    height: {highlightRect.height}px;
                "
            >
                <!-- Tooltip follows highlight top-left -->
                <ScanTooltip
                    element={scan.hoveredElement!}
                    rect={highlightRect!}
                />
            </div>
        {/if}
    </div>
{/if}

<style>
    .vpb-overlay {
        position: fixed;
        inset: 0;
        z-index: var(--dp-vpb-z-overlay);
        pointer-events: auto; /* Catch events */
        cursor: crosshair;
        /* background: rgba(0,0,0,0.1); Optional debug tint */
    }

    .vpb-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid var(--dp-vpb-action-play);
        background: oklch(from var(--dp-vpb-action-play) l c h / 0.2);
        transition: all 0.1s ease-out;
        z-index: var(--dp-vpb-z-highlight);
        border-radius: 4px; /* Slight radius */
    }

    /* Data-State Modifier */
    .vpb-highlight[data-state="pulse"] {
        box-shadow: 0 0 0 4px oklch(from var(--dp-vpb-action-play) l c h / 0.1);
    }
</style>
