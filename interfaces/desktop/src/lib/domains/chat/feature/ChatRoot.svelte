<!--
  @feature ChatRoot — golden chat composition (atmosphere + chrome + stream + composer)
-->
<script lang="ts">
import { DynamicBackground } from "@devpulse/coldlight/components/dynamic-background";
import { Text } from "@devpulse/coldlight/components/text";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
import { ModelEventCard, modelsState } from "$lib/domains/app/models/index.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import ChatActionsMenu from "./ChatActionsMenu.svelte";
import ChatComposer from "./ChatComposer.svelte";
import ChatModeSelector from "./ChatModeSelector.svelte";
import ChatSessionList from "./ChatSessionList.svelte";
import ChatStream from "./ChatStream.svelte";
import CortexMemoryStrip from "./CortexMemoryStrip.svelte";

let dismissedEvents = $state(new Set<string>());

const activeModelEvents = $derived.by(() => {
	const events: { slotId: string; status: (typeof modelsState.statuses)[string] }[] = [];
	for (const [slotId, status] of Object.entries(modelsState.statuses)) {
		if (!status) continue;
		if (dismissedEvents.has(slotId)) continue;
		if (status.type === "loading" || status.type === "ready" || status.type === "failed") {
			events.push({ slotId, status });
		}
	}
	return events;
});

$effect(() => {
	void devpulseState.data.recentProjects[0]?.id;
	void sessionsState.refresh();
});

$effect(() => {
	void chatState.activeSessionId;
	void devpulseState.data.recentProjects[0]?.id;
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
			<div class="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-1">
				<Text size="xs" weight="semibold" class="text-[var(--text-muted)]">CHAT</Text>
				<ChatActionsMenu />
			</div>
			<CortexMemoryStrip />
			<div class="flex min-h-0 flex-1 gap-2">
				<ChatSessionList />
				<ChatStream class="min-w-0" />
			</div>
			<ChatComposer />
		</div>
	</div>
</div>
