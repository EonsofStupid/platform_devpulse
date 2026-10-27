<!--
  @feature ChatStream — scrollable messages; an agent thread's running turn
  streams here under the agent's name.
-->
<script lang="ts">
import { cn } from "@devpulse/coldlight/utils";
import { providersState } from "$lib/domains/app/providers/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { agentsState } from "../data-access/agents.state.svelte.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { FailedTurn } from "../ui/failed-turn/index.js";
import { EmptyChatState, MessageBubble, TypingIndicator } from "../ui/index.js";
import ChatAgentTurn from "./ChatAgentTurn.svelte";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();

let root: HTMLDivElement | undefined = $state();

const thread = $derived(agentsState.thread(chatState.activeSessionId));
const agentTurn = $derived(
	agentsState.turn?.sessionId === chatState.activeSessionId ? agentsState.turn : null,
);
const author = $derived(
	(thread &&
		providersState.current?.report?.providers.find((p) => p.id === thread.providerId)?.name) ||
		(copyState.catalog?.chat.agents.local ?? ""),
);
const streaming = $derived(agentTurn ? agentTurn.text : chatState.streamingContent);
const retained = $derived(
	agentsState.retained.filter((answer) => answer.sessionId === chatState.activeSessionId),
);
const agentCopy = $derived(copyState.catalog?.chat.agents);

// Scroll on new messages or streaming content
$effect(() => {
	if (!root) return;
	// Track both message count and streaming content to trigger scroll
	void chatState.messages.length;
	void streaming;
	root.scrollTo({ top: root.scrollHeight, behavior: "smooth" });
});
</script>

<div
	bind:this={root}
	class={cn("flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-3 py-2", className)}
>
	{#if chatState.loading}
		<p class="text-sm text-[var(--text-muted)]">Loading…</p>
	{:else if chatState.error}
		<p class="text-sm text-[var(--signal-error)]">{chatState.error}</p>
	{:else if chatState.blockMessages.length === 0 && !chatState.isGenerating}
		<EmptyChatState />
	{:else}
		{#each chatState.blockMessages as msg (msg.id)}
			<MessageBubble message={msg} mode={chatState.mode} />
		{/each}
	{/if}
	{#if chatState.isGenerating && streaming}
		<MessageBubble
			message={{
				id: "streaming",
				variant: "ai",
				author,
				content: streaming,
			}}
			mode={chatState.mode}
		/>
	{:else if (chatState.isGenerating || chatState.sending) && !agentTurn}
		<TypingIndicator />
	{/if}
	{#if agentTurn}
		<ChatAgentTurn turn={agentTurn} agent={author} />
	{/if}
	{#if agentCopy}
		{#each retained as answer (answer.id)}
			<FailedTurn title={agentCopy.retained_answer} note={agentCopy.retained_note}
				message={answer.message} text={answer.text} dismissLabel={agentCopy.dismiss_retained}
				onDismiss={() => agentsState.dismissRetained(answer.id)} />
		{/each}
	{/if}
</div>
