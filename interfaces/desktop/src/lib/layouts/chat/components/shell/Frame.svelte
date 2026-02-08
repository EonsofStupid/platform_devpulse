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
import "../../styles/shell.css";
import "../../styles/surfaces.css";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();
</script>

<div
	data-layout="chat"
	data-state="open"
	data-engaged="true"
	data-context-collapsed="true"
>
	<header data-slot="topbar">
		<span class="text-sm font-semibold text-[var(--text-primary)]" style:font-family="var(--font-display)">
			Maestro Chat
		</span>
	</header>

	<div data-slot="mode-selector">
		<!-- Mode buttons will be wired later -->
	</div>

	<main data-slot="chat-dashboard">
		{@render children()}
	</main>

	<footer data-slot="chat-footer">
		<input
			type="text"
			placeholder="Ask Maestro..."
			class="w-full"
		/>
	</footer>
</div>

<style>
	/* Override position: fixed for standalone Tauri window */
	[data-layout="chat"] {
		position: relative;
		width: 100%;
		height: 100vh;
		bottom: auto;
		right: auto;
		border: 4px solid oklch(0.40 0.13 180 / 0.25);
		border-radius: var(--radius-lg);
		box-shadow:
			inset 2px 2px 4px oklch(0.80 0.06 195 / 0.15),
			inset -2px -2px 4px oklch(0.05 0.02 280 / 0.4),
			0 0 40px oklch(0.55 0.15 195 / 0.1),
			0 8px 32px oklch(0.02 0.01 280 / 0.5);
	}
</style>
