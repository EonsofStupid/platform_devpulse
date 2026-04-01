<!--
  @file HfModelCard — Single HuggingFace search result.
  Shows model info, GGUF files, download buttons.
  ALL styling via resolveMacro + cssVarString.
-->
<script lang="ts">
import {
	ArrowDown,
	ArrowUpDown,
	Brain,
	ChevronDown,
	ChevronUp,
	Download,
	Eye,
	Heart,
	Layers,
	Mic,
	Search,
	Volume2,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import type { HfFileInfo, HfSearchResult } from "../services/search.service.js";
import { formatBytes } from "../types/models.types.js";

interface Props {
	result: HfSearchResult;
	onDownload?: (repoId: string, filename: string) => void;
}

let { result, onDownload }: Props = $props();
let expanded = $state(false);

const m = $derived(resolveMacro({ kind: "hf-model-card", preset: "neutral" }));

/** Map pipeline tag to icon component and label. */
const capIcon = $derived.by(() => {
	switch (result.pipelineTag) {
		case "text-generation":
			return { icon: Brain, label: "Chat / Reasoning" };
		case "feature-extraction":
			return { icon: Layers, label: "Embedding" };
		case "text2text-generation":
			return { icon: Brain, label: "Text Generation" };
		case "image-text-to-text":
			return { icon: Eye, label: "Vision + Text" };
		case "automatic-speech-recognition":
			return { icon: Mic, label: "Speech to Text" };
		case "text-to-speech":
			return { icon: Volume2, label: "Text to Speech" };
		case "sentence-similarity":
			return { icon: Search, label: "Search / Similarity" };
		case "zero-shot-classification":
			return { icon: ArrowUpDown, label: "Classification" };
		default:
			return { icon: Brain, label: result.pipelineTag ?? "AI Model" };
	}
});

/** Format large numbers (1234567 → "1.2M"). */
function formatCount(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toString();
}

/** Check if a file fits in VRAM. */
function fileFits(file: HfFileInfo): "green" | "yellow" | "red" | "gray" {
	if (!hardwareState.hasGpu) return "gray";
	const estimateMb = (file.sizeBytes / (1024 * 1024)) * 1.15; // rough VRAM estimate
	const free = hardwareState.vramFreeMb;
	const total = hardwareState.vramTotalMb;
	if (estimateMb > free) return "red";
	if (((free - estimateMb) / total) * 100 < 20) return "yellow";
	return "green";
}

const fitColorMap: Record<string, string> = {
	green: "oklch(0.75 0.15 145)",
	yellow: "oklch(0.8 0.15 85)",
	red: "oklch(0.65 0.2 25)",
	gray: "oklch(0.6 0 0)",
};
</script>

<div
	style={cssVarString(m.cssVars)}
	class="rounded-lg border border-[var(--border-subtle)] p-3 transition-colors hover:brightness-105"
>
	<!-- Header -->
	<div class={hstack({ justify: "between", align: "start" })}>
		<div class={stack({ gap: "1" })}>
			{#snippet headerIcon()}
				{@const Icon = capIcon.icon}
				<Icon size={16} style="color: var(--color);" />
			{/snippet}
			<div class={hstack({ gap: "2", align: "center" })}>
				{@render headerIcon()}
				<Text size="sm" weight="bold" color="primary">{result.modelName}</Text>
			</div>
			<Text size="xs" color="muted">{result.author}</Text>
		</div>

		<div class={hstack({ gap: "3", align: "center" })}>
			<div class={hstack({ gap: "1", align: "center" })} title="Downloads">
				<ArrowDown size={12} class="opacity-50" />
				<Text size="xs" color="muted">{formatCount(result.downloads)}</Text>
			</div>
			<div class={hstack({ gap: "1", align: "center" })} title="Likes">
				<Heart size={12} class="opacity-50" />
				<Text size="xs" color="muted">{formatCount(result.likes)}</Text>
			</div>
		</div>
	</div>

	<!-- Tags -->
	<div class="mt-2 flex flex-wrap gap-1">
		<Badge variant="neutral" size="sm">{capIcon.label}</Badge>
		{#each result.tags.slice(0, 3) as tag (tag)}
			<Badge variant="neutral" size="sm">{tag}</Badge>
		{/each}
	</div>

	<!-- GGUF files toggle -->
	<button
		class="mt-2 flex w-full items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
		onclick={() => (expanded = !expanded)}
	>
		{#if expanded}
			<ChevronUp size={14} />
		{:else}
			<ChevronDown size={14} />
		{/if}
		<Text size="xs" color="muted">{result.ggufFiles.length} GGUF file{result.ggufFiles.length !== 1 ? "s" : ""}</Text>
	</button>

	<!-- Expanded file list -->
	{#if expanded}
		<div class={stack({ gap: "1" })} style="margin-top: 0.5rem;">
			{#each result.ggufFiles as file (file.filename)}
				{@const fit = fileFits(file)}
				<div class="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:brightness-110 transition-colors"
					style="background: oklch(0.2 0.01 270 / 0.3);"
				>
					<div class="h-2 w-2 shrink-0 rounded-full" style="background: {fitColorMap[fit]};"></div>
					<div class="flex-1 min-w-0">
						<div class="truncate font-medium">{file.filename}</div>
						<div class="flex gap-2 opacity-60">
							<span>{formatBytes(file.sizeBytes)}</span>
							{#if file.quantLevel}
								<span>{file.quantLevel}</span>
							{/if}
							<span class="ml-auto">
								{fit === "green" ? "Easy fit" : fit === "yellow" ? "Tight fit" : fit === "red" ? "Won't fit" : "CPU mode"}
							</span>
						</div>
					</div>
					<button
						class="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:brightness-125"
						style="background: oklch(0.45 0.12 170 / 0.4); color: oklch(0.85 0.1 170);"
						onclick={() => onDownload?.(result.repoId, file.filename)}
					>
						<Download size={12} />
						Get
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
