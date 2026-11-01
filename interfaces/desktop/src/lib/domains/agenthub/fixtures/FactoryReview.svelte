<!-- F0 review orchestrator. Sample state only; not a production route. -->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { Textarea } from "@devpulse/coldlight/components/textarea";
import { tick } from "svelte";
import { CouncilConfig, type CouncilSeat } from "../../chat/ui/index.js";
import { FactoryBoard, type FactoryTicket, type Supervision } from "../ui/factory-board/index.js";
import { TicketDetail } from "../ui/ticket-detail/index.js";
import { sampleProviders, sampleRoles, sampleSeats, sampleTickets } from "./factory-sample.js";

let tickets = $state(sampleTickets());
let selectedId = $state<string>();
let screen = $state<"board" | "council" | "create">("board");
let assignments = $state<Record<string, CouncilSeat[]>>({});
let seats = $state(sampleSeats());
let message = $state(
	"Choose a ticket to inspect its evidence, supervision policy and next decision.",
);
let title = $state("");
let criteria = $state("");
let detailAnchor = $state<HTMLDivElement>();
let boardAnchor = $state<HTMLDivElement>();
const selected = $derived(tickets.find((ticket) => ticket.id === selectedId));
const validation = $derived.by(() => {
	const selector = seats.find((seat) => seat.kind === "selector");
	const vendor = sampleProviders.find((provider) => provider.id === selector?.provider)?.vendor;
	return seats.some(
		(seat) =>
			seat.kind === "answerer" &&
			sampleProviders.find((provider) => provider.id === seat.provider)?.vendor === vendor,
	)
		? "The selector must use a different vendor from every answerer."
		: null;
});

async function focusDetail() {
	await tick();
	detailAnchor?.focus();
}
function select(id: string) {
	selectedId = id;
	screen = "board";
	void focusDetail();
}
async function close() {
	selectedId = undefined;
	await tick();
	boardAnchor?.focus();
}
function update(change: Partial<FactoryTicket>) {
	tickets = tickets.map((ticket) => (ticket.id === selectedId ? { ...ticket, ...change } : ticket));
}
function policy(next: Supervision) {
	if (!selected || selected.policy === next || selected.stage === "Done") return;
	update({ policy: next, revision: selected.revision + 1 });
	message = "Supervision changed. Confirm the criteria again for the new proposal revision.";
	void focusDetail();
}
function decide(decision: "accept" | "changes", revision: number, note: string) {
	if (!selected || selected.stage !== "Review" || selected.revision !== revision) {
		message = "This proposal changed. Open its current revision before deciding.";
		return;
	}
	if (decision === "changes" && !note.trim()) return;
	update(
		decision === "accept"
			? {
					stage: "Done",
					activity: "Accepted by you",
					decision: `You accepted proposal r${revision}.${note.trim() ? ` ${note.trim()}` : ""}`,
				}
			: {
					stage: "Working",
					activity: "Paused · correction awaiting a new proposal",
					correction: note.trim(),
					decision: undefined,
				},
	);
	message =
		decision === "accept"
			? `${selectedId} accepted. Its evidence and decision remain attached.`
			: `${selectedId} returned for changes. Your correction is retained.`;
	void focusDetail();
}
function revisedSample() {
	if (!selected?.correction || selected.stage !== "Working") return;
	const revision = selected.revision + 1;
	update({
		stage: "Review",
		revision,
		activity: "Waiting for your acceptance",
		evidence: [
			...selected.evidence,
			{
				author: "Worker · sample",
				role: "Domain expert",
				title: "Revised sample proposal",
				revision,
				detail: `Proposed response to your correction: ${selected.correction}. Inspect this illustrative revision before accepting.`,
			},
		],
	});
	message = "A new sample revision is ready. The previous checklist does not carry over.";
	void focusDetail();
}
function openCouncil() {
	if (!selected) return;
	seats = (assignments[selected.id] ?? sampleSeats()).map((seat) => ({ ...seat }));
	screen = "council";
	void focusDetail();
}
function saveCouncil() {
	if (!selected || validation) return;
	assignments = { ...assignments, [selected.id]: seats.map((seat) => ({ ...seat })) };
	message = `Council seats saved for ${selected.id} in this preview. No agent was started.`;
	screen = "board";
	void focusDetail();
}
function create() {
	const acceptance = criteria
		.split("\n")
		.map((item) => item.trim())
		.filter(Boolean);
	if (!title.trim() || !acceptance.length) return;
	const id = `DP-${Math.max(...tickets.map((ticket) => Number(ticket.id.slice(3)))) + 1}`;
	tickets = [
		...tickets,
		{
			id,
			title: title.trim(),
			goal: title.trim(),
			stage: "Intake",
			priority: "Normal",
			origin: "Created by you in preview",
			activity: "Needs assignment and admission",
			roles: [],
			revision: 1,
			criteria: acceptance,
			evidence: [],
			policy: "Guide each step",
		},
	];
	message = `${id} created in sample intake. Assigning a Council does not automatically admit or execute it.`;
	title = "";
	criteria = "";
	select(id);
}
function reset() {
	tickets = sampleTickets();
	selectedId = undefined;
	assignments = {};
	screen = "board";
	message = "Preview reset. All changes here are temporary sample data.";
}
</script>

<main data-surface="neuro" class="mx-auto flex min-h-screen max-w-[110rem] flex-col gap-6 p-4 sm:p-7 lg:p-9">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Badge variant="notice">Interactive design preview · sample data · resets on reload</Badge>
		<Button variant="ghost" size="sm" onclick={reset}>Reset preview</Button>
	</div>
	<header class="flex flex-wrap items-end justify-between gap-5">
		{#if screen === "council"}
			<div class="flex flex-col gap-2"><Text size="sm">Chat / Council</Text><Heading level={1} size="3xl">Council</Heading><Text>Choose roles and perspectives for this conversation.</Text></div>
		{:else}
		<div class="flex flex-col gap-2"><Text size="sm">Overmind / AgentHub</Text><Heading level={1} size="3xl">Your AI factory.</Heading><Text>Set the work. Shape the team. Decide where you step in.</Text></div>
		<div class="flex flex-wrap gap-3">
			<Badge variant="informative">{tickets.filter(ticket => ticket.stage === "Working").length} working</Badge>
			<Badge variant="notice">{tickets.filter(ticket => ticket.stage === "Review").length} waiting for you</Badge>
			<Badge variant="positive">{tickets.filter(ticket => ticket.stage === "Done").length} accepted</Badge>
		</div>
		{/if}
	</header>
	<Card variant="deep" class="gap-2 p-4" label="Preview feedback"><div role="status" aria-live="polite"><Text size="sm">{message}</Text></div></Card>
	{#if screen === "board"}
		<div bind:this={boardAnchor} tabindex="-1"><FactoryBoard {tickets} {selectedId} onSelect={select} onCreate={() => { screen = "create"; void focusDetail(); }} /></div>
	{/if}
	<div bind:this={detailAnchor} tabindex="-1">
		{#if screen === "council" && selected}
			<CouncilConfig ticketId={selected.id} {seats} roles={sampleRoles} providers={sampleProviders} {validation}
				onChange={(id, field, value) => { seats = seats.map(seat => seat.id === id ? { ...seat, [field]: value } : seat); }}
				onSave={saveCouncil} onBack={() => { screen = "board"; void focusDetail(); }} />
		{:else if screen === "create"}
			<Card variant="elevated" class="mx-auto max-w-3xl gap-5 p-6">
				<Heading level={2} size="lg">Define a ticket</Heading>
				<Textarea label="Ticket goal" value={title} onValueChange={(value) => { title = value; }} rows={2} />
				<Textarea label="Acceptance criteria" description="One criterion per line. What evidence will prove the work is complete?" value={criteria} onValueChange={(value) => { criteria = value; }} rows={4} />
				<div class="flex gap-3"><Button disabled={!title.trim() || !criteria.trim()} onclick={create}>Create sample ticket</Button><Button variant="secondary" onclick={() => { screen = "board"; }}>Cancel</Button></div>
			</Card>
		{:else if selected}
			{#key `${selected.id}:${selected.revision}:${selected.stage}`}
				<TicketDetail ticket={selected} onCouncil={openCouncil} onPolicy={policy} onDecision={decide} onClose={close} />
			{/key}
			{#if selected.correction && selected.stage === "Working"}
				<div class="mt-4 flex flex-wrap items-center gap-3"><Button variant="secondary" size="sm" onclick={revisedSample}>Load revised sample proposal</Button><Text size="xs">Preview control: simulates the worker returning, without executing an agent.</Text></div>
			{/if}
		{/if}
	</div>
	<footer><Text size="xs">F0 design review · Database persistence, bundled worker execution, provider activation, email and push are subsequent delivery slices.</Text></footer>
</main>
