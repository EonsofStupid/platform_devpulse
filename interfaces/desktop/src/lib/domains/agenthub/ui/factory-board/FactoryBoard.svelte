<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import type { FactoryBoardProps, TicketStage } from "./factory-board.types.js";

let { tickets, selectedId, onSelect, onCreate }: FactoryBoardProps = $props();
const stages: TicketStage[] = ["Intake", "Ready", "Working", "Review", "Done"];
const descriptions = [
	"Shape the work",
	"Ready to claim",
	"Agents collaborating",
	"Human checkpoint",
	"Accepted outcomes",
];
</script>

<section data-ui="agenthub-factory-board" aria-label="Factory tickets" class="min-w-0">
	<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<Heading level={2} size="lg">Work moves. Context stays.</Heading>
			<Text size="sm" data-ui="agenthub-factory-board" data-slot="muted">Tickets carry goals, shared evidence and the decisions that move work forward.</Text>
		</div>
		<Button size="sm" onclick={onCreate}>New ticket</Button>
	</div>
	<div class="overflow-x-auto pb-4" role="region" aria-label="Ticket columns, scroll horizontally on smaller screens">
		<div class="grid min-w-[68rem] grid-cols-5 gap-3">
			{#each stages as stage, i}
				<section data-ui="agenthub-factory-board" data-slot="column" class="flex min-w-0 flex-col gap-3 p-3" aria-label={`${stage} tickets`}>
					<header class="flex flex-col gap-2 pb-2">
						<div class="flex items-center justify-between gap-2">
							<Heading level={3} size="sm">{stage}</Heading>
							<Badge variant={stage === "Review" ? "notice" : "neutral"} size="sm">{tickets.filter(ticket => ticket.stage === stage).length}</Badge>
						</div>
						<Text size="xs" data-ui="agenthub-factory-board" data-slot="muted">{descriptions[i]}</Text>
					</header>
					{#each tickets.filter(ticket => ticket.stage === stage) as ticket (ticket.id)}
						<Card as="button" variant={stage === "Review" ? "glow" : "elevated"} data-ui="agenthub-factory-board"
							data-selected={selectedId === ticket.id || undefined} aria-pressed={selectedId === ticket.id}
							label={`${ticket.id}: ${ticket.title}`} class="w-full gap-4 p-4 text-left" onclick={() => onSelect(ticket.id)}>
							<div class="flex flex-wrap items-center justify-between gap-2">
								<Text size="xs" weight="semibold">{ticket.id}</Text>
								<Badge variant={ticket.priority === "High" ? "notice" : "neutral"} size="sm" fillStyle="subtle">{ticket.priority}</Badge>
							</div>
							<Text size="sm" weight="semibold">{ticket.title}</Text>
							<Text size="xs" data-ui="agenthub-factory-board" data-slot="muted">{ticket.activity}</Text>
							{#if ticket.dependency}<Text size="xs">Depends on {ticket.dependency}</Text>{/if}
							<div class="flex flex-wrap gap-1">
								{#each ticket.roles as role}<Badge size="sm" variant="informative" fillStyle="subtle">{role}</Badge>{/each}
							</div>
							<Text size="xs" data-ui="agenthub-factory-board" data-slot="muted">{ticket.criteria.length} criteria · {ticket.evidence.length} contributions</Text>
						</Card>
					{:else}
						<div class="px-2 py-6"><Text size="sm" data-ui="agenthub-factory-board" data-slot="muted">No tickets here.</Text></div>
					{/each}
				</section>
			{/each}
		</div>
	</div>
</section>
