<!--
  @feature ChatRoot — golden chat composition (atmosphere + chrome + stream + composer)
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { DynamicBackground } from "@devpulse/coldlight/components/dynamic-background";
import { Text } from "@devpulse/coldlight/components/text";
import { untrack } from "svelte";
import { agenthubState } from "$lib/domains/agenthub/index.js";
import { containersState } from "$lib/domains/app/containers/index.js";
import { isInferenceReady, ModelEventCard, modelsState } from "$lib/domains/app/models/index.js";
import { projectsState } from "$lib/domains/app/projects/index.js";
import { openMainPage } from "$lib/sys/bindings/window/index.js";
import { type RouteNode, routeAt, routeCopy } from "$lib/sys/routing/index.js";
import { agentsState } from "../data-access/agents.state.svelte.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import ChatActionsMenu from "./ChatActionsMenu.svelte";
import ChatComposer from "./ChatComposer.svelte";
import ChatModeSelector from "./ChatModeSelector.svelte";
import ChatNotes from "./ChatNotes.svelte";
import ChatSessionList from "./ChatSessionList.svelte";
import ChatStream from "./ChatStream.svelte";
import CortexMemoryStrip from "./CortexMemoryStrip.svelte";

let previousProject: string | null | undefined;
let dismissedEvents = $state(new Set<string>());
const hub = routeAt("/overmind/agenthub");
const aiSettings = routeAt("/devpulse/settings/ai");
let navigationError = $state<string | null>(null);
let showSessions = $state(false);
const hostReport = $derived(containersState.current?.report ?? null);
const hostSummary = $derived.by(() => {
	if (!hostReport) return "Machine status not checked";
	const running = hostReport.engines
		.filter((engine) => engine.running)
		.map((engine) => engine.name);
	const installed = hostReport.engines
		.filter((engine) => engine.installed)
		.map((engine) => engine.name);
	const engines = running.length
		? `${running.join(", ")} running`
		: installed.length
			? `${installed.join(", ")} installed · not running or unreachable`
			: "no container engine detected";
	return `${hostReport.host.os} · ${engines}`;
});
async function openPage(route: RouteNode, conversation: string | null = null) {
	navigationError = null;
	try {
		await openMainPage(route, conversation);
	} catch (error) {
		navigationError = error instanceof Error ? error.message : String(error);
	}
}
const finishedTurn = $derived.by(() => {
	const turn = agenthubState.conversation(chatState.activeSessionId);
	return turn?.activity === "idle" ? turn.turnId : null;
});

const activeModelEvents = $derived.by(() => {
	const events: { slotId: string; status: (typeof modelsState.statuses)[string] }[] = [];
	for (const [slotId, status] of Object.entries(modelsState.statuses)) {
		if (!status) continue;
		if (dismissedEvents.has(slotId)) continue;
		if (status.type === "loading" || isInferenceReady(status) || status.type === "failed") {
			events.push({ slotId, status });
		}
	}
	return events;
});

// Sessions and messages follow the active project; until Rust's projects
// state has arrived and the platform answers, there is nothing to load.
$effect(() => {
	return containersState.start();
});

$effect(() => {
	if (!projectsState.ready) return;
	const project = projectsState.activeProjectId;
	untrack(() => {
		if (previousProject !== undefined && previousProject !== project)
			chatState.setActiveSession(null);
		previousProject = project;
	});
	void agentsState.initialize();
	void sessionsState.refresh();
	if (project) void agentsState.refresh(project);
});

$effect(() => {
	void chatState.activeSessionId;
	void finishedTurn;
	if (!projectsState.ready) return;
	void projectsState.activeProjectId;
	void chatState.loadActive();
});
</script>

<div class="relative flex min-h-0 flex-1 flex-col">
	{#each activeModelEvents as event (event.slotId)}
		<ModelEventCard slotId={event.slotId} />
	{/each}
	<DynamicBackground variant="devpulse" animated={true} class="pointer-events-none absolute inset-0 opacity-[0.25]" />
	<div class="relative z-10 flex min-h-0 flex-1 gap-2 p-2">
		<aside class="flex w-12 shrink-0 flex-col items-center border-r border-[var(--border-subtle)] pr-1">
			<ChatModeSelector />
		</aside>
		<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
			<div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-1">
				<div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
					<Text size="xs" weight="semibold" class="truncate">{projectsState.activeProject?.name ?? "Choose a project to chat"}</Text>
					<Text size="xs" class="text-[var(--text-secondary)]" title={hostReport ? `Observed ${new Date(hostReport.checkedAt * 1000).toLocaleString()}` : "Refresh to inspect this computer"}>{hostSummary}</Text>
					<Button variant="ghost" size="sm" onclick={() => void containersState.check()} disabled={containersState.busy} title="Refresh operating system and container-engine observations">
						{containersState.busy ? "Checking…" : "Refresh machine"}
					</Button>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<Button variant="ghost" size="sm" class="md:hidden" aria-expanded={showSessions} aria-controls="chat-sessions" onclick={() => { showSessions = !showSessions; }}>Sessions</Button>
					{#if hub}<Button variant="ghost" size="sm" onclick={() => void openPage(hub, chatState.activeSessionId)} title="Open AgentHub in Overmind">{routeCopy(hub)?.label ?? "AgentHub"}</Button>{/if}
					{#if aiSettings}<Button variant="ghost" size="sm" onclick={() => void openPage(aiSettings)}>Your AI</Button>{/if}
					<ChatActionsMenu />
				</div>
			</div>
			{#if navigationError}<Text role="alert" size="xs">{navigationError}</Text>{/if}
			<ChatNotes />
			<CortexMemoryStrip />
			<div class="relative flex min-h-0 flex-1 gap-2">
				<div id="chat-sessions" class={`${showSessions ? "flex" : "hidden"} absolute inset-y-0 left-0 z-20 w-56 md:static md:flex md:w-48 md:shrink-0`}>
					<ChatSessionList onSelect={() => { showSessions = false; }} />
				</div>
				<ChatStream class="min-w-0" />
			</div>
			<ChatComposer />
		</div>
	</div>
</div>
