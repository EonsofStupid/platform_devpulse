<!--
	@block KnowledgeInsightCard
	@module @devpulse/design/blocks/knowledge

	Insight variant — architectural observation, pattern, or
	tradeoff worth surfacing. Blue accent reads as
	"design-decision" without the curiosity tone of cyan DYK or
	the urgency of hotpink frust. Headshot defaults to `thinking`
	pose since insights are the brain reflecting on something.
-->
<script lang="ts">
import { ClyffyHeadshot } from "$lib/design/blocks/clyffy/index.js";
import { KnowledgeCard } from "$lib/design/blocks/knowledge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { InsightPayload, KnowledgeEntry } from "../../util/index.js";

interface Props {
	entry: KnowledgeEntry & { payload: InsightPayload };
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
	kicker: labels?.kicker ?? "Insight",
	helpful: labels?.helpful ?? "Helpful",
	notHelpful: labels?.notHelpful ?? "Not helpful",
	dismissAria: labels?.dismissAria ?? "Dismiss",
});

const headingId = $derived(`kc-insight-${entry.id}`);
</script>

<KnowledgeCard accent="blue" {headingId} {live}>
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
