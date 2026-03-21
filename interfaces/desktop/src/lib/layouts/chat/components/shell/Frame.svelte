<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame

  Chat window frame — ColdLight glass styling.
  Consumes shell.chat.default recipe. All styling token-backed.
  Renders in a separate Tauri child window.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const shell = getRecipe("shell.chat.default");
const slots = $derived(
	shell?.classes?.({
		...shell.defaults,
	}) ?? {},
);

const STATUS_COLORS: Record<string, string> = {
	online: "bg-[var(--color-teal-400)] shadow-[0_0_var(--status-dot-glow-radius)_var(--color-teal-400)]",
	offline: "bg-[var(--color-red-400)] shadow-[0_0_var(--status-dot-glow-radius)_var(--color-red-400)]",
	hybrid: "bg-[var(--color-purple-400)] shadow-[0_0_var(--status-dot-glow-radius)_var(--color-purple-400)]",
};
</script>

<div
	class={cn(slots.frame, "font-sans")}
	data-kind="shell"
	data-slot="frame"
	data-layout="chat"
	data-state="open"
>
	<header data-kind="shell" data-slot="topbar" class={slots.topbar}>
		<div class={hstack({ gap: "4", align: "center" })}>
			<Heading level={6} size="xs" class="font-display text-text-primary">
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

	<main data-kind="shell" data-slot="dashboard" class={slots.dashboard}>
		{@render children()}
	</main>
</div>
