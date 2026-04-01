<!--
  @file SwapOverlay — Full-screen block during model load/unload.
  Prevents user interaction while weights are being swapped in memory.
  Only renders when swapState.active is true.
-->
<script lang="ts">
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import { swapState } from "../runes/swap.runes.svelte.js";
import { friendlySlotLabel } from "../types/models.types.js";

const m = $derived(
	resolveMacro({
		kind: "swap-overlay",
		preset: swapState.error ? "danger" : "info",
	}),
);

const slotLabel = $derived(swapState.slotId ? friendlySlotLabel(swapState.slotId) : "model");

const headline = $derived.by(() => {
	if (swapState.error) return "Something went wrong";
	if (swapState.operation === "unload") return `Releasing ${slotLabel}`;
	return `Loading ${slotLabel}`;
});

const stageLabel = $derived.by(() => {
	if (!swapState.stage) return "";
	const labels: Record<string, string> = {
		Preparing: "Getting ready...",
		Verifying: "Checking model file...",
		Allocating: "Reserving memory...",
		LoadingWeights: "Loading AI model...",
		LoadingTokenizer: "Setting up vocabulary...",
		WarmingUp: "Warming up...",
		Ready: "Almost there...",
		"Releasing memory": "Freeing memory...",
	};
	return labels[swapState.stage] ?? swapState.stage;
});

function handleDismiss(): void {
	swapState.dismiss();
}
</script>

{#if swapState.active}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		style={cssVarString(m.cssVars)}
		data-kind={m.kind}
		role="alertdialog"
		aria-modal="true"
		aria-label={headline}
	>
		<div class="flex flex-col items-center gap-6 max-w-md px-8 py-12 text-center">
			{#if swapState.error}
				<!-- Error state: show message + dismiss button -->
				<div class="text-5xl">⚠️</div>
				<h2 class="text-xl font-semibold text-red-400">{headline}</h2>
				<p class="text-sm text-neutral-300">{swapState.error}</p>
				<button
					class="mt-4 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
					onclick={handleDismiss}
				>
					Got it
				</button>
			{:else}
				<!-- Loading state: show progress -->
				<div class="text-5xl animate-pulse">🧠</div>
				<h2 class="text-xl font-semibold text-teal-300">{headline}</h2>
				<p class="text-sm text-neutral-400">{stageLabel}</p>

				<!-- Progress bar -->
				<div class="w-full h-2 rounded-full bg-neutral-700 overflow-hidden">
					<div
						class="h-full rounded-full bg-teal-500 transition-all duration-300"
						style="width: {swapState.progress}%"
					></div>
				</div>

				<p class="text-xs text-neutral-500">
					Do not close the app while this is in progress
				</p>
			{/if}
		</div>
	</div>
{/if}
