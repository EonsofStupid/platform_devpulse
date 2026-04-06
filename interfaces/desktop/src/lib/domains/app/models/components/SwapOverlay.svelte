<!--
  @file SwapOverlay — Full-screen block during model load/unload.
  Prevents user interaction while weights are being swapped in memory.
  ColdLight glass card, lucide icons, multi-step progress, retry on failure.
-->
<script lang="ts">
import { AlertTriangle, CheckCircle, LoaderCircle } from "lucide-svelte";
import { Card } from "$lib/design/components/card/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { swapState } from "../runes/swap.runes.svelte.js";
import { friendlySlotLabel } from "../types/models.types.js";

const cardM = $derived(renderForge({ kind: "card", preset: "glass" }));

const slotLabel = $derived(swapState.slotId ? friendlySlotLabel(swapState.slotId) : "model");

const headline = $derived.by(() => {
	if (swapState.error) return "Load Failed";
	if (swapState.operation === "unload") return `Releasing ${slotLabel}`;
	return `Loading ${slotLabel}`;
});

const STAGES = ["Verifying", "Allocating", "Loading Weights", "Tokenizer", "Warming Up"] as const;

function stageToLabel(stage: string | null): string {
	if (!stage) return "";
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
	return labels[stage] ?? stage;
}

const currentStageIdx = $derived.by(() => {
	if (!swapState.stage) return -1;
	const map: Record<string, number> = {
		Verifying: 0,
		Allocating: 1,
		LoadingWeights: 2,
		LoadingTokenizer: 3,
		WarmingUp: 4,
		Ready: 4,
	};
	return map[swapState.stage] ?? -1;
});

const isVramError = $derived(swapState.error?.toLowerCase().match(/vram|memory|out of/) != null);

function handleRetry(): void {
	const slotId = swapState.slotId;
	swapState.dismiss();
	if (slotId) modelsState.load(slotId);
}

function handleDismiss(): void {
	swapState.dismiss();
}
</script>

{#if swapState.active}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		style="background: var(--glass-void); backdrop-filter: blur(8px);"
		role="alertdialog"
		aria-modal="true"
		aria-label={headline}
	>
		<div
			{...cardM.dataAttrs}
			style={cssVarString(cardM.cssVars)}
			class="flex flex-col items-center gap-6 max-w-lg w-full mx-4 p-8 rounded-xl text-center"
		>
			{#if swapState.error}
				<!-- Error state -->
				<div style="color: var(--signal-error);">
					<AlertTriangle size={40} />
				</div>
				<Text size="lg" weight="bold" color="primary">{headline}</Text>
				<Text size="sm" color="muted">{swapState.error}</Text>

				<div class="flex gap-3 mt-2">
					<button
						class="rounded-lg px-5 py-2 text-sm font-bold transition-colors"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={handleRetry}
						aria-label="Retry loading model"
					>
						Retry
					</button>
					{#if isVramError}
						<button
							class="rounded-lg px-5 py-2 text-sm transition-colors border"
							style="border-color: var(--border-subtle); color: var(--text-secondary);"
							aria-label="Try loading with CPU instead"
						>
							Try CPU Mode
						</button>
					{/if}
					<button
						class="rounded-lg px-5 py-2 text-sm transition-colors"
						style="color: var(--text-muted);"
						onclick={handleDismiss}
						aria-label="Dismiss error"
					>
						Dismiss
					</button>
				</div>
			{:else}
				<!-- Loading state -->
				<div style="color: var(--accent-teal-main);">
					<LoaderCircle size={40} class="animate-spin" />
				</div>
				<Text size="lg" weight="bold" color="primary">{headline}</Text>
				<Text size="sm" color="muted">{stageToLabel(swapState.stage)}</Text>

				<!-- Multi-step stage indicator -->
				<div class="flex gap-2 items-center justify-center flex-wrap">
					{#each STAGES as stage, i (stage)}
						<div class="flex items-center gap-1.5">
							<div
								class="w-3 h-3 rounded-full transition-colors"
								style="background: {i < currentStageIdx ? 'var(--signal-success)' : i === currentStageIdx ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
							></div>
							<Text
								size="sm"
								color={i === currentStageIdx ? "primary" : "muted"}
								weight={i === currentStageIdx ? "bold" : "normal"}
							>
								{stage}
							</Text>
						</div>
						{#if i < STAGES.length - 1}
							<div class="w-4 h-px" style="background: var(--border-subtle);"></div>
						{/if}
					{/each}
				</div>

				<!-- Progress bar -->
				<div class="w-full">
					<Progress value={swapState.progress} max={100} size="lg" />
				</div>

				<Text size="sm" color="muted">
					Do not close the app while this is in progress
				</Text>
			{/if}
		</div>
	</div>
{/if}
