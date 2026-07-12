<!--
	@block KnowledgeDykCard
	@module @devpulse/design/blocks/knowledge

	Did-you-know variant. Wraps `KnowledgeCard` with a Clyffy
	headshot (idle pose) + "Did you know?" kicker + title/body
	rendering + reaction footer.

	Pure presentational — caller supplies the entry and the
	handlers. Used by `KnowledgeDeck` when dispatching `dyk`
	entries from the engine catalog.
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { DykPayload, KnowledgeEntry } from "$lib/domains/app/knowledge/util/index.js";
import ClyffyHeadshot from "../clyffy/ClyffyHeadshot.svelte";
import KnowledgeCard from "./KnowledgeCard.svelte";

interface Props {
	/** The entry to render. Must be a `dyk` entry. */
	entry: KnowledgeEntry & { payload: DykPayload };
	/**
	 * `aria-live` mode for the card region. Defaults to `polite`
	 * since DYKs typically appear asynchronously.
	 */
	live?: "off" | "polite" | "assertive";
	/** Helpful reaction handler. */
	onHelpful?: () => void;
	/** Not-helpful reaction handler. */
	onNotHelpful?: () => void;
	/** Dismiss handler (no reaction recorded). */
	onDismiss?: () => void;
	/** Layman labels — caller resolves from copy cascade. */
	labels?: {
		kicker: string;
		helpful: string;
		notHelpful: string;
		dismissAria: string;
	};
}

let { entry, live = "polite", onHelpful, onNotHelpful, onDismiss, labels }: Props = $props();

const resolved = $derived({
	kicker: labels?.kicker ?? "Did you know?",
	helpful: labels?.helpful ?? "Helpful",
	notHelpful: labels?.notHelpful ?? "Not helpful",
	dismissAria: labels?.dismissAria ?? "Dismiss tip",
});

const headingId = $derived(`kc-dyk-${entry.id}`);
</script>

<KnowledgeCard accent="cyan" {headingId} {live}>
	{#snippet mascot()}
		<ClyffyHeadshot pose="idle" size="md" decorative />
	{/snippet}
	{#snippet heading()}
		<Text size="xs" weight="semibold" color="muted" as="p">{resolved.kicker}</Text>
		<Text size="sm" weight="semibold" as="p">{entry.payload.title}</Text>
	{/snippet}
	{#snippet body()}
		<Text size="sm" as="p">{entry.payload.body}</Text>
	{/snippet}
	{#snippet actions()}
		{#if onHelpful}
			<Button
				preset="ghost"
				size="sm"
				aria-label={resolved.helpful}
				onclick={onHelpful}
			>
				{resolved.helpful}
			</Button>
		{/if}
		{#if onNotHelpful}
			<Button
				preset="ghost"
				size="sm"
				aria-label={resolved.notHelpful}
				onclick={onNotHelpful}
			>
				{resolved.notHelpful}
			</Button>
		{/if}
		<div style="flex: 1;"></div>
		{#if onDismiss}
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
