<!--
  @file MemoryCard — "How much Clyffy remembers" card for the consumer model loader.
  Knowledge retrieval pipeline shown as unified "memory" system. Depth slider. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Brain, Download, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { memoryCardState } from "../../data-access/memory-card.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";
import {
	formatEta,
	formatMb,
	formatSpeed,
	statusLabel,
	statusToTone,
} from "../../util/models.types.js";
import ModelPicker from "./ModelPicker.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();
const memoryState = memoryCardState;
const cardM = $derived(renderForge({ kind: "memory-card", preset: "glass-elevated" }));

$effect(() => {
	void memoryState.ensureCatalogLoaded();
});
</script>

<div
	{...cardM.dataAttrs}
	style="{cssVarString(cardM.cssVars)} border-left: 3px solid var(--accent-blue-main); box-shadow: 0 0 0 1px var(--accent-blue-fill);"
	class="rounded-xl p-5 transition-all"
	data-component="memory-card"
	data-role="memory"
	title="Memory lets Clyffy remember your code, docs, and project context — the more memory, the better Clyffy understands your project"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Brain size={18} style="color: var(--accent-teal-main);" />
					<Text size="base" weight="bold" color="primary">Memory</Text>
				</div>
				<Text size="xs" color="muted">How much Clyffy remembers about your project</Text>
			</div>
			<Badge
				variant={memoryState.memoryReady ? "positive" : "neutral"}
				size="sm"
				title={memoryState.memoryReady
					? "Memory is active — Clyffy can search and remember your project files"
					: memoryState.bothInstalled
						? "Memory models are downloaded — ready to activate"
						: "Two small models need to be installed for Clyffy to remember your project"}
			>
				{memoryState.memoryReady ? "Active" : memoryState.bothInstalled ? "Ready" : "Setup needed"}
			</Badge>
		</div>

		<!-- Memory depth slider -->
		<div class={stack({ gap: "1" })} title="Controls how many pieces of your project Clyffy searches through when answering questions — higher means more thorough but slower">
			<div class={hstack({ justify: "between", align: "center" })}>
				<Text size="sm" color="secondary">Memory depth</Text>
				<Text size="xs" color="muted">{memoryState.depthLabel}</Text>
			</div>
			<input
				type="range"
				min="1"
				max="10"
				bind:value={memoryState.memoryDepth}
				class="w-full accent-teal-500"
			/>
		</div>

		<!-- Model pickers for embedder + reranker -->
		<div class={stack({ gap: "2" })}>
			<div>
				<Text size="xs" color="muted">Search engine model:</Text>
				<ModelPicker
					models={memoryState.embedModels}
					selectedModelId={memoryState.selectedModelId(memoryState.embedderSlotId)}
					committedModelId={memoryState.committedModelId(memoryState.embedderSlotId)}
					pendingModelId={memoryState.pendingModelId(memoryState.embedderSlotId)}
					onSelect={(modelId) => memoryState.selectModel(memoryState.embedderSlotId, modelId)}
				/>
				{#if memoryState.embedTransitioning && memoryState.embedModelStatus}
					<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
						<Spinner size="xs" tone={statusToTone(memoryState.embedModelStatus)} />
						<Text size="xs" color="muted">{statusLabel(memoryState.embedModelStatus)}</Text>
					</div>
				{/if}
			</div>
			<div>
				<Text size="xs" color="muted">Relevance scorer model:</Text>
				<ModelPicker
					models={memoryState.rerankModels}
					selectedModelId={memoryState.selectedModelId(memoryState.rerankerSlotId)}
					committedModelId={memoryState.committedModelId(memoryState.rerankerSlotId)}
					pendingModelId={memoryState.pendingModelId(memoryState.rerankerSlotId)}
					onSelect={(modelId) => memoryState.selectModel(memoryState.rerankerSlotId, modelId)}
				/>
				{#if memoryState.rerankTransitioning && memoryState.rerankModelStatus}
					<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
						<Spinner size="xs" tone={statusToTone(memoryState.rerankModelStatus)} />
						<Text size="xs" color="muted">{statusLabel(memoryState.rerankModelStatus)}</Text>
					</div>
				{/if}
			</div>
		</div>

		<!-- Install status -->
		{#if !memoryState.bothInstalled}
			<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
				<Text size="sm" color="secondary">
					Clyffy needs two small models to remember your code and docs.
				</Text>
				<div class="mt-2 flex gap-2">
					{#if memoryState.embedStatus === "not_downloaded" && memoryState.rerankStatus === "not_downloaded"}
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => memoryState.handleDownloadAll()}
							title="Download both memory models — a search engine and a relevance scorer. They work together to help Clyffy find the right code and docs."
						>
							<Download size={14} />
							Install both ({formatMb(memoryState.embedSizeMb + memoryState.rerankSizeMb)})
						</button>
					{:else}
						{#if memoryState.embedStatus === "not_downloaded"}
							{#if memoryState.downloadingEmbed}
								<div class={hstack({ gap: "1", align: "center" })}>
									<Spinner size="xs" tone="accent" />
									<Text size="xs" color="muted">Search {memoryState.embedPct}%</Text>
									{#if memoryState.embedSpeedBps > 0}
										<Text size="xs" color="muted">{formatSpeed(memoryState.embedSpeedBps)}</Text>
									{/if}
									{#if memoryState.embedEtaSecs >= 0}
										<Text size="xs" color="muted">{formatEta(memoryState.embedEtaSecs)}</Text>
									{/if}
									<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={() => memoryState.handleCancelEmbed()} title="Cancel" aria-label="Cancel embedder download">
										<X size={10} />
									</button>
								</div>
							{:else}
								<button
									class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
									style="background: var(--accent-teal-main); color: var(--surface-base);"
									onclick={() => memoryState.handleDownloadEmbed()}
								>
									<Download size={10} />
									Search ({formatMb(memoryState.embedSizeMb)})
								</button>
							{/if}
						{/if}
						{#if memoryState.rerankStatus === "not_downloaded"}
							{#if memoryState.downloadingRerank}
								<div class={hstack({ gap: "1", align: "center" })}>
									<Spinner size="xs" tone="accent" />
									<Text size="xs" color="muted">Ranking {memoryState.rerankPct}%</Text>
									{#if memoryState.rerankSpeedBps > 0}
										<Text size="xs" color="muted">{formatSpeed(memoryState.rerankSpeedBps)}</Text>
									{/if}
									{#if memoryState.rerankEtaSecs >= 0}
										<Text size="xs" color="muted">{formatEta(memoryState.rerankEtaSecs)}</Text>
									{/if}
									<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={() => memoryState.handleCancelRerank()} title="Cancel" aria-label="Cancel reranker download">
										<X size={10} />
									</button>
								</div>
							{:else}
								<button
									class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
									style="background: var(--accent-teal-main); color: var(--surface-base);"
									onclick={() => memoryState.handleDownloadRerank()}
								>
									<Download size={10} />
									Ranking ({formatMb(memoryState.rerankSizeMb)})
								</button>
							{/if}
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Advanced view -->
		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					Embedder: {memoryState.embedderSlotId} ({memoryState.embedStatus}) |
					Reranker: {memoryState.rerankerSlotId} ({memoryState.rerankStatus}) |
					top-k: {memoryState.memoryDepth}
				</Text>
			</div>
		{/if}

		<!-- Clyffy narration -->
		{#each [narrationState.forSlot(memoryState.embedderSlotId), narrationState.forSlot(memoryState.rerankerSlotId)] as msg}
			{#if msg}
				<div
					class="rounded-lg border-l-2 px-3 py-2 text-xs"
					style="background: oklch(0.15 0.02 185 / 0.3); border-color: var(--accent-teal-main); color: var(--text-secondary);"
				>
					{msg.text}
				</div>
			{/if}
		{/each}

		<!-- Error -->
		{#if memoryState.error}
			<Text size="xs" color="negative">{memoryState.error}</Text>
		{/if}
	</div>
</div>
