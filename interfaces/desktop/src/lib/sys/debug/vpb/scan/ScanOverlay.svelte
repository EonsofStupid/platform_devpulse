<!--
  @file src/lib/sys/debug/vpb/scan/ScanOverlay.svelte
  @name ScanOverlay.svelte
  @module @devpulse/sys/debug/vpb/scan/ScanOverlay
  @layer lib

  @description
  Shadow DOM overlay for element scanning.
  Handles visual highlighting and click capture.
  No toasts - silent selection that updates scan state.

  @dependencies
  - scan.state.ts
  - vpb.state.ts
  - ScanTooltip.svelte
  - vpb-overlay.css
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import { scan } from "../state/scan.svelte";
    import ScanTooltip from "./ScanTooltip.svelte";

    let overlayEl = $state<HTMLElement | null>(null);
    let highlightRect = $state<DOMRect | null>(null);

    function handleMouseMove(e: MouseEvent) {
        if (!vpb.scanActive || vpb.scanPaused) return;

        // Temporarily disable pointer events to detect underlying element
        if (overlayEl) overlayEl.style.pointerEvents = "none";

        const target = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement;

        if (overlayEl) overlayEl.style.pointerEvents = "auto";

        const isVpbInterface =
            target?.closest(".vpb-panel") ||
            target?.closest(".vpb-overlay") ||
            target?.closest("[data-radix-popper-content-wrapper]") ||
            target?.closest(".vpb-fab");

        if (target && !isVpbInterface) {
            scan.setHovered(target);
            highlightRect = target.getBoundingClientRect();
        } else {
            scan.setHovered(null);
            highlightRect = null;
        }
    }

    function handleClick(e: MouseEvent) {
        if (!vpb.scanActive || vpb.scanPaused) return;

        if (overlayEl) overlayEl.style.pointerEvents = "none";
        const target = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement;
        if (overlayEl) overlayEl.style.pointerEvents = "auto";

        const isVpbInterface =
            target?.closest(".vpb-panel") ||
            target?.closest(".vpb-overlay") ||
            target?.closest("[data-radix-popper-content-wrapper]") ||
            target?.closest(".vpb-fab");

        if (target && !isVpbInterface) {
            e.preventDefault();
            e.stopPropagation();

            // Capture click position for Inspector
            scan.clickPosition = { x: e.clientX, y: e.clientY };

            // Select the element in state (Inspector will react)
            scan.selectElement(target);

            // Note: No toast here. Status is shown in Panel Footer.
        }
    }
</script>

<svelte:window
    onkeydown={(e) => {
        if (e.key === "Escape" && vpb.scanActive) {
            vpb.stopScan();
        }
    }}
/>

{#if vpb.scanActive && !vpb.scanPaused}
    <!-- Overlay Container -->
    <div
        class="vpb-overlay vpb-overlay--active"
        bind:this={overlayEl}
        onmousemove={handleMouseMove}
        onclick={handleClick}
        role="presentation"
        aria-hidden="true"
    >
        <!-- Highlight Box (Gradient Border + Tint) -->
        {#if highlightRect && scan.hoveredElement}
            <div
                class="vpb-highlight vpb-highlight--pulse"
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
