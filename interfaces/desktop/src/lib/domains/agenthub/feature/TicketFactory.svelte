<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { Textarea } from "@devpulse/coldlight/components/textarea";
import { createTicket, listTickets, onTicketsChanged, type Ticket } from "../data-access/tickets.service.js";
import { FactoryBoard } from "../ui/factory-board/index.js";
import type { FactoryBoardTicket } from "../ui/factory-board/factory-board.types.js";

let { projectId }: { projectId: string | null } = $props();
let tickets = $state<Ticket[]>([]);
let selectedId = $state<string>();
let creating = $state(false);
let saving = $state(false);
let loading = $state(false);
let error = $state<string | null>(null);
let title = $state("");
let goal = $state("");
let criteria = $state("");
let generation = 0;
let readGeneration = 0;
const selected = $derived(tickets.find((ticket) => ticket.id === selectedId));
const boardTickets = $derived<FactoryBoardTicket[]>(tickets.map((ticket) => ({
	id: ticket.id, title: ticket.title, stage: "Intake",
	activity: "Awaiting assignment", roles: [], criteria: ticket.criteria, evidence: [],
})));

function message(reason: unknown): string {
	if (typeof reason === "object" && reason !== null && "message" in reason && typeof reason.message === "string") return reason.message;
	return String(reason);
}

$effect(() => {
	const project = projectId;
	const current = ++generation;
	tickets = [];
	selectedId = undefined;
	creating = false;
	error = null;
	if (!project) { loading = false; return; }
	loading = true;
	let disposed = false;
	let unlisten: (() => void) | undefined;
	async function refresh() {
		const read = ++readGeneration;
		try {
			const result = await listTickets(project!);
			if (generation === current && read === readGeneration) tickets = result;
		} catch (reason) {
			if (generation === current && read === readGeneration) error = message(reason);
		} finally { if (generation === current && read === readGeneration) loading = false; }
	}
	void onTicketsChanged((changed) => { if (changed === project) void refresh(); }).then((off) => {
		if (disposed) { off(); return; }
		unlisten = off;
		void refresh();
	}).catch((reason: unknown) => {
		if (generation === current) { error = message(reason); void refresh(); }
	});
	return () => { disposed = true; unlisten?.(); };
});

async function save() {
	const project = projectId;
	if (!project || saving) return;
	const current = generation;
	saving = true;
	error = null;
	try {
		const ticket = await createTicket(project, title, goal, criteria.split("\n"));
		if (current !== generation) return;
		tickets = [ticket, ...tickets.filter((entry) => entry.id !== ticket.id)];
		selectedId = ticket.id;
		creating = false;
		title = ""; goal = ""; criteria = "";
	} catch (reason) {
		if (current === generation) error = message(reason);
	} finally { saving = false; }
}
</script>

<section aria-label="AgentHub factory" class="flex flex-col gap-4">
	{#if !projectId}<Text size="sm">Select a project to see its tickets.</Text>
	{:else}
		{#if error}<Text role="alert" size="sm">{error}</Text>{/if}
		{#if loading}<Text role="status" size="sm">Loading tickets…</Text>
		{:else}
		<FactoryBoard tickets={boardTickets} {selectedId} onSelect={(id) => { selectedId = id; creating = false; }} onCreate={() => { creating = true; selectedId = undefined; }} />
		{/if}
		{#if creating}
			<Card variant="elevated" class="gap-4 p-5">
				<Heading level={2} size="lg">Define a ticket</Heading>
				<Textarea label="Title" value={title} onValueChange={(value) => { title = value; }} rows={2} />
				<Textarea label="Goal" value={goal} onValueChange={(value) => { goal = value; }} rows={3} />
				<Textarea label="Acceptance criteria" description="One criterion per line." value={criteria} onValueChange={(value) => { criteria = value; }} rows={4} />
				<div class="flex gap-2"><Button disabled={saving || !title.trim() || !goal.trim() || !criteria.trim()} onclick={() => void save()}>{saving ? "Saving…" : "Create ticket"}</Button><Button variant="secondary" onclick={() => { creating = false; }}>Cancel</Button></div>
			</Card>
		{:else if selected}
			<Card variant="elevated" class="gap-4 p-5">
				<Heading level={2} size="lg">{selected.title}</Heading>
				<Text size="sm">{selected.goal}</Text>
				<Heading level={3} size="sm">Acceptance criteria</Heading>
				<ul class="list-disc pl-5">{#each selected.criteria as criterion}<li><Text size="sm">{criterion}</Text></li>{/each}</ul>
				<Text size="xs">Intake · revision {selected.revision}. Agent assignment and execution are not available yet.</Text>
				<Button variant="ghost" size="sm" onclick={() => { selectedId = undefined; }}>Close</Button>
			</Card>
		{/if}
	{/if}
</section>
