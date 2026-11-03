<!--
  @feature ChatSessionList — grouped by project (single list for now); a new
  thread with one of your agents starts here.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import { projectsState } from "$lib/domains/app/projects/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import { SessionRow } from "../ui/index.js";
import ChatAgentPicker from "./ChatAgentPicker.svelte";
import ChatEndpointPicker from "./ChatEndpointPicker.svelte";

let { onSelect }: { onSelect?: () => void } = $props();
</script>

<Card variant="deep" class="flex min-h-0 w-full flex-col gap-2 p-2" aria-label="Chat sessions">
	<Text size="xs" weight="semibold" class="shrink-0 text-[var(--text-muted)] px-1">SESSIONS</Text>
	<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
	<ChatAgentPicker />
    <ChatEndpointPicker />
    {#if copyState.catalog}<Button variant="ghost" size="sm" disabled={!projectsState.activeProjectId} onclick={() => { chatState.setActiveSession(null); void chatState.loadActive(); }}>{copyState.catalog.chat.endpoints.new_local}</Button>{/if}
	<div class="flex flex-col gap-1">
	{#if sessionsState.loading}
		<Text size="xs" class="px-1">Loading…</Text>
	{:else if sessionsState.error}
		<Text size="xs" class="text-[var(--signal-error)] px-1">{sessionsState.error}</Text>
	{:else}
		{#each sessionsState.items.filter((session) => session.projectId === projectsState.activeProjectId) as s (s.id)}
			<SessionRow
				session={s}
				active={chatState.activeSessionId === s.id}
				onClick={() => {
					chatState.setActiveSession(s.id);
					void chatState.loadActive();
					onSelect?.();
				}}
			/>
		{/each}
	{/if}
	</div>
    </div>
</Card>
