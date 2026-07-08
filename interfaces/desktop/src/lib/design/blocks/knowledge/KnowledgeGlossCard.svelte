<!--
	@block KnowledgeGlossCard
	@module @devpulse/design/blocks/knowledge

	Glossary-term definition variant. Term + definition layout
	(distinct from the title+body shape of dyk/kdrop). Purple
	accent reads as "reference / lookup" — different visual
	register than the curious-blue DYK or the teal kdrop. No
	mascot column by default (the gloss surface is usually a
	hover popover where the mascot would crowd the layout); pass
	`showMascot={true}` to opt in.
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { GlossPayload, KnowledgeEntry } from "$lib/domains/app/knowledge/util/index.js";
import ClyffyHeadshot from "../clyffy/ClyffyHeadshot.svelte";
import KnowledgeCard from "./KnowledgeCard.svelte";

interface Props {
	entry: KnowledgeEntry & { payload: GlossPayload };
	live?: "off" | "polite" | "assertive";
	/** Show the Clyffy headshot column. Default: false. */
	showMascot?: boolean;
	onDismiss?: () => void;
	labels?: {
		kicker: string;
		dismissAria: string;
	};
}

let { entry, live = "polite", showMascot = false, onDismiss, labels }: Props = $props();

const resolved = $derived({
	kicker: labels?.kicker ?? "Glossary",
	dismissAria: labels?.dismissAria ?? "Dismiss definition",
});

const headingId = $derived(`kc-gloss-${entry.id}`);
</script>

<KnowledgeCard accent="purple" {headingId} {live}>
	{#snippet mascot()}
		{#if showMascot}
			<ClyffyHeadshot pose="idle" size="sm" decorative />
		{/if}
	{/snippet}
	{#snippet heading()}
		<Text size="xs" weight="semibold" color="muted" as="p">{resolved.kicker}</Text>
		<Text size="sm" weight="semibold" as="p">{entry.payload.term}</Text>
	{/snippet}
	{#snippet body()}
		<Text size="sm" as="p">{entry.payload.definition}</Text>
	{/snippet}
	{#snippet actions()}
		{#if onDismiss}
			<div style="flex: 1;"></div>
			<Button
				preset="ghost"
				size="sm"
				aria-label={resolved.dismissAria}
				onclick={onDismiss}
			>
				×
			</Button>
		{/if}
	{/snippet}
</KnowledgeCard>
