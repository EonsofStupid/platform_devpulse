<!--
	@block KnowledgeKdropCard
	@module @devpulse/design/blocks/knowledge

	Knowledge-drop variant. Deeper / more substantial educational
	content than DYK. Wraps `KnowledgeCard` with the teal accent
	(reads as "tip / pattern" vs the cyan curiosity tone of DYK),
	a `thinking` Clyffy headshot, and a "Tip" kicker.
-->
<script lang="ts">
import { ClyffyHeadshot } from "@devpulse/coldlight/blocks/clyffy";
import { KnowledgeCard } from "@devpulse/coldlight/blocks/knowledge";
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import type { KdropPayload, KnowledgeEntry } from "../../util/index.js";

interface Props {
	entry: KnowledgeEntry & { payload: KdropPayload };
	live?: "off" | "polite" | "assertive";
	onHelpful?: () => void;
	onNotHelpful?: () => void;
	onDismiss?: () => void;
	labels?: {
		kicker: string;
		helpful: string;
		notHelpful: string;
		dismissAria: string;
	};
}

let { entry, live = "polite", onHelpful, onNotHelpful, onDismiss, labels }: Props = $props();

const resolved = $derived({
	kicker: labels?.kicker ?? "Tip",
	helpful: labels?.helpful ?? "Helpful",
	notHelpful: labels?.notHelpful ?? "Not helpful",
	dismissAria: labels?.dismissAria ?? "Dismiss tip",
});

const headingId = $derived(`kc-kdrop-${entry.id}`);
</script>

<KnowledgeCard accent="teal" {headingId} {live}>
	{#snippet mascot()}
		<ClyffyHeadshot pose="thinking" size="md" decorative />
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
