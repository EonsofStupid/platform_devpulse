<!--
	@feature DownloaderSearchPanel
	@module @devpulse/domains/app/models/feature/downloader/feature

	Search-phase panel — debounced HuggingFace search + scrollable
	results. Each result row delegates to `ModelResultCard` (D2 UI
	primitive). Clicking a card promotes the downloader to the confirm
	phase via `modelDownloaderState.select`.

	Empty / busy / error / no-results states are mutually exclusive,
	driven by the singleton's reactive flags.

	ARIA:
	  - `role="search"` on the input wrapper so AT lists this as a
	    landmark.
	  - Result list as `<ul>` with `<li>` items — native list
	    semantics, no custom role.
	  - Busy / error / empty states use `role="status"` `aria-live="polite"`
	    so AT users hear state transitions.
-->
<script lang="ts">
import { Search } from "@lucide/svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { DownloaderCopy, HfSearchResultInfo } from "$lib/sys/generated/bindings.js";
import { modelDownloaderState } from "../data-access/downloader.state.svelte.js";
import { ModelResultCard } from "../ui/index.js";

interface Props {
	copy: DownloaderCopy;
	class?: string;
}

let { copy, class: className }: Props = $props();

const projectScopeBanner = $derived.by(() => {
	const id = modelDownloaderState.target?.projectId;
	if (!id) return null;
	return copy.project_scope_indicator_template.replace("{project_id}", id);
});

function handleInput(e: Event): void {
	const value = (e.currentTarget as HTMLInputElement).value;
	modelDownloaderState.setQuery(value);
}

async function handleSelect(result: HfSearchResultInfo, suggestedSlotId: string): Promise<void> {
	await modelDownloaderState.select(result, suggestedSlotId);
}

function formatNoResults(): string {
	return copy.search_no_results_template.replace("{query}", modelDownloaderState.query);
}

function formatError(error: string): string {
	return copy.search_error_template.replace("{error}", error);
}
</script>

<section class={cn("search-panel", className)} aria-labelledby="downloader-search-heading">
	{#if projectScopeBanner}
		<div class="search-panel__scope-banner" role="note">
			{projectScopeBanner}
		</div>
	{/if}

	<h3 id="downloader-search-heading" class="search-panel__heading">
		{copy.search_phase_heading}
	</h3>

	<div class="search-panel__input-row" role="search">
		<Search class="search-panel__input-icon" aria-hidden="true" />
		<input
			type="search"
			class="search-panel__input"
			placeholder={copy.search_input_placeholder}
			aria-label={copy.search_input_aria}
			value={modelDownloaderState.query}
			oninput={handleInput}
			autocomplete="off"
			spellcheck="false"
		/>
	</div>

	<div class="search-panel__results">
		{#if modelDownloaderState.searching}
			<p class="search-panel__status" role="status" aria-live="polite">
				{copy.search_busy_label}
			</p>
		{:else if modelDownloaderState.searchError}
			<p class="search-panel__error" role="alert">
				{formatError(modelDownloaderState.searchError)}
			</p>
		{:else if modelDownloaderState.query.trim().length === 0}
			<p class="search-panel__empty" role="status">
				{copy.search_empty_label}
			</p>
		{:else if modelDownloaderState.results.length === 0}
			<p class="search-panel__empty" role="status" aria-live="polite">
				{formatNoResults()}
			</p>
		{:else}
			<ul class="search-panel__list" aria-label={copy.search_phase_heading}>
				{#each modelDownloaderState.results as result (result.repo_id)}
					<li class="search-panel__item">
						<ModelResultCard {result} onSelect={handleSelect} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.search-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		min-height: 0;
		flex: 1;
	}

	.search-panel__scope-banner {
		padding: var(--space-7) var(--space-12);
		border-radius: var(--radius-sm);
		background: var(--accent-purple-fill);
		color: var(--accent-purple-main);
		font-size: var(--space-11);
		font-weight: 600;
	}

	.search-panel__heading {
		margin: 0;
		font-size: var(--space-14);
		font-weight: 600;
		color: var(--text-primary);
	}

	.search-panel__input-row {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
	}

	.search-panel__input-row:focus-within {
		border-color: var(--border-focus);
	}

	.search-panel__input-icon {
		width: var(--space-14);
		height: var(--space-14);
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-panel__input {
		flex: 1;
		min-width: 0;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: var(--space-12);
		outline: none;
	}

	.search-panel__results {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.search-panel__status,
	.search-panel__empty {
		margin: 0;
		padding: var(--space-16);
		text-align: center;
		font-size: var(--space-12);
		color: var(--text-muted);
	}

	.search-panel__error {
		margin: 0;
		padding: var(--space-12) var(--space-14);
		border-radius: var(--radius-sm);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-primary);
		font-size: var(--space-12);
	}

	.search-panel__list {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.search-panel__item {
		list-style: none;
	}
</style>
