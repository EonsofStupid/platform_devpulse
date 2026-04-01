<!--
	@component Thread List
	@kind thread-list
	@layer block
	@category navigation
	@description Sidebar thread list with active state for chat navigation
	@container false
	@compound false
	@blockCategory navigation
	@defaultStyle sidebar-default
	@styleIds sidebar-default
	@requiredAxes backgroundColor, border
	@slots root:all
-->
<script lang="ts">
import Button from "$lib/design/components/button/Button.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { ThreadListProps } from "./types.js";

let { threads, activeId, onSelect, class: className }: ThreadListProps = $props();
</script>

<nav
	data-kind="thread-list"
	data-slot="root"
	aria-label="Chat threads"
	class={cn("flex flex-col gap-1 py-2", className)}
>
	{#each threads as thread (thread.id)}
		<button
			type="button"
			data-kind="thread-list"
			data-slot="item"
			data-active={thread.id === activeId || undefined}
			class={cn(
				"flex flex-col gap-0.5 px-3 py-2 text-left rounded-md transition-colors",
				thread.id === activeId
					? "bg-[var(--glass-deep)] border-l-2 border-l-[var(--accent-teal-main)] shadow-[var(--glow-dot-md)]"
					: "hover:bg-[var(--interaction-hover)]"
			)}
			onclick={() => onSelect?.(thread.id)}
		>
			<Text size="sm" weight={thread.id === activeId ? "semibold" : "normal"}>{thread.label}</Text>
			{#if thread.lastMessage}
				<Text size="xs" class="text-[var(--text-muted)] truncate">{thread.lastMessage}</Text>
			{/if}
			{#if thread.timestamp}
				<Text size="xs" class="text-[var(--text-muted)]">{thread.timestamp}</Text>
			{/if}
		</button>
	{/each}
</nav>
