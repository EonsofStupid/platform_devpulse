<!--
  @feature ChatStream — scrollable messages
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { EmptyChatState, MessageBubble, TypingIndicator } from "../ui/index.js";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();

let root: HTMLDivElement | undefined = $state();

$effect(() => {
	if (!root) return;
	const n = chatState.messages.length;
	if (n === 0) return;
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
	{:else if chatState.blockMessages.length === 0}
		<EmptyChatState />
	{:else}
		{#each chatState.blockMessages as msg (msg.id)}
			<MessageBubble message={msg} mode={chatState.mode} />
		{/each}
	{/if}
	{#if chatState.sending}
		<TypingIndicator />
	{/if}
</div>
