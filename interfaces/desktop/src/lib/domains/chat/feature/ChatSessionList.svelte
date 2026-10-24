<!--
  @feature ChatSessionList — grouped by project (single list for now); a new
  thread with one of your agents starts here.
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import { SessionRow } from "../ui/index.js";
import ChatAgentPicker from "./ChatAgentPicker.svelte";
</script>

<div class="flex w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-[var(--border-subtle)] pr-2">
	<Text size="xs" weight="semibold" class="text-[var(--text-muted)] px-1">SESSIONS</Text>
	<ChatAgentPicker />
	{#if sessionsState.loading}
		<Text size="xs" class="px-1">Loading…</Text>
	{:else if sessionsState.error}
		<Text size="xs" class="text-[var(--signal-error)] px-1">{sessionsState.error}</Text>
	{:else}
		{#each sessionsState.items as s (s.id)}
			<SessionRow
				session={s}
				active={chatState.activeSessionId === s.id}
				onClick={() => {
					chatState.setActiveSession(s.id);
					void chatState.loadActive();
				}}
			/>
		{/each}
	{/if}
</div>
