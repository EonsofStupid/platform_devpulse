<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Checkbox } from "@devpulse/coldlight/components/checkbox";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { Textarea } from "@devpulse/coldlight/components/textarea";
import type { Supervision } from "../factory-board/index.js";
import type { TicketDetailProps } from "./ticket-detail.types.js";

let { ticket, onCouncil, onPolicy, onDecision, onClose }: TicketDetailProps = $props();
let checked = $state<number[]>([]);
let note = $state("");
let reviewIdentity = $state("");
$effect(() => {
	const identity = `${ticket.id}:${ticket.revision}:${ticket.stage}`;
	if (identity !== reviewIdentity) {
		reviewIdentity = identity;
		checked = [];
		note = "";
	}
});
const policies: { name: Supervision; detail: string }[] = [
	{
		name: "Guide each step",
		detail: "Review the plan and each proposed action before work continues.",
	},
	{ name: "Review milestones", detail: "Review the plan, workspace changes and final outcome." },
	{
		name: "Work within limits",
		detail: "Allow bounded workspace work; review external actions and the final outcome.",
	},
];
const canAccept = $derived(
	ticket.stage === "Review" &&
		ticket.evidence.length > 0 &&
		checked.length === ticket.criteria.length &&
		ticket.criteria.length > 0,
);
</script>

<section data-ui="agenthub-ticket-detail" data-slot="root" aria-label={`Ticket ${ticket.id}`} class="flex flex-col gap-6 p-5 sm:p-7">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex min-w-0 flex-col gap-2">
			<div class="flex flex-wrap items-center gap-2"><Badge variant="accent">{ticket.id}</Badge><Badge variant={ticket.stage === "Review" ? "notice" : "neutral"}>{ticket.stage}</Badge><Text size="xs">Proposal r{ticket.revision} · {ticket.origin}</Text></div>
			<Heading level={2} size="xl">{ticket.title}</Heading>
			<Text size="sm">{ticket.goal}</Text>
		</div>
		<Button variant="ghost" size="sm" onclick={onClose}>Close ticket</Button>
	</header>
	<div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
		<div class="flex min-w-0 flex-col gap-5">
			<section class="flex flex-col gap-3" aria-label="Shared evidence">
				<div class="flex flex-wrap items-center justify-between gap-2"><Heading level={3} size="sm">Shared work & evidence</Heading><Text size="xs">Revisioned contributions</Text></div>
				{#each ticket.evidence as contribution}
					<Card variant="deep" class="gap-3 p-4">
						<div class="flex flex-wrap items-center justify-between gap-2"><Text size="sm" weight="semibold">{contribution.author} · {contribution.role}</Text><Badge size="sm">r{contribution.revision}</Badge></div>
						<Text size="sm" weight="semibold">{contribution.title}</Text>
						<Text size="sm">{contribution.detail}</Text>
					</Card>
				{:else}<Text size="sm">No evidence yet. An idle agent or an empty run cannot complete this ticket.</Text>{/each}
			</section>
			<Card variant="minimal" class="gap-3 p-4">
				<Heading level={3} size="sm">Linked conversation</Heading>
				<Text size="sm">Discuss this ticket and configure Council roles in chat. Ticket evidence remains here.</Text>
				<Button variant="secondary" size="sm" onclick={onCouncil}>Open Council in chat</Button>
			</Card>
			{#if ticket.dependency}<Text size="sm">Dependency: {ticket.dependency}. Its acceptance must precede this ticket's execution.</Text>{/if}
			{#if ticket.correction}<Card variant="deep" class="gap-2 p-4"><Heading level={3} size="sm">Your correction</Heading><Text size="sm">{ticket.correction}</Text><Text size="xs">Retained with the next proposal for review. No training job is started.</Text></Card>{/if}
		</div>
		<div class="flex min-w-0 flex-col gap-5">
			<section class="flex flex-col gap-3" aria-label="Human review">
				<Heading level={3} size="sm">{ticket.stage === "Done" ? "Accepted outcome" : "Acceptance checkpoint"}</Heading>
				<Text size="sm">{ticket.stage === "Review" ? `Review the evidence for proposal r${ticket.revision}, then confirm each criterion.` : "Criteria remain attached to the work through every attempt."}</Text>
				{#each ticket.criteria as criterion, i}
					{#if ticket.stage === "Review"}
						<div class="flex items-start gap-3">
							<Checkbox class="shrink-0" checked={checked.includes(i)} onCheckedChange={(value) => { checked = value ? [...checked.filter(item => item !== i), i] : checked.filter(item => item !== i); }} aria-label={criterion}>
								{#if checked.includes(i)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>{/if}
							</Checkbox>
							<Text size="sm">{criterion}</Text>
						</div>
					{:else}<Text size="sm">{ticket.stage === "Done" ? "✓" : "•"} {criterion}</Text>{/if}
				{/each}
				{#if ticket.stage === "Review"}
					<Textarea label="Review note or correction" value={note} onValueChange={(value) => { note = value; }} rows={3} description="Required when requesting changes. Your decision applies only to this proposal revision." />
					<div class="flex flex-wrap gap-2">
						<Button size="sm" disabled={!canAccept} onclick={() => onDecision("accept", ticket.revision, note)}>Accept outcome</Button>
						<Button variant="secondary" size="sm" disabled={!note.trim()} onclick={() => onDecision("changes", ticket.revision, note)}>Request changes</Button>
					</div>
				{:else if ticket.decision}<Text size="sm">{ticket.decision}</Text>
				{:else}<Badge variant="neutral">{ticket.activity}</Badge>{/if}
			</section>
			<section class="flex flex-col gap-3" aria-label="Supervision policy">
				<Heading level={3} size="sm">How involved do you want to be?</Heading>
				{#each policies as policy}
					<Card as="button" variant={ticket.policy === policy.name ? "glow" : "minimal"} aria-pressed={ticket.policy === policy.name} disabled={ticket.stage === "Done"} class="gap-1 p-3 text-left" onclick={() => onPolicy(policy.name)}>
						<Text size="sm" weight="semibold">{policy.name}</Text><Text size="xs">{policy.detail}</Text>
					</Card>
				{/each}
				<Text size="xs">Preview limits: 2 concurrent workers · 30 minutes · no external sends without review. A policy change requires a new review.</Text>
			</section>
		</div>
	</div>
</section>
