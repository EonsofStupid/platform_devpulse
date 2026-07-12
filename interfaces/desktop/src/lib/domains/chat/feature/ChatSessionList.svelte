<!--
  @feature ChatSessionList — grouped by project (single list for now)
-->
<script lang="ts">
import Text from "$lib/design/components/text/Text.svelte";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import { SessionRow } from "../ui/index.js";
</script>

<!-- Width rides the `chat` container seam (cqi): proportional in a wide
     window, floored at 8.5rem in a narrow one — never 40% of the frame. -->
<div class="flex w-[clamp(8.5rem,24cqi,13rem)] shrink-0 flex-col gap-1 overflow-y-auto border-r border-[var(--border-subtle)] pr-2">
	<Text size="xs" weight="semibold" class="text-[var(--text-muted)] px-1">SESSIONS</Text>
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
