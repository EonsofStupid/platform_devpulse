<!--
	@block KnowledgeTermStrip
	@module @devpulse/design/blocks/knowledge

	One-line wiring for a row of `KnowledgeTerm` pills.
	Use to drop a "what does this word mean?" surface into any
	page without touching the page's copy strings.

	# Usage

	```svelte
	<KnowledgeTermStrip
		terms={["VRAM", "tier", "preset"]}
		label="Glossary terms in this view"
	/>
	```

	Renders an unordered list of KnowledgeTerm pills (each
	hover-revealing the matching glossary entry). The list
	carries `aria-label` for screen readers; the
	individual pills inherit the tooltip-pattern semantics
	from `KnowledgeTerm`.
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import KnowledgeTerm from "./KnowledgeTerm.svelte";

interface Props {
	/** Terms to render — exact match (case-insensitive) against gloss entries. */
	terms: string[];
	/** `aria-label` for the list. Default: "Glossary terms in this view". */
	label?: string;
	/** Optional tool tag for affinity-weighted selection on each term fetch. */
	tool?: string;
	/** Optional visible label rendered before the strip. */
	caption?: string;
}

let { terms, label = "Glossary terms in this view", tool, caption }: Props = $props();
</script>

<div class="knowledge-term-strip">
	{#if caption}
		<Text size="xs" color="muted" as="span">{caption}</Text>
	{/if}
	<ul class="knowledge-term-strip__list" aria-label={label}>
		{#each terms as term (term)}
			<li>
				<KnowledgeTerm {term} {tool}>
					{term}
				</KnowledgeTerm>
			</li>
		{/each}
	</ul>
</div>

<style>
	.knowledge-term-strip {
		display: flex;
		align-items: center;
		gap: clamp(0.375rem, 0.5vw + 0.125rem, 0.625rem);
		flex-wrap: wrap;
		min-width: 0;
	}

	.knowledge-term-strip__list {
		display: flex;
		align-items: center;
		gap: clamp(0.25rem, 0.4vw + 0.125rem, 0.5rem);
		flex-wrap: wrap;
		margin: 0;
		padding: 0;
		list-style: none;
		min-width: 0;
	}

	.knowledge-term-strip__list li {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		border: 0.0625rem solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: var(--surface-inset);
		font-size: 0.75rem;
		line-height: 1.2;
	}
</style>
