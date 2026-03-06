<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame
  @layer lib

  @description
  Chat window frame with ColdLight glass styling.
  Renders in a separate Tauri child window.

  @since 1.0.0
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { getRecipe } from "$lib/design/recipes/index.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import {
	Badge,
	Heading,
	HStack,
} from "$lib/design/index.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const shell = getRecipe("shell.chat.default");
const slots = $derived(
	shell?.classes({
		surface: "glass-deep",
		material: "none",
		depth: "z2",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		size: "md",
		radius: "lg",
	}) ?? {},
);
</script>

<div
	class={slots.frame}
	data-layout="chat"
	data-state="open"
	data-engaged="true"
	data-context-collapsed="true"
	style="font-family: var(--font-sans);"
>
	<header data-slot="topbar" class={slots.topbar}>
		<HStack gap="2" align="center">
			<Heading level={6} size="xs" class="font-display text-[var(--text-primary)]">
				Maestro Chat
			</Heading>
		</HStack>
		<Badge
			intent="default"
			size="sm"
			class="gap-1.5"
			data-status={platformState.connectionStatus}
			title="Platform: {platformState.connectionStatus}"
		>
			<span
				class="status-dot h-2 w-2 rounded-full"
				data-status={platformState.connectionStatus}
				aria-hidden="true"
			></span>
		</Badge>
	</header>

	<main data-slot="chat-dashboard" class={slots.dashboard}>
		{@render children()}
	</main>
</div>

<style>
	.status-dot {
		box-shadow: 0 0 6px currentColor;
	}
	.status-dot[data-status="online"] {
		background-color: var(--color-teal-400);
	}
	.status-dot[data-status="offline"] {
		background-color: var(--signal-error);
	}
	.status-dot[data-status="hybrid"] {
		background-color: var(--color-purple-400);
	}
</style>
