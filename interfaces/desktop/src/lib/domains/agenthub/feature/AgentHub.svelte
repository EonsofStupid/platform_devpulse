<!-- @feature AgentHub — provider catalog, live observations and read-only history. -->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { SearchField } from "@devpulse/coldlight/components/search-field";
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import { projectsState } from "#lib/domains/app/projects/index.js";
import { providersState } from "#lib/domains/app/providers/index.js";
import { openWindow } from "#lib/sys/bindings/window/index.js";
import type { ProviderId } from "#lib/sys/generated/bindings.js";
import { hrefOf, routeAt, routeCopy } from "#lib/sys/routing/index.js";
import { page } from "$app/state";
import { agenthubState } from "../data-access/agenthub.state.svelte.js";
import {
	historyState,
	type SessionGroup,
	sessionGroups,
	sessionKey,
} from "../data-access/history.state.svelte.js";
import { HistoryRow } from "../ui/history-row/index.js";
import { TranscriptReader } from "../ui/transcript-reader/index.js";
import TicketFactory from "./TicketFactory.svelte";

let query = $state("");
let provider = $state<ProviderId | null>(null);
let windowError = $state<string | null>(null);
const here = routeAt("/overmind/agenthub");
const settings = routeAt("/devpulse/settings/ai");
const title = $derived(here ? routeCopy(here)?.label : undefined);
const linkedConversation = $derived(page.url.searchParams.get("conversation"));
const sessions = $derived(historyState.catalog?.sessions ?? []);
const filtered = $derived(
	sessions.filter((session) => !provider || session.providerId === provider),
);
const groups = $derived(sessionGroups(filtered, query));
const live = $derived(
	agenthubState.ready
		? (agenthubState.current?.conversations.filter((turn) => !turn.place) ?? [])
		: [],
);
const providerName = (id: ProviderId) =>
	providersState.current?.report?.providers.find((entry) => entry.id === id)?.name ?? id;

$effect(() => providersState.start());
$effect(() => {
	if (!projectsState.ready) return;
	void historyState.refresh();
	void agenthubState.connect();
});

async function openChat() {
	windowError = null;
	try {
		const result = await openWindow("Chat");
		if (result.status === "error") throw new Error(result.error);
	} catch (error) {
		windowError = error instanceof Error ? error.message : String(error);
	}
}
</script>

{#snippet family(nodes: SessionGroup[])}
	<ul class="flex flex-col gap-2">
		{#each nodes as node (sessionKey(node.session))}
			<li class="min-w-0">
				<HistoryRow session={node.session} providerName={providerName(node.session.providerId)} selected={historyState.selected !== null && sessionKey(historyState.selected) === sessionKey(node.session)} onSelect={() => void historyState.select(node.session)} />
				{#if node.children.length}
					<details class="ml-3 mt-1" open={query.trim().length > 0}>
						<summary class="p-2"><Text size="xs">{node.children.length} sub-agent{node.children.length === 1 ? "" : "s"}</Text></summary>
						{@render family(node.children)}
					</details>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<div class="flex h-full min-h-0 flex-col gap-4 p-4">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-col gap-1"><Heading level={1} size="xl">{title ?? "AgentHub"}</Heading><Text size="sm">Your agents, live conversations and sessions on this machine.</Text></div>
		<div class="flex flex-wrap gap-2">
			{#if settings}<Card as="a" variant="minimal" href={hrefOf(settings)} class="justify-center px-3 py-2"><Text size="sm">Manage your AI</Text></Card>{/if}
			<Button onclick={() => void openChat()}>Open chat</Button>
		</div>
	</header>
	{#if windowError}<Text role="alert" size="sm">{windowError}</Text>{/if}
	{#if linkedConversation && agenthubState.ready && !live.some((turn) => turn.sessionId === linkedConversation)}
		<Text role="status" size="sm">This chat has no retained live activity in the current runtime. Open chat to return to your conversation.</Text>
	{/if}
	{#if agenthubState.error}<Text role="alert" size="sm">Live activity unavailable: {agenthubState.error}</Text><Button variant="ghost" size="sm" onclick={() => void agenthubState.connect()}>Retry live activity</Button>{/if}
	{#if live.length}
		<section aria-label="Live conversations" class="flex shrink-0 gap-2 overflow-x-auto">
			{#each live as turn (turn.sessionId)}
				<Card variant="minimal" class="min-w-48 gap-1 p-3">
					{#if turn.sessionId === linkedConversation}<Text size="xs" weight="semibold">Conversation from chat</Text>{/if}
					<div class="flex items-center gap-2"><StatusDot status={turn.activity === "working" ? "loading" : turn.activity === "waitingForYou" ? "pending" : turn.error ? "failed" : "offline"} /><Text size="sm" weight="semibold">{turn.activity === "working" ? "Working" : turn.activity === "waitingForYou" ? "Waiting for you" : "Idle"}</Text></div>
					<Text size="xs">{turn.providerId ? providerName(turn.providerId) : "Room"} · {projectsState.projects.find((project) => project.id === turn.projectId)?.name ?? "Project"}</Text>
					<Text size="xs" class="line-clamp-2">{turn.permissions[0]?.title ?? turn.error ?? turn.text.slice(-160)}</Text>
				</Card>
			{/each}
		</section>
	{/if}
	<div class="min-h-0 flex-1 overflow-y-auto">
	<TicketFactory projectId={projectsState.activeProjectId} />
	<details class="mt-6" open={!!linkedConversation}>
	<summary>Session library</summary>
	<div class="grid min-h-[28rem] grid-cols-1 gap-4 md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
		<aside aria-label="Session library" class="flex min-h-0 flex-col gap-3">
			<div class="flex items-center justify-between gap-2"><Heading level={2} size="sm">Session library</Heading><Button variant="ghost" size="sm" disabled={historyState.loading || !projectsState.ready} onclick={() => void historyState.refresh()}>{historyState.loading ? "Refreshing…" : "Refresh"}</Button></div>
			<SearchField value={query} onValueChange={(value) => { query = value; }} aria-label="Search sessions" placeholder="Search sessions or folders" />
			<div class="flex flex-wrap gap-1" role="group" aria-label="Filter by provider">
				<Button variant="ghost" size="sm" aria-pressed={provider === null} onclick={() => { provider = null; }}>All · {sessions.length}</Button>
				{#each historyState.catalog?.sources ?? [] as source (source.providerId)}
					<Button variant="ghost" size="sm" aria-pressed={provider === source.providerId} onclick={() => { provider = source.providerId; }}>{providerName(source.providerId)} · {source.sessions}</Button>
				{/each}
			</div>
			{#if historyState.error}<Text role="alert" size="sm">{historyState.error}</Text>{/if}
			{#each historyState.catalog?.sources ?? [] as source (source.providerId)}
				{#if source.problem || source.truncated}<Text role="status" size="xs">{providerName(source.providerId)}: {source.problem ?? "Catalog limit reached; more sessions may exist."}</Text>{/if}
			{/each}
			<div class="min-h-0 flex-1 overflow-y-auto">
				{#if !projectsState.ready}<Text role="status" size="sm">Waiting for DevPulse…</Text>
				{:else if historyState.loading && !historyState.catalog}<Text role="status" size="sm">Finding sessions…</Text>
				{:else if !groups.length && !historyState.error}<Text size="sm">{query || provider ? "No sessions match this filter." : "No sessions found. Open chat to start a conversation with your agent."}</Text>
				{:else}{@render family(groups)}{/if}
			</div>
		</aside>
		<TranscriptReader session={historyState.selected} providerName={historyState.selected ? providerName(historyState.selected.providerId) : ""} events={historyState.events} loading={historyState.pageLoading} error={historyState.pageError} hasOlder={historyState.nextCursor !== null} truncatedBefore={historyState.truncatedBefore} onOlder={() => void historyState.older()} onReload={() => { if (historyState.selected) void historyState.select(historyState.selected); }} />
	</div>
	</details>
	</div>
</div>
