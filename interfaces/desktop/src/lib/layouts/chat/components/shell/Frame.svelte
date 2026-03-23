<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame

  Chat window frame — ColdLight glass styling.
  Structural layout inline. Visual via token var() refs.
  Renders in a separate Tauri child window.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const STATUS_COLORS: Record<string, string> = {
	online: "bg-[var(--color-teal-400)] shadow-[0_0_var(--status-dot-glow-radius)_var(--color-teal-400)]",
	offline: "bg-[var(--signal-error)] shadow-[0_0_var(--status-dot-glow-radius)_var(--signal-error)]",
	hybrid: "bg-[var(--color-purple-400)] shadow-[0_0_var(--status-dot-glow-radius)_var(--color-purple-400)]",
};

const SLOTS = {
	frame: "grid h-screen w-screen overflow-hidden grid-rows-[auto_1fr] font-sans bg-[var(--surface-base)]",
	topbar: cn(
		"flex items-center justify-between",
		"h-10 px-3",
		"border-b border-[var(--border-soft)]",
	),
	dashboard: "overflow-y-auto scrollbar-thin",
} as const;
</script>

<div
	class={SLOTS.frame}
	data-kind="shell"
	data-slot="frame"
	data-layout="chat"
	data-state="open"
>
	<header data-kind="shell" data-slot="topbar" class={SLOTS.topbar}>
		<div class={hstack({ gap: "4", align: "center" })}>
			<Heading level={6} size="xs" class="font-display">
				Maestro Chat
			</Heading>
		</div>
		<Badge
			variant="neutral"
			size="sm"
			class="gap-1.5"
			data-status={platformState.connectionStatus}
			title="Platform: {platformState.connectionStatus}"
		>
			<span
				class={cn("h-2 w-2 rounded-full", STATUS_COLORS[platformState.connectionStatus] ?? STATUS_COLORS.offline)}
				aria-hidden="true"
			></span>
		</Badge>
	</header>

	<main data-kind="shell" data-slot="dashboard" class={SLOTS.dashboard}>
		{@render children()}
	</main>
</div>
