<!--
  @file src/lib/sys/debug/vpb/components/inspector/ScanTooltip.svelte
  @layer lib
  @description Hover tooltip with Source Map integration.
  @since 1.0.0
-->
<script lang="ts">
import { scan } from "./state.svelte.js"; // Import local state

interface Props {
	rect: DOMRect; // Passed from Overlay
}

let { rect }: Props = $props();

const info = $derived(scan.elementInfo);

// Position logic
const tooltipBelow = $derived(rect.top < 80);
// Add 12px gap
const left = $derived(rect.left + rect.width / 2);
const top = $derived(tooltipBelow ? rect.bottom + 12 : rect.top - 12);
const transform = $derived(`translateX(-50%) translateY(${tooltipBelow ? "0" : "-100%"})`);
</script>

{#if info}
	<div
		class="vpb-tooltip"
		class:vpb-tooltip--below={tooltipBelow}
		style:left="{left}px"
		style:top="{top}px"
		style:transform
	>
		<!-- Tag & ID -->
		<div class="vpb-tooltip__header">
			<span class="vpb-tooltip__tag">&lt;{info.tagName}&gt;</span>
			{#if info.id}<span class="vpb-tooltip__id">#{info.id}</span>{/if}
		</div>

		<!-- Classes -->
		{#if info.classList.length > 0}
			<div class="vpb-tooltip__classes">
				{#each info.classList as cls}
					<span class="vpb-tooltip__class">.{cls}</span>
				{/each}
			</div>
		{/if}

		<!-- Source Map Info -->
		{#if info.sourceFile}
			<div class="vpb-tooltip__source">
				<span>{info.sourceFile}</span>
				{#if info.lineNumbers}
					<span>:{info.lineNumbers.start}</span>
				{/if}
			</div>
		{/if}

		<!-- Dimensions -->
		<div class="vpb-tooltip__dims">
			{Math.round(rect.width)} × {Math.round(rect.height)}
		</div>
	</div>
{/if}
