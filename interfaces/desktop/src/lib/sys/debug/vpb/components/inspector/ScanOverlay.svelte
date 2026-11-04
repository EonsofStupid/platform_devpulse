<!--
  @file src/lib/sys/debug/vpb/components/inspector/ScanOverlay.svelte
  @layer lib
  @description Overlay for element scanning with Data-State architecture.
  @since 1.0.0
-->
<script lang="ts">
import { untrack } from "svelte";
import { vpb } from "../../state/vpb.svelte.js";
import ScanTooltip from "./ScanTooltip.svelte";
import { scan } from "./state.svelte.js";

let overlayEl = $state<HTMLElement | null>(null);
let highlightRect = $state<DOMRect | null>(null);

const scanning = $derived(vpb.scanActive && !vpb.scanPaused);

// A stopped or paused scan leaves nothing highlighted.
$effect(() => {
	if (scanning) return;
	highlightRect = null;
	untrack(() => scan.setHovered(null));
});

/** The app's element under the pointer, looking through this overlay. */
function elementUnderPointer(e: MouseEvent): Element | null {
	// Temporarily disable pointer events to detect underlying element
	if (overlayEl) overlayEl.style.pointerEvents = "none";
	const target = document.elementFromPoint(e.clientX, e.clientY);
	if (overlayEl) overlayEl.style.pointerEvents = "auto";

	// The VPB's own surfaces are not what you are scanning.
	return target && !target.closest('[data-kind="vpb"], .vpb-shell') ? target : null;
}

function handleMouseMove(e: MouseEvent) {
	if (!scanning) return;

	const target = elementUnderPointer(e);
	scan.setHovered(target);
	highlightRect = target ? target.getBoundingClientRect() : null;
}

function handleClick(e: MouseEvent) {
	if (!scanning) return;

	const target = elementUnderPointer(e);
	if (!target) return;

	e.preventDefault();
	e.stopPropagation();

	// Capture click position for Inspector
	scan.clickPosition = { x: e.clientX, y: e.clientY };

	// Select the element in state (Inspector will react)
	scan.selectElement(target);

	// Auto-open Inspector Tab in Shell
	vpb.setTab("inspector");
	if (vpb.mode === "minimized") vpb.dock();
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape" && vpb.scanActive) {
		vpb.stopScan();
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if scanning}
	<!-- Overlay Container: purely functional, the highlight is its only visual -->
	<div
		class="vpb-overlay vpb-overlay--active"
		data-kind="vpb"
		data-slot="overlay"
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
				class="vpb-highlight vpb-highlight--pulse"
				data-state="pulse"
				style:left="{highlightRect.left}px"
				style:top="{highlightRect.top}px"
				style:width="{highlightRect.width}px"
				style:height="{highlightRect.height}px"
			></div>
			<!-- Tooltip follows highlight top-left -->
			<ScanTooltip rect={highlightRect} />
		{/if}
	</div>
{/if}
