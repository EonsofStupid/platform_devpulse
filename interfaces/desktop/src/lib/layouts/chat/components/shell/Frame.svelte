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

const healthColors: Record<string, string> = {
	online: "var(--color-teal-400)",
	hybrid: "var(--color-purple-400)",
	offline: "var(--signal-error)",
};
const healthColor = $derived(healthColors[platformState.connectionStatus] ?? "var(--signal-error)");

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
		<span class="text-sm font-semibold" style="color: var(--text-primary); font-family: var(--font-display);">
			Maestro Chat
		</span>
		<span
			class="inline-block h-2 w-2 rounded-full"
			style="background: {healthColor}; box-shadow: 0 0 6px {healthColor};"
			title="Platform: {platformState.connectionStatus}"
		></span>
	</header>

	<main data-slot="chat-dashboard" class={slots.dashboard}>
		{@render children()}
	</main>
</div>
