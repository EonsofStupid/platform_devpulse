<!--
  @file ModelSearch — HuggingFace model search with results.
  Inline search panel toggled from ModelLoaderPanel.
  ALL styling via renderForge + cssVarString.
-->
<script lang="ts">
import { LoaderCircle, Search, X } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { searchState } from "../runes/search.runes.svelte.js";
import HfModelCard from "./HfModelCard.svelte";

interface Props {
	onDownload?: (repoId: string, filename: string) => void;
	onClose?: () => void;
}

let { onDownload, onClose }: Props = $props();

const m = $derived(renderForge({ kind: "model-search", preset: "neutral" }));

function handleInput(e: Event) {
	const target = e.target as HTMLInputElement;
	searchState.setQuery(target.value);
}

function handleClear() {
	searchState.clear();
}
</script>

<div
	style={cssVarString(m.cssVars)}
	class={stack({ gap: "3" })}
>
	<!-- Search header -->
	<div class={hstack({ justify: "between", align: "center" })}>
		<Text size="sm" weight="bold" color="primary">Search HuggingFace</Text>
		{#if onClose}
			<button
				class="rounded p-1 opacity-50 hover:opacity-100 transition-opacity"
				onclick={onClose}
			>
				<X size={16} />
			</button>
		{/if}
	</div>

	<!-- Search input -->
	<div class="relative">
		<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
		<input
			type="text"
			value={searchState.query}
			oninput={handleInput}
			placeholder="Search for AI models (e.g. Qwen, Llama, Mistral...)"
			class="w-full rounded-lg border border-[var(--border-subtle)] py-2.5 pl-9 pr-9 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color)]"
			style="background: oklch(0.15 0.01 270 / 0.5); color: var(--color);"
		/>
		{#if searchState.query}
			<button
				class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
				onclick={handleClear}
			>
				<X size={14} />
			</button>
		{/if}
	</div>

	<!-- Results -->
	{#if searchState.searching}
		<div class="flex items-center justify-center gap-2 py-6">
			<LoaderCircle size={18} class="animate-spin opacity-50" />
			<Text size="sm" color="muted">Searching HuggingFace...</Text>
		</div>
	{:else if searchState.error}
		<div class="rounded-lg border-l-4 border-red-500/50 px-3 py-2">
			<Text size="xs" weight="bold" color="primary">Search Error</Text>
			<Text size="xs" color="muted">{searchState.error}</Text>
		</div>
	{:else if searchState.results.length > 0}
		<div class={`${stack({ gap: "2" })} max-h-96 overflow-y-auto`}>
			{#each searchState.results as result (result.repoId)}
				<HfModelCard {result} {onDownload} />
			{/each}
		</div>
	{:else if searchState.query.trim()}
		<div class="flex flex-col items-center gap-2 py-6 opacity-50">
			<Search size={24} />
			<Text size="sm" color="muted">No GGUF models found for "{searchState.query}"</Text>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-2 py-6 opacity-40">
			<Search size={24} />
			<Text size="sm" color="muted">Search HuggingFace for AI models to download</Text>
			<Text size="xs" color="muted">Results are filtered to models with GGUF files</Text>
		</div>
	{/if}
</div>
