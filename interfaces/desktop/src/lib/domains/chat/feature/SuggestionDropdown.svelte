<!--
	@feature SuggestionDropdown — type-time recall surface
	@description Renders the top-K matches from `suggestState` as a
	             keyboard-navigable list above the chat input. Tab or
	             click accepts; ↑/↓ move; Esc dismisses.
-->
<script lang="ts">
import type { Suggestion } from "$lib/sys/generated/bindings.js";
import { suggestState } from "../data-access/suggest.state.svelte.js";

let {
	onAccept,
}: {
	onAccept: (s: Suggestion) => void;
} = $props();

const visible = $derived(
	suggestState.suggestions.length > 0 || suggestState.loading || suggestState.error !== null,
);

function pick(index: number): void {
	const s = suggestState.suggestions[index];
	if (!s) return;
	suggestState.markAccepted();
	onAccept(s);
}

function formatScore(s: Suggestion): string {
	return `${(s.similarity * 100).toFixed(0)}%`;
}
</script>

{#if visible}
	<div
		role="listbox"
		aria-label="Past prompt suggestions"
		class="absolute bottom-full left-0 right-2 mb-1 max-h-64 overflow-y-auto
			rounded-md border border-[var(--border-subtle)]
			bg-[var(--surface-overlay,_oklch(0.12_0.02_224))]
			shadow-lg backdrop-blur-sm"
	>
		{#if suggestState.error}
			<div class="px-3 py-2 text-xs text-[var(--signal-error)]">
				{suggestState.error}
			</div>
		{:else if suggestState.loading && suggestState.suggestions.length === 0}
			<div class="px-3 py-2 text-xs italic text-[var(--text-muted)]">Looking back…</div>
		{:else}
			{#each suggestState.suggestions as s, i (s.id)}
				<button
					type="button"
					role="option"
					aria-selected={i === suggestState.highlight}
					class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm
						hover:bg-[var(--interaction-hover)]
						{i === suggestState.highlight
						? 'bg-[var(--interaction-hover)]'
						: ''}"
					onclick={() => pick(i)}
				>
					<span class="flex-1 truncate text-[var(--text-primary)]">{s.text}</span>
					<span
						class="shrink-0 font-mono text-[0.65rem] uppercase tracking-wide
							text-[var(--text-muted)]"
						aria-label="Match score"
					>
						{formatScore(s)}
						{#if s.accepted}
							<span class="ml-1 text-[var(--accent-primary-main)]" title="Previously accepted">★</span>
						{/if}
					</span>
				</button>
			{/each}
		{/if}
	</div>
{/if}
