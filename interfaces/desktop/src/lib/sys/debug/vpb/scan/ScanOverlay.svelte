<!--
  ScanOverlay.svelte
  Shadow DOM overlay for element scanning - uses recipes from lib/design/vpb-overlay.css
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import { scan } from "../state/scan.svelte";
    import ScanTooltip from "./ScanTooltip.svelte";
    import { toast } from "svelte-sonner";

    let overlayEl = $state<HTMLElement | null>(null);
    let highlightRect = $state<DOMRect | null>(null);

    function handleMouseMove(e: MouseEvent) {
        if (!vpb.scanActive || vpb.scanPaused) return;

        // Temporarily disable overlay to detect underlying element
        if (overlayEl) {
            overlayEl.style.pointerEvents = "none";
        }

        const target = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement;

        // Re-enable overlay
        if (overlayEl) {
            overlayEl.style.pointerEvents = "auto";
        }

        if (
            target &&
            !target.closest(".vpb-overlay") &&
            !target.closest(".vpb-panel") &&
            !target.closest(".vpb-tooltip")
        ) {
            scan.setHovered(target);
            highlightRect = target.getBoundingClientRect();
        } else {
            scan.setHovered(null);
            highlightRect = null;
        }
    }

    function handleClick(e: MouseEvent) {
        if (!vpb.scanActive || vpb.scanPaused) return;

        // Get element at click point
        if (overlayEl) {
            overlayEl.style.pointerEvents = "none";
        }

        const target = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement;

        if (overlayEl) {
            overlayEl.style.pointerEvents = "auto";
        }

        if (
            target &&
            !target.closest(".vpb-overlay") &&
            !target.closest(".vpb-panel") &&
            !target.closest(".vpb-inspector") &&
            !target.closest(".vpb-tooltip")
        ) {
            e.preventDefault();
            e.stopPropagation();
            scan.selectElement(target);
            toast.success(`Selected: <${target.tagName.toLowerCase()}>`);
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            vpb.stopScan();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if vpb.scanActive && !vpb.scanPaused}
    <div
        class="vpb-overlay vpb-overlay--active"
        bind:this={overlayEl}
        onmousemove={handleMouseMove}
        onclick={handleClick}
        role="presentation"
    >
        <!-- Highlight box over hovered element -->
        {#if highlightRect && scan.hoveredElement}
            <div
                class="vpb-highlight vpb-highlight--pulse"
                style="
          left: {highlightRect.left}px;
          top: {highlightRect.top}px;
          width: {highlightRect.width}px;
          height: {highlightRect.height}px;
        "
            ></div>

            <!-- Tooltip -->
            <ScanTooltip element={scan.hoveredElement!} rect={highlightRect!} />
        {/if}
    </div>
{/if}
