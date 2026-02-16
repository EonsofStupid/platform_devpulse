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
import "../../styles/shell.css";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const shell = getRecipe("shell.chat.default");
const slots = $derived(
	shell?.classes({
		accent: "teal",
		surface: "glass",
		variant: "deep",
		size: "md",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "subtle",
	}) ?? {},
);
</script>

<div
	class={slots.frame}
	data-layout="chat"
	data-state="open"
	data-engaged="true"
	data-context-collapsed="true"
>
	<header data-slot="topbar" class={slots.topbar}>
		<span class="text-sm font-semibold text-[var(--text-primary)]" style:font-family="var(--font-display)">
			Maestro Chat
		</span>
	</header>

	<div data-slot="mode-selector" class={slots.modeSelector}>
		<!-- Mode buttons will be wired later -->
	</div>

	<main data-slot="chat-dashboard" class={slots.dashboard}>
		{@render children()}
	</main>

	<footer data-slot="chat-footer" class={slots.footer}>
		<input
			type="text"
			placeholder="Ask Maestro..."
			class="w-full"
		/>
	</footer>
</div>
