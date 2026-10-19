<!--
	@block KnowledgeFrustCard
	@module @devpulse/design/blocks/knowledge

	Frustration-relief variant — surfaces preemptive help for
	known pain points (the slow part, the confusing config, the
	surprise error). Hotpink accent reads as "elevated attention"
	without crossing into danger-red. The Clyffy headshot
	defaults to the `pointing` pose so the surface reads as
	"here, look at this" rather than the passive `idle` of DYK.

	Distinct visual register from `KnowledgeKdropCard`:
	frustrations are higher-stakes than tips. They get the
	attention-grabbing color so they're not lost in DYK noise.
-->
<script lang="ts">
import { ClyffyHeadshot } from "@devpulse/coldlight/blocks/clyffy";
import { KnowledgeCard } from "@devpulse/coldlight/blocks/knowledge";
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import type { FrustPayload, KnowledgeEntry } from "../../util/index.js";

interface Props {
	entry: KnowledgeEntry & { payload: FrustPayload };
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
	kicker: labels?.kicker ?? "Heads up",
	helpful: labels?.helpful ?? "Helpful",
	notHelpful: labels?.notHelpful ?? "Not helpful",
	dismissAria: labels?.dismissAria ?? "Dismiss",
});

const headingId = $derived(`kc-frust-${entry.id}`);
</script>

<KnowledgeCard accent="hotpink" {headingId} {live}>
	{#snippet mascot()}
		<ClyffyHeadshot pose="scanning" size="md" decorative />
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
