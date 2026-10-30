<!--
  @feature ChatSessionList — grouped by project (single list for now); a new
  thread with one of your agents starts here.
-->
<script lang="ts">
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import { SessionRow } from "../ui/index.js";
import ChatAgentPicker from "./ChatAgentPicker.svelte";

let { onSelect }: { onSelect?: () => void } = $props();
</script>

<Card variant="deep" class="flex min-h-0 w-full flex-col gap-2 p-2" aria-label="Chat sessions">
	<div class="flex shrink-0 flex-col gap-2">
	<Text size="xs" weight="semibold" class="text-[var(--text-muted)] px-1">SESSIONS</Text>
	<ChatAgentPicker />
	</div>
	<div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
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
					onSelect?.();
				}}
			/>
		{/each}
	{/if}
	</div>
</Card>
