<!--
	@ui ModelResultCard
	@module @devpulse/domains/app/models/feature/downloader/ui

	Single HuggingFace search result row. Renders repo id, pipeline tag,
	downloads, likes, and the top suggested slot role so the user can
	decide-at-a-glance whether the model fits their need.

	Dumb presentational — no IPC, no state. The parent passes the
	result and a callback; the card fires the callback with the result
	plus the top-confidence suggested slot id (empty string when no
	heuristic fires — the confirm panel still lets the user pick).

	ARIA:
	  - Wrapped in `<button type="button">` for keyboard activation +
	    native screen-reader "button" role.
	  - The role badge `title` attribute carries the heuristic reason so
	    AT users get the inference rationale.
-->
<script lang="ts">
import { Download as DownloadIcon, Heart } from "@lucide/svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { HfSearchResultInfo } from "$lib/sys/generated/bindings.js";
import { getSlotLabel } from "../../../util/slots.js";
import type { SuggestedSlotTag } from "../util/downloader.types.js";
import { topSuggestion } from "../util/slot-tagging.js";

interface Props {
	result: HfSearchResultInfo;
	/** Fires when the user clicks Select. Carries the suggested slot id
	 * (top-confidence) or the empty string when no heuristic fires. */
	onSelect: (result: HfSearchResultInfo, suggestedSlotId: string) => void;
	class?: string;
}

let { result, onSelect, class: className }: Props = $props();

const top = $derived<SuggestedSlotTag | null>(topSuggestion(result));
const topLabel = $derived<string | null>(
	top ? (getSlotLabel(top.slotId)?.name ?? top.slotId) : null,
);

function handleSelect(): void {
	onSelect(result, top?.slotId ?? "");
}

function formatCount(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}
</script>

<button
	type="button"
	class={cn("result-card", className)}
	onclick={handleSelect}
	aria-label={`Select ${result.repo_id} for download`}
>
	<div class="result-card__header">
		<span class="result-card__repo">{result.repo_id}</span>
		{#if topLabel && top}
			<span
				class="result-card__role"
				data-confidence={top.confidence}
				title={top.reason}
			>
				{topLabel}
			</span>
		{/if}
	</div>
	{#if result.pipeline_tag}
		<span class="result-card__pipeline">{result.pipeline_tag}</span>
	{/if}
	<div class="result-card__meta">
		<span class="result-card__metric" aria-label={`${result.downloads} downloads`}>
			<DownloadIcon class="result-card__icon" aria-hidden="true" />
			{formatCount(result.downloads)}
		</span>
		<span class="result-card__metric" aria-label={`${result.likes} likes`}>
			<Heart class="result-card__icon" aria-hidden="true" />
			{formatCount(result.likes)}
		</span>
	</div>
</button>

<style>
	.result-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
		padding: var(--space-12) var(--space-14);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		transition: border-color 0.15s ease, background 0.15s ease;
	}

	.result-card:hover {
		background: var(--surface-overlay);
		border-color: var(--border-strong);
	}

	.result-card:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.result-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-8);
	}

	.result-card__repo {
		font-size: var(--space-14);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-card__role {
		flex-shrink: 0;
		padding: var(--space-4) var(--space-8);
		border-radius: var(--radius-sm);
		font-size: var(--space-11);
		background: var(--accent-fill);
		color: var(--accent-fg);
	}

	.result-card__role[data-confidence="exact"] {
		background: var(--accent-teal-fill);
		color: var(--accent-teal-main);
	}

	.result-card__role[data-confidence="high"] {
		background: var(--accent-purple-fill);
		color: var(--accent-purple-main);
	}

	.result-card__pipeline {
		font-size: var(--space-11);
		color: var(--text-muted);
	}

	.result-card__meta {
		display: flex;
		gap: var(--space-12);
		font-size: var(--space-11);
		color: var(--text-secondary);
	}

	.result-card__metric {
		display: inline-flex;
		align-items: center;
		gap: var(--space-5);
	}

	.result-card__icon {
		width: var(--space-12);
		height: var(--space-12);
	}
</style>
